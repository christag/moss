#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs SQL migration files in order and tracks applied migrations
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (override existing env vars)
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })

import { getPool } from './db'
import fs from 'fs'

interface Migration {
  id: number
  filename: string
  path: string
}

async function ensureMigrationsTable(): Promise<void> {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_number INTEGER UNIQUE NOT NULL,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
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
      return {
        id: parseInt(match[1], 10),
        filename,
        path: path.join(migrationsDir, filename),
      }
    })
    .sort((a, b) => a.id - b.id)
}

async function runMigration(migration: Migration): Promise<void> {
  const pool = getPool()
  const sql = fs.readFileSync(migration.path, 'utf-8')

  console.log(`Running migration ${migration.id}: ${migration.filename}`)

  try {
    // Run the migration SQL
    await pool.query(sql)

    // Record that this migration was applied
    await pool.query('INSERT INTO schema_migrations (migration_number, filename) VALUES ($1, $2)', [
      migration.id,
      migration.filename,
    ])

    console.log(`✓ Migration ${migration.id} completed successfully`)
  } catch (error) {
    console.error(`✗ Migration ${migration.id} failed:`, error)
    throw error
  }
}

async function migrate(): Promise<void> {
  try {
    console.log('Starting database migrations...\n')

    // Ensure migrations tracking table exists
    await ensureMigrationsTable()

    // Get list of already applied migrations
    const applied = await getAppliedMigrations()
    console.log(`Already applied migrations: ${applied.length > 0 ? applied.join(', ') : 'none'}`)

    // Get all migration files
    const migrations = getMigrationFiles()
    console.log(`Found ${migrations.length} migration file(s)\n`)

    // Run pending migrations
    const pending = migrations.filter((m) => !applied.includes(m.id))

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.')
      return
    }

    console.log(`Running ${pending.length} pending migration(s)...\n`)

    for (const migration of pending) {
      await runMigration(migration)
    }

    console.log('\n✓ All migrations completed successfully')
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    process.exit(1)
  } finally {
    // Close database connection
    const pool = getPool()
    await pool.end()
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate()
}

export { migrate }
