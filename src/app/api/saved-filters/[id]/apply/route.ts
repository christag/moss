/**
 * Apply Saved Filter API Route
 * POST /api/saved-filters/[id]/apply - Record usage of a saved filter
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireApiScope } from '@/lib/apiAuth'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * POST /api/saved-filters/[id]/apply
 * Records that a filter has been applied (updates last_used_at and use_count)
 * Requires: 'read' scope
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiScope(_request, ['read'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Verify filter exists and user has access
    const filterCheck = await query(
      `SELECT id FROM saved_filters
       WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
      [params.id, authResult.userId]
    )

    if (filterCheck.rows.length === 0) {
      return errorResponse('Saved filter not found', 404)
    }

    // Update usage tracking
    await query(
      `UPDATE saved_filters
       SET last_used_at = CURRENT_TIMESTAMP,
           use_count = use_count + 1
       WHERE id = $1`,
      [params.id]
    )

    return successResponse({}, 'Filter usage recorded')
  } catch (error) {
    console.error('Error recording filter usage:', error)
    return errorResponse('Failed to record filter usage', 500)
  }
}
