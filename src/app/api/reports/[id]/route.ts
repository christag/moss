/**
 * Individual Report API Routes
 * GET /api/reports/[id] - Get a specific report
 * PATCH /api/reports/[id] - Update a report
 * DELETE /api/reports/[id] - Delete a report
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { UpdateCustomReportSchema } from '@/lib/schemas/reports'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { CustomReport } from '@/lib/schemas/reports'

/**
 * GET /api/reports/[id]
 * Get a specific saved report
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const { id } = await params

  try {
    const result = await query<CustomReport>(
      `
      SELECT
        r.*,
        p.full_name as created_by_name
      FROM custom_reports r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN people p ON u.person_id = p.id
      WHERE r.id = $1 AND (r.created_by = $2 OR r.is_public = true OR r.is_system = true)
    `,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return errorResponse('Report not found', undefined, 404)
    }

    return successResponse(result.rows[0], 'Report retrieved successfully')
  } catch (error) {
    console.error('Error fetching report:', error)
    return errorResponse('Failed to fetch report', undefined, 500)
  }
}

/**
 * PATCH /api/reports/[id]
 * Update a saved report
 * Requires: 'write' scope
 * Only the creator can update their own reports (unless system report)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  const { id } = await params

  try {
    // Check if report exists and user owns it
    const existingReport = await query<CustomReport>(`SELECT * FROM custom_reports WHERE id = $1`, [
      id,
    ])

    if (existingReport.rows.length === 0) {
      return errorResponse('Report not found', undefined, 404)
    }

    const report = existingReport.rows[0]

    // Cannot edit system reports
    if (report.is_system) {
      return errorResponse('Cannot edit system reports', undefined, 403)
    }

    // Only owner can edit
    if (report.created_by !== userId) {
      return errorResponse('You can only edit your own reports', undefined, 403)
    }

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdateCustomReportSchema.parse(body)

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 0

    if (validated.report_name !== undefined) {
      paramCount++
      updates.push(`report_name = $${paramCount}`)
      values.push(validated.report_name)
    }

    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }

    if (validated.object_type !== undefined) {
      paramCount++
      updates.push(`object_type = $${paramCount}`)
      values.push(validated.object_type)
    }

    if (validated.fields !== undefined) {
      paramCount++
      updates.push(`fields = $${paramCount}`)
      values.push(JSON.stringify(validated.fields))
    }

    if (validated.filters !== undefined) {
      paramCount++
      updates.push(`filters = $${paramCount}`)
      values.push(validated.filters ? JSON.stringify(validated.filters) : null)
    }

    if (validated.grouping !== undefined) {
      paramCount++
      updates.push(`grouping = $${paramCount}`)
      values.push(validated.grouping ? JSON.stringify(validated.grouping) : null)
    }

    if (validated.aggregations !== undefined) {
      paramCount++
      updates.push(`aggregations = $${paramCount}`)
      values.push(validated.aggregations ? JSON.stringify(validated.aggregations) : null)
    }

    if (validated.sorting !== undefined) {
      paramCount++
      updates.push(`sorting = $${paramCount}`)
      values.push(validated.sorting ? JSON.stringify(validated.sorting) : null)
    }

    if (validated.is_public !== undefined) {
      paramCount++
      updates.push(`is_public = $${paramCount}`)
      values.push(validated.is_public)
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', undefined, 400)
    }

    // Add updated_at
    paramCount++
    updates.push(`updated_at = NOW()`)

    // Add ID to values
    paramCount++
    values.push(id)

    const result = await query<CustomReport>(
      `
      UPDATE custom_reports
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    )

    return successResponse(result.rows[0], 'Report updated successfully')
  } catch (error) {
    console.error('Error updating report:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return errorResponse('Validation error', 'issues' in error ? error.issues : undefined, 400)
    }

    return errorResponse('Failed to update report', undefined, 500)
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a saved report
 * Requires: 'write' scope
 * Only the creator can delete their own reports (unless admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof NextResponse) return authResult

  const { userId, userRole } = authResult
  const { id } = await params

  try {
    // Check if report exists
    const existingReport = await query<CustomReport>(`SELECT * FROM custom_reports WHERE id = $1`, [
      id,
    ])

    if (existingReport.rows.length === 0) {
      return errorResponse('Report not found', undefined, 404)
    }

    const report = existingReport.rows[0]

    // Cannot delete system reports
    if (report.is_system) {
      return errorResponse('Cannot delete system reports', undefined, 403)
    }

    // Only owner or admin can delete
    const isAdmin = ['admin', 'super_admin'].includes(userRole)
    if (report.created_by !== userId && !isAdmin) {
      return errorResponse('You can only delete your own reports', undefined, 403)
    }

    // Delete report
    await query(`DELETE FROM custom_reports WHERE id = $1`, [id])

    return successResponse({ id }, 'Report deleted successfully')
  } catch (error) {
    console.error('Error deleting report:', error)
    return errorResponse('Failed to delete report', undefined, 500)
  }
}
