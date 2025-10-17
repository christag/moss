/**
 * Test Database Connection API
 * Tests PostgreSQL connection with provided credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { z } from 'zod'
import type { DatabaseConfig, DatabaseConnectionTest } from '@/types'

// ============================================================================
// Validation Schema
// ============================================================================

const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================================================
// POST: Test Database Connection
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const config: DatabaseConfig = DatabaseConfigSchema.parse(body)

    // Build connection string
    // URL encode password to handle special characters
    const encodedPassword = encodeURIComponent(config.password)
    const connectionString = `postgresql://${config.username}:${encodedPassword}@${config.host}:${config.port}/${config.database}`

    console.log(
      `[Test Connection] Testing connection to ${config.host}:${config.port}/${config.database} as ${config.username}`
    )

    // Create a temporary pool to test the connection
    const testPool = new Pool({
      connectionString,
      max: 1, // Only need one connection for testing
      connectionTimeoutMillis: 5000, // 5 second timeout
      idleTimeoutMillis: 1000, // Close after 1 second
    })

    let client
    try {
      // Try to connect and run a simple query
      client = await testPool.connect()
      await client.query('SELECT NOW()')

      const result: DatabaseConnectionTest = {
        success: true,
        message: 'Connection successful',
      }

      return NextResponse.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('[Test Connection] Connection failed:', error)

      let message = 'Connection failed'
      let details = ''

      if (error instanceof Error) {
        // Parse common PostgreSQL errors
        if (error.message.includes('password authentication failed')) {
          message = 'Authentication failed'
          details = 'Invalid username or password'
        } else if (error.message.includes('does not exist')) {
          message = 'Database not found'
          details = `Database "${config.database}" does not exist`
        } else if (error.message.includes('ECONNREFUSED')) {
          message = 'Connection refused'
          details = `Cannot connect to ${config.host}:${config.port}. Is PostgreSQL running?`
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
          message = 'Connection timeout'
          details = `Cannot reach ${config.host}:${config.port}. Check host and firewall settings.`
        } else if (error.message.includes('ENOTFOUND')) {
          message = 'Host not found'
          details = `Cannot resolve hostname "${config.host}"`
        } else {
          message = 'Connection failed'
          details = error.message
        }
      }

      const result: DatabaseConnectionTest = {
        success: false,
        message,
        details,
      }

      return NextResponse.json(
        {
          success: false,
          data: result,
        },
        { status: 400 }
      )
    } finally {
      // Always clean up the test pool
      if (client) {
        client.release()
      }
      await testPool.end()
    }
  } catch (error) {
    console.error('[Test Connection] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test connection',
      },
      { status: 500 }
    )
  }
}
