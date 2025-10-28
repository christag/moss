/**
 * Dashboard Detail API Routes
 * GET /api/dashboards/[id] - Get a specific dashboard
 * PATCH /api/dashboards/[id] - Update a dashboard
 * DELETE /api/dashboards/[id] - Delete a dashboard
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { UpdateCustomDashboardSchema } from '@/lib/schemas/reports'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { CustomDashboard } from '@/lib/schemas/reports'

/**
 * GET /api/dashboards/[id]
 * Get a specific dashboard by ID
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof NextResponse) return authResult

  try {
    const result = await query<CustomDashboard>(
      `
      SELECT
        d.*,
        p.full_name as created_by_name
      FROM custom_dashboards d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN people p ON u.person_id = p.id
      WHERE d.id = $1
    `,
      [id]
    )

    if (result.rows.length === 0) {
      return errorResponse('Dashboard not found', undefined, 404)
    }

    return successResponse(result.rows[0], 'Dashboard retrieved successfully')
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return errorResponse('Failed to fetch dashboard', undefined, 500)
  }
}

/**
 * PATCH /api/dashboards/[id]
 * Update a dashboard
 * Requires: 'write' scope
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof NextResponse) return authResult

  try {
    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdateCustomDashboardSchema.parse(body)

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 0

    if (validated.dashboard_name !== undefined) {
      paramCount++
      updates.push(`dashboard_name = $${paramCount}`)
      values.push(validated.dashboard_name)
    }

    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }

    if (validated.layout !== undefined) {
      paramCount++
      updates.push(`layout = $${paramCount}`)
      values.push(JSON.stringify(validated.layout))
    }

    if (validated.widgets !== undefined) {
      paramCount++
      updates.push(`widgets = $${paramCount}`)
      values.push(JSON.stringify(validated.widgets))
    }

    if (validated.is_default !== undefined) {
      paramCount++
      updates.push(`is_default = $${paramCount}`)
      values.push(validated.is_default)
    }

    if (validated.is_public !== undefined) {
      paramCount++
      updates.push(`is_public = $${paramCount}`)
      values.push(validated.is_public)
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', undefined, 400)
    }

    // Add updated_at timestamp
    paramCount++
    updates.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())

    // Add ID to values
    paramCount++
    values.push(id)

    const result = await query<CustomDashboard>(
      `
      UPDATE custom_dashboards
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    )

    if (result.rows.length === 0) {
      return errorResponse('Dashboard not found', undefined, 404)
    }

    return successResponse(result.rows[0], 'Dashboard updated successfully')
  } catch (error) {
    console.error('Error updating dashboard:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return errorResponse('Validation error', 'issues' in error ? error.issues : undefined, 400)
    }

    return errorResponse('Failed to update dashboard', undefined, 500)
  }
}

/**
 * DELETE /api/dashboards/[id]
 * Delete a dashboard
 * Requires: 'write' scope
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof NextResponse) return authResult

  try {
    const result = await query(
      `
      DELETE FROM custom_dashboards
      WHERE id = $1
      RETURNING id
    `,
      [id]
    )

    if (result.rows.length === 0) {
      return errorResponse('Dashboard not found', undefined, 404)
    }

    return successResponse(null, 'Dashboard deleted successfully')
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return errorResponse('Failed to delete dashboard', undefined, 500)
  }
}
