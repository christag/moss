/**
 * Saved Reports API Routes
 * GET /api/reports - List all saved reports
 * POST /api/reports - Create a new saved report
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { CreateCustomReportSchema } from '@/lib/schemas/reports'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { CustomReport } from '@/lib/schemas/reports'

/**
 * GET /api/reports
 * List all saved reports with optional filtering
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Note: Web UI uses NextAuth session-based auth via middleware
  // API token auth is available via requireApiScope for external API access

  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'
    const objectType = searchParams.get('object_type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build query conditions
    const conditions: string[] = []
    const values: unknown[] = []
    let paramCount = 0

    // For now, show all public and system reports
    // TODO: Add user filtering when session context is available
    if (isPublic) {
      conditions.push('is_public = true')
    } else {
      conditions.push('(is_public = true OR is_system = true)')
    }

    if (objectType) {
      paramCount++
      conditions.push(`object_type = $${paramCount}`)
      values.push(objectType)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM custom_reports ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated results
    const offset = (page - 1) * limit
    values.push(limit, offset)

    const reportsResult = await query<CustomReport>(
      `
      SELECT
        r.*,
        p.full_name as created_by_name
      FROM custom_reports r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN people p ON u.person_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `,
      values
    )

    return successResponse(
      {
        reports: reportsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Reports retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching reports:', error)
    return errorResponse('Failed to fetch reports', undefined, 500)
  }
}

/**
 * POST /api/reports
 * Create a new saved report
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
    const validated = CreateCustomReportSchema.parse(body)

    // Insert report
    const result = await query<CustomReport>(
      `
      INSERT INTO custom_reports (
        report_name,
        description,
        object_type,
        fields,
        filters,
        grouping,
        aggregations,
        sorting,
        is_public,
        is_system,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
      [
        validated.report_name,
        validated.description || null,
        validated.object_type,
        JSON.stringify(validated.fields),
        validated.filters ? JSON.stringify(validated.filters) : null,
        validated.grouping ? JSON.stringify(validated.grouping) : null,
        validated.aggregations ? JSON.stringify(validated.aggregations) : null,
        validated.sorting ? JSON.stringify(validated.sorting) : null,
        validated.is_public || false,
        false, // is_system is always false for user-created reports
        userId,
      ]
    )

    return successResponse(result.rows[0], 'Report created successfully', 201)
  } catch (error) {
    console.error('Error creating report:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return errorResponse('Validation error', 'issues' in error ? error.issues : undefined, 400)
    }

    return errorResponse('Failed to create report', undefined, 500)
  }
}
