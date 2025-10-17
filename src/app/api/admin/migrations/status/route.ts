/**
 * API Route: /api/admin/migrations/status
 * Get database migration status
 * Requires admin or super_admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStatus } from '@/lib/migrate'

/**
 * GET /api/admin/migrations/status
 * Returns current migration status and version information
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get migration status
    const status = await getStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting migration status:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get migration status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
