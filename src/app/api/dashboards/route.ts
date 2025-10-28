/**
 * Dashboards API Routes
 * GET /api/dashboards - List all dashboards
 * POST /api/dashboards - Create a new dashboard
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { CreateCustomDashboardSchema } from '@/lib/schemas/reports'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { CustomDashboard } from '@/lib/schemas/reports'

/**
 * GET /api/dashboards
 * List all dashboards with optional filtering
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'

    // Build query
    let whereClause = ''
    const values: unknown[] = []

    if (isPublic) {
      whereClause = 'WHERE is_public = true'
    } else {
      // Show user's own dashboards + public dashboards
      whereClause = 'WHERE (created_by = $1 OR is_public = true)'
      values.push(userId)
    }

    const dashboardsResult = await query<CustomDashboard>(
      `
      SELECT
        d.*,
        p.full_name as created_by_name
      FROM custom_dashboards d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN people p ON u.person_id = p.id
      ${whereClause}
      ORDER BY d.is_default DESC, d.created_at DESC
    `,
      values
    )

    return successResponse(
      {
        dashboards: dashboardsResult.rows,
      },
      'Dashboards retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return errorResponse('Failed to fetch dashboards', undefined, 500)
  }
}

/**
 * POST /api/dashboards
 * Create a new dashboard
 * Requires: 'write' scope
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult

  try {
    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreateCustomDashboardSchema.parse(body)

    // Insert dashboard
    const result = await query<CustomDashboard>(
      `
      INSERT INTO custom_dashboards (
        dashboard_name,
        description,
        layout,
        widgets,
        is_default,
        is_public,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        validated.dashboard_name,
        validated.description || null,
        JSON.stringify(validated.layout),
        JSON.stringify(validated.widgets),
        validated.is_default || false,
        validated.is_public || false,
        userId,
      ]
    )

    return successResponse(result.rows[0], 'Dashboard created successfully', 201)
  } catch (error) {
    console.error('Error creating dashboard:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return errorResponse('Validation error', 'issues' in error ? error.issues : undefined, 400)
    }

    return errorResponse('Failed to create dashboard', undefined, 500)
  }
}
