/**
 * PostgreSQL Database Connection Utility
 * Manages database connection pooling
 */

import { Pool, PoolClient, QueryResult } from 'pg'

// Singleton pool instance
let pool: Pool | null = null

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    console.log('[DB] Creating new pool with DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@'))

    pool = new Pool({
      connectionString: dbUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })

    // Log pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database error on idle client', err)
    })
  }

  return pool
}

/**
 * Execute a SQL query with parameters
 */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  const start = Date.now()
  const result = await pool.query<T>(text, params)
  const duration = Date.now() - start

  // Log slow queries (> 100ms)
  if (duration > 100) {
    console.warn(`Slow query (${duration}ms):`, text)
  }

  return result
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

/**
 * Execute a function within a database transaction
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close the database pool
 * Should be called when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()')
    return result.rows.length > 0
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}
