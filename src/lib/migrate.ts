#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs SQL migration files in order and tracks applied migrations
 * Supports auto-migration on boot with locking to prevent concurrent runs
 */

import dotenv from 'dotenv'
import path from 'path'
import crypto from 'crypto'
import os from 'os'

// Load environment variables from .env.local (override existing env vars)
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })

import { getPool } from './db'
import fs from 'fs'

interface Migration {
  id: number
  filename: string
  path: string
  checksum?: string
}

interface MigrationStatus {
  currentVersion: number
  latestVersion: number
  appliedMigrations: number
  pendingMigrations: number
  status: 'up_to_date' | 'pending' | 'error'
  lastMigration?: {
    number: number
    filename: string
    appliedAt: string
  }
}

const LOCK_TIMEOUT_MS = parseInt(process.env.MIGRATION_LOCK_TIMEOUT_MS || '30000', 10)
// MIGRATION_TIMEOUT_MS reserved for future use (process.env.MIGRATION_TIMEOUT_MS || '300000')
const AUTO_MIGRATE_ENABLED = process.env.AUTO_MIGRATE !== 'false' // Default to true

/**
 * Calculate SHA-256 checksum of file content
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Get hostname for lock identification
 */
function getHostIdentifier(): string {
  return `${os.hostname()}-${process.pid}`
}

/**
 * Ensure migrations tracking table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_number INTEGER UNIQUE NOT NULL,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      application_version VARCHAR(20),
      execution_time_ms INTEGER,
      status VARCHAR(20) DEFAULT 'completed',
      error_message TEXT,
      checksum VARCHAR(64)
    )
  `)
}

/**
 * Acquire migration lock with timeout
 */
async function acquireLock(timeoutMs: number = LOCK_TIMEOUT_MS): Promise<boolean> {
  const pool = getPool()
  const startTime = Date.now()
  const hostId = getHostIdentifier()

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Try to release stale locks first
      await pool.query('SELECT release_stale_migration_locks()')

      // Try to acquire lock
      const result = await pool.query<{ acquire_migration_lock: boolean }>(
        'SELECT acquire_migration_lock($1, $2) as acquire_migration_lock',
        [hostId, process.pid]
      )

      if (result.rows[0].acquire_migration_lock) {
        console.log(`✓ Migration lock acquired by ${hostId}`)
        return true
      }

      // Lock not acquired, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      // If functions don't exist yet (bootstrap), continue without lock
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.log('⚠️  Migration lock functions not yet available (bootstrap mode)')
        return true
      }
      throw error
    }
  }

  console.error(`✗ Failed to acquire migration lock after ${timeoutMs}ms`)
  return false
}

/**
 * Release migration lock
 */
async function releaseLock(): Promise<void> {
  const pool = getPool()
  try {
    await pool.query('SELECT release_migration_lock()')
    console.log('✓ Migration lock released')
  } catch (error) {
    // Ignore errors if function doesn't exist (bootstrap scenario)
    if (!(error instanceof Error && error.message.includes('does not exist'))) {
      console.error('✗ Failed to release migration lock:', error)
    }
  }
}

async function getAppliedMigrations(): Promise<number[]> {
  const pool = getPool()
  const result = await pool.query<{ migration_number: number }>(
    'SELECT migration_number FROM schema_migrations ORDER BY migration_number'
  )
  return result.rows.map((row) => row.migration_number)
}

function getMigrationFiles(): Migration[] {
  const migrationsDir = path.join(process.cwd(), 'migrations')
  const files = fs.readdirSync(migrationsDir)

  return files
    .filter((file) => file.endsWith('.sql'))
    .map((filename) => {
      const match = filename.match(/^(\d+)_/)
      if (!match) {
        throw new Error(`Invalid migration filename: ${filename}. Must start with a number.`)
      }
      const filePath = path.join(migrationsDir, filename)
      const content = fs.readFileSync(filePath, 'utf-8')

      return {
        id: parseInt(match[1], 10),
        filename,
        path: filePath,
        checksum: calculateChecksum(content),
      }
    })
    .sort((a, b) => a.id - b.id)
}

async function runMigration(migration: Migration): Promise<void> {
  const pool = getPool()
  const sql = fs.readFileSync(migration.path, 'utf-8')
  const appVersion = process.env.npm_package_version || '0.1.0'

  console.log(`→ Running migration ${migration.id}: ${migration.filename}`)

  const startTime = Date.now()
  let status = 'completed'
  let errorMessage: string | null = null

  try {
    // Run the migration SQL
    await pool.query(sql)

    const executionTime = Date.now() - startTime

    // Record that this migration was applied
    await pool.query(
      `INSERT INTO schema_migrations
       (migration_number, filename, application_version, execution_time_ms, status, checksum)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [migration.id, migration.filename, appVersion, executionTime, status, migration.checksum]
    )

    console.log(`  ✓ Migration ${migration.id} completed successfully (${executionTime}ms)`)
  } catch (error) {
    const executionTime = Date.now() - startTime
    status = 'failed'
    errorMessage = error instanceof Error ? error.message : String(error)

    // Try to record the failure
    try {
      await pool.query(
        `INSERT INTO schema_migrations
         (migration_number, filename, application_version, execution_time_ms, status, error_message, checksum)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          migration.id,
          migration.filename,
          appVersion,
          executionTime,
          status,
          errorMessage,
          migration.checksum,
        ]
      )
    } catch (recordError) {
      console.error(`✗ Failed to record migration failure:`, recordError)
    }

    console.error(`  ✗ Migration ${migration.id} failed:`, error)
    throw error
  }
}

async function migrate(options: { acquireLock?: boolean } = {}): Promise<void> {
  const shouldAcquireLock = options.acquireLock !== false

  try {
    console.log('Starting database migrations...\n')

    // Ensure migrations tracking table exists
    await ensureMigrationsTable()

    // Acquire lock if requested
    if (shouldAcquireLock) {
      const lockAcquired = await acquireLock()
      if (!lockAcquired) {
        throw new Error('Failed to acquire migration lock')
      }
    }

    // Get list of already applied migrations
    const applied = await getAppliedMigrations()
    console.log(`✓ Already applied migrations: ${applied.length > 0 ? applied.join(', ') : 'none'}`)

    // Get all migration files
    const migrations = getMigrationFiles()
    console.log(`✓ Found ${migrations.length} migration file(s)\n`)

    // Run pending migrations
    const pending = migrations.filter((m) => !applied.includes(m.id))

    if (pending.length === 0) {
      console.log('✓ No pending migrations. Database is up to date.')
      return
    }

    console.log(`Running ${pending.length} pending migration(s)...\n`)

    for (const migration of pending) {
      await runMigration(migration)
    }

    console.log('\n✓ All migrations completed successfully')
    console.log(`✓ Current database version: ${migrations[migrations.length - 1].id}`)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    throw error
  } finally {
    // Release lock if we acquired it
    if (shouldAcquireLock) {
      await releaseLock()
    }

    // Close database connection only if running from CLI
    if (require.main === module) {
      const pool = getPool()
      await pool.end()
    }
  }
}

/**
 * Auto-migrate on application boot
 * This is called from instrumentation.ts during Next.js startup
 * Uses graceful error handling to avoid crashing the app
 */
export async function autoMigrate(): Promise<void> {
  if (!AUTO_MIGRATE_ENABLED) {
    console.log('[Migration] Auto-migration disabled (AUTO_MIGRATE=false)')
    return
  }

  console.log('[Migration] Starting auto-migration on boot...')

  try {
    // Add connection retry logic with exponential backoff
    let retries = 5
    let delay = 1000 // Start with 1 second

    while (retries > 0) {
      try {
        const pool = getPool()
        await pool.query('SELECT 1')
        break // Connection successful
      } catch (error) {
        retries--
        if (retries === 0) {
          throw new Error(`Database connection failed after 5 retries: ${error}`)
        }
        console.log(
          `[Migration] Database not ready, retrying in ${delay}ms... (${retries} retries left)`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }

    // Run migrations
    await migrate({ acquireLock: true })
    console.log('[Migration] Auto-migration completed successfully')
  } catch (error) {
    // Log error but don't crash the app
    console.error('[Migration] Auto-migration failed:', error)
    console.error('[Migration] Application will start anyway. Please run migrations manually.')
  }
}

/**
 * Get migration status
 * Returns current database version and pending migrations
 */
export async function getStatus(): Promise<MigrationStatus> {
  try {
    const pool = getPool()

    // Get applied migrations
    const applied = await getAppliedMigrations()

    // Get all migration files
    const migrations = getMigrationFiles()

    // Calculate status
    const currentVersion = applied.length > 0 ? Math.max(...applied) : 0
    const latestVersion = migrations.length > 0 ? migrations[migrations.length - 1].id : 0
    const pendingMigrations = migrations.filter((m) => !applied.includes(m.id))

    // Get last migration info
    let lastMigration
    if (applied.length > 0) {
      const result = await pool.query<{
        migration_number: number
        filename: string
        applied_at: string
      }>(
        `SELECT migration_number, filename, applied_at
         FROM schema_migrations
         ORDER BY applied_at DESC
         LIMIT 1`
      )
      if (result.rows.length > 0) {
        lastMigration = {
          number: result.rows[0].migration_number,
          filename: result.rows[0].filename,
          appliedAt: result.rows[0].applied_at,
        }
      }
    }

    return {
      currentVersion,
      latestVersion,
      appliedMigrations: applied.length,
      pendingMigrations: pendingMigrations.length,
      status: pendingMigrations.length === 0 ? 'up_to_date' : 'pending',
      lastMigration,
    }
  } catch (error) {
    console.error('Error getting migration status:', error)
    return {
      currentVersion: 0,
      latestVersion: 0,
      appliedMigrations: 0,
      pendingMigrations: 0,
      status: 'error',
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export { migrate }
