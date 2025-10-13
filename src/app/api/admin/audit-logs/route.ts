/**
 * API Route: Admin Audit Logs
 * GET - Retrieve admin audit logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasRole } from '@/lib/auth'
import { getAdminAuditLogs } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id') || undefined
    const action = searchParams.get('action') || undefined
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch audit logs
    const logs = await getAdminAuditLogs({
      user_id,
      action,
      category,
      limit,
      offset,
    })

    return NextResponse.json({ logs, count: logs.length })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
