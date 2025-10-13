/**
 * Setup Initialization API
 * Handles database initialization checks and creation
 */

import { NextResponse } from 'next/server'
import { getInitializationStatus, initializeDatabase, testConnection } from '@/lib/initDatabase'

/**
 * GET /api/setup/init
 * Check database initialization status
 */
export async function GET() {
  try {
    const status = await getInitializationStatus()

    return NextResponse.json({
      success: true,
      data: status,
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
 */
export async function POST() {
  try {
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
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize database',
      },
      { status: 500 }
    )
  }
}
