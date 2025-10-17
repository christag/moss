/**
 * Setup Initialization API
 * Handles database initialization checks and creation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getInitializationStatus,
  initializeDatabase,
  testConnection,
  setDatabaseConfig,
  hasDatabaseConfig,
} from '@/lib/initDatabase'
import { z } from 'zod'
import type { DatabaseConfig } from '@/types'

// ============================================================================
// Validation Schema
// ============================================================================

const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
})

/**
 * GET /api/setup/init
 * Check database initialization status
 */
export async function GET() {
  try {
    // If no database config is available, return special status
    if (!hasDatabaseConfig()) {
      return NextResponse.json({
        success: true,
        data: {
          connectionOk: false,
          databaseExists: false,
          tablesExist: false,
          needsInitialization: true,
          needsConfig: true,
          message: 'Database configuration required. Please provide connection details.',
        },
      })
    }

    const status = await getInitializationStatus()

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        needsConfig: false,
      },
    })
  } catch (error) {
    console.error('[Setup Init] Error checking status:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check initialization status',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/setup/init
 * Initialize the database (create database and schema)
 * Optionally accepts database configuration in request body
 */
export async function POST(request: NextRequest) {
  try {
    // Check if database config is provided in request body
    const body = await request.json().catch(() => ({}))

    if (body.dbConfig) {
      console.log('[Setup Init] Using provided database configuration')
      const config: DatabaseConfig = DatabaseConfigSchema.parse(body.dbConfig)
      setDatabaseConfig(config)
    } else if (!hasDatabaseConfig()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database configuration required. Please provide connection details.',
        },
        { status: 400 }
      )
    }

    // First, test the connection
    const connectionTest = await testConnection()
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: connectionTest.message,
          details: connectionTest.details,
        },
        { status: 500 }
      )
    }

    // Proceed with initialization
    const result = await initializeDatabase()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          steps: result.steps,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      steps: result.steps,
    })
  } catch (error) {
    console.error('[Setup Init] Error initializing database:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid database configuration',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize database',
      },
      { status: 500 }
    )
  }
}
