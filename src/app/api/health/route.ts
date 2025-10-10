/**
 * Health Check API Endpoint
 * Tests database connectivity and system status
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api'
import { testConnection } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const dbConnected = await testConnection()

    if (!dbConnected) {
      return errorResponse('Database connection failed', undefined, 503)
    }

    return successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return errorResponse('Health check failed', error, 503)
  }
}
