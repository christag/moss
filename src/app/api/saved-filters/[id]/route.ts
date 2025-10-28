/**
 * Individual Saved Filter API Routes
 * GET /api/saved-filters/[id] - Get a specific saved filter
 * PATCH /api/saved-filters/[id] - Update a saved filter
 * DELETE /api/saved-filters/[id] - Delete a saved filter
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { requireApiScope } from '@/lib/apiAuth'
import { updateSavedFilterSchema, type SavedFilter } from '@/lib/schemas/saved-filters'

/**
 * GET /api/saved-filters/[id]
 * Get a specific saved filter
 * Requires: 'read' scope
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiScope(_request, ['read'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params

    const result = await query(
      `SELECT
        sf.*,
        u.email as created_by_email,
        COALESCE(p.first_name || ' ' || p.last_name, u.email) as created_by_full_name
      FROM saved_filters sf
      LEFT JOIN users u ON sf.user_id = u.id
      LEFT JOIN people p ON u.person_id = p.id
      WHERE sf.id = $1
        AND (sf.user_id = $2 OR sf.is_public = true)`,
      [id, authResult.userId]
    )

    if (result.rows.length === 0) {
      return errorResponse('Saved filter not found', 404)
    }

    return successResponse(result.rows[0] as SavedFilter)
  } catch (error) {
    console.error('Error fetching saved filter:', error)
    return errorResponse('Failed to fetch saved filter', 500)
  }
}

/**
 * PATCH /api/saved-filters/[id]
 * Update a saved filter (only owner can update)
 * Requires: 'write' scope
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiScope(request, ['write'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params

    // Verify ownership
    const ownerCheck = await query('SELECT user_id FROM saved_filters WHERE id = $1', [id])

    if (ownerCheck.rows.length === 0) {
      return errorResponse('Saved filter not found', 404)
    }

    if (ownerCheck.rows[0].user_id !== authResult.userId) {
      return errorResponse('You can only edit your own saved filters', 403)
    }

    const body = await parseRequestBody(request)
    const data = updateSavedFilterSchema.parse(body)

    // Build UPDATE query dynamically based on provided fields
    const updates: string[] = []
    const values: (string | boolean | null)[] = []
    let paramIndex = 1

    if (data.filter_name !== undefined) {
      updates.push(`filter_name = $${paramIndex++}`)
      values.push(data.filter_name)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(data.description)
    }
    if (data.filter_config !== undefined) {
      updates.push(`filter_config = $${paramIndex++}`)
      values.push(JSON.stringify(data.filter_config))
    }
    if (data.is_public !== undefined) {
      updates.push(`is_public = $${paramIndex++}`)
      values.push(data.is_public)
    }
    if (data.is_default !== undefined) {
      updates.push(`is_default = $${paramIndex++}`)
      values.push(data.is_default)
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400)
    }

    values.push(id)
    const updateQuery = `
      UPDATE saved_filters
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, values)

    return successResponse(result.rows[0] as SavedFilter, 'Saved filter updated successfully')
  } catch (error) {
    console.error('Error updating saved filter:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return errorResponse(error.message, 400)
    }
    return errorResponse('Failed to update saved filter', 500)
  }
}

/**
 * DELETE /api/saved-filters/[id]
 * Delete a saved filter (only owner can delete)
 * Requires: 'write' scope
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiScope(_request, ['write'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params

    // Verify ownership
    const ownerCheck = await query('SELECT user_id FROM saved_filters WHERE id = $1', [id])

    if (ownerCheck.rows.length === 0) {
      return errorResponse('Saved filter not found', 404)
    }

    if (ownerCheck.rows[0].user_id !== authResult.userId) {
      return errorResponse('You can only delete your own saved filters', 403)
    }

    await query('DELETE FROM saved_filters WHERE id = $1', [id])

    return successResponse({}, 'Saved filter deleted successfully')
  } catch (error) {
    console.error('Error deleting saved filter:', error)
    return errorResponse('Failed to delete saved filter', 500)
  }
}
