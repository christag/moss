/**
 * Database Initialization Module
 * Handles first-time database setup and schema creation
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'

// Parse database connection info from DATABASE_URL or individual env vars
function parseConnectionInfo() {
  // If DATABASE_URL is provided, parse it
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL)
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      }
    } catch (error) {
      console.error('[InitDB] Failed to parse DATABASE_URL:', error)
      // Fall through to use individual env vars
    }
  }

  // Use individual environment variables or defaults
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'moss',
  }
}

const connectionInfo = parseConnectionInfo()
const DB_HOST = connectionInfo.host
const DB_PORT = connectionInfo.port
const DB_USER = connectionInfo.user
const DB_PASSWORD = connectionInfo.password
const DB_NAME = connectionInfo.database

/**
 * Connection pool to postgres database (for admin operations)
 */
function getAdminPool(): Pool {
  return new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres', // Connect to postgres DB for admin operations
    max: 5,
    connectionTimeoutMillis: 10000, // 10 second timeout
  })
}

/**
 * Connection pool to moss database (for schema operations)
 */
function getMossPool(): Pool {
  return new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    max: 5,
    connectionTimeoutMillis: 10000,
  })
}

/**
 * Check if the moss database exists
 */
export async function checkDatabaseExists(): Promise<boolean> {
  const pool = getAdminPool()
  try {
    const result = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME])
    return result.rows.length > 0
  } catch (error) {
    console.error('[InitDB] Error checking database existence:', error)
    throw new Error('Failed to check database existence')
  } finally {
    await pool.end()
  }
}

/**
 * Create the moss database
 */
export async function createDatabase(): Promise<void> {
  const pool = getAdminPool()
  try {
    console.log(`[InitDB] Creating database: ${DB_NAME}`)
    await pool.query(`CREATE DATABASE ${DB_NAME}`)
    console.log(`[InitDB] ✓ Database ${DB_NAME} created successfully`)
  } catch (error: unknown) {
    // If database already exists (code 42P04), that's okay
    if ((error as { code?: string }).code === '42P04') {
      console.log(`[InitDB] Database ${DB_NAME} already exists`)
      return
    }
    console.error('[InitDB] Error creating database:', error)
    throw new Error(`Failed to create database: ${(error as Error).message}`)
  } finally {
    await pool.end()
  }
}

/**
 * Check if tables exist in the moss database
 */
export async function checkTablesExist(): Promise<boolean> {
  const pool = getMossPool()
  try {
    // Check if key tables exist (we'll check for 'users' and 'companies' as indicators)
    const result = await pool.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'companies', 'devices', 'system_settings')
    `)
    const tableCount = parseInt(result.rows[0].table_count)
    return tableCount >= 4 // All 4 core tables should exist
  } catch (error) {
    // If we can't connect to the database, it might not exist yet
    console.error('[InitDB] Error checking tables:', error)
    return false
  } finally {
    await pool.end()
  }
}

/**
 * Execute SQL from dbsetup.sql to create all tables and initial data
 */
export async function initializeSchema(): Promise<void> {
  const pool = getMossPool()
  try {
    console.log('[InitDB] Reading dbsetup.sql...')

    // Read dbsetup.sql from project root
    const dbsetupPath = path.join(process.cwd(), 'dbsetup.sql')

    if (!fs.existsSync(dbsetupPath)) {
      throw new Error('dbsetup.sql not found in project root')
    }

    const sqlContent = fs.readFileSync(dbsetupPath, 'utf8')

    console.log('[InitDB] Executing schema creation...')

    // Execute the entire SQL file
    await pool.query(sqlContent)

    console.log('[InitDB] ✓ Base schema created successfully')

    // Run critical migrations that create users and system_settings tables
    console.log('[InitDB] Running critical migrations...')

    const migrationsDir = path.join(process.cwd(), 'migrations')
    const criticalMigrations = ['002_add_authentication.sql', '003_add_admin_settings.sql']

    for (const migrationFile of criticalMigrations) {
      const migrationPath = path.join(migrationsDir, migrationFile)
      if (fs.existsSync(migrationPath)) {
        console.log(`[InitDB] Running ${migrationFile}...`)
        const migrationSql = fs.readFileSync(migrationPath, 'utf8')
        await pool.query(migrationSql)
        console.log(`[InitDB] ✓ ${migrationFile} completed`)
      } else {
        console.warn(`[InitDB] Migration ${migrationFile} not found, skipping`)
      }
    }

    console.log('[InitDB] ✓ System settings initialized')
  } catch (error: unknown) {
    console.error('[InitDB] Error initializing schema:', error)
    throw new Error(`Failed to initialize schema: ${(error as Error).message}`)
  } finally {
    await pool.end()
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<{
  success: boolean
  message: string
  details?: {
    host: string
    port: number
    database: string
  }
}> {
  const pool = getAdminPool()
  try {
    await pool.query('SELECT 1')
    await pool.end()
    return {
      success: true,
      message: 'Database connection successful',
      details: {
        host: DB_HOST,
        port: DB_PORT,
        database: 'postgres',
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: `Database connection failed: ${(error as Error).message}`,
      details: {
        host: DB_HOST,
        port: DB_PORT,
        database: 'postgres',
      },
    }
  }
}

/**
 * Get complete initialization status
 */
export async function getInitializationStatus(): Promise<{
  connectionOk: boolean
  databaseExists: boolean
  tablesExist: boolean
  needsInitialization: boolean
  message: string
}> {
  try {
    // Step 1: Test connection
    const connectionTest = await testConnection()
    if (!connectionTest.success) {
      return {
        connectionOk: false,
        databaseExists: false,
        tablesExist: false,
        needsInitialization: true,
        message: connectionTest.message,
      }
    }

    // Step 2: Check if database exists
    const databaseExists = await checkDatabaseExists()
    if (!databaseExists) {
      return {
        connectionOk: true,
        databaseExists: false,
        tablesExist: false,
        needsInitialization: true,
        message: `Database '${DB_NAME}' does not exist and needs to be created`,
      }
    }

    // Step 3: Check if tables exist
    const tablesExist = await checkTablesExist()
    if (!tablesExist) {
      return {
        connectionOk: true,
        databaseExists: true,
        tablesExist: false,
        needsInitialization: true,
        message: 'Database exists but tables need to be created',
      }
    }

    // Everything is good
    return {
      connectionOk: true,
      databaseExists: true,
      tablesExist: true,
      needsInitialization: false,
      message: 'Database is fully initialized',
    }
  } catch (error: unknown) {
    return {
      connectionOk: false,
      databaseExists: false,
      tablesExist: false,
      needsInitialization: true,
      message: `Error checking status: ${(error as Error).message}`,
    }
  }
}

/**
 * Perform complete database initialization
 * Creates database and schema if needed
 */
export async function initializeDatabase(): Promise<{
  success: boolean
  message: string
  steps: string[]
}> {
  const steps: string[] = []

  try {
    // Step 1: Check if database exists
    const databaseExists = await checkDatabaseExists()
    if (!databaseExists) {
      steps.push('Creating database...')
      await createDatabase()
      steps.push('✓ Database created')
    } else {
      steps.push('✓ Database already exists')
    }

    // Step 2: Check if tables exist
    const tablesExist = await checkTablesExist()
    if (!tablesExist) {
      steps.push('Creating database schema...')
      await initializeSchema()
      steps.push('✓ Schema created')
      steps.push('✓ System settings initialized')
    } else {
      steps.push('✓ Tables already exist')
    }

    return {
      success: true,
      message: 'Database initialized successfully',
      steps,
    }
  } catch (error: unknown) {
    steps.push(`✗ Error: ${(error as Error).message}`)
    return {
      success: false,
      message: (error as Error).message,
      steps,
    }
  }
}
