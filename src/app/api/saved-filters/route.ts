/**
 * Saved Filters API Routes
 * GET /api/saved-filters - List user's saved filters (+ public filters)
 * POST /api/saved-filters - Create a new saved filter
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { requireApiScope } from '@/lib/apiAuth'
import {
  createSavedFilterSchema,
  savedFilterQuerySchema,
  type SavedFilter,
} from '@/lib/schemas/saved-filters'

/**
 * GET /api/saved-filters
 * Returns user's own saved filters + public filters
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiScope(request, ['read'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = savedFilterQuerySchema.parse(searchParams)

    // Build WHERE clause
    const whereClauses: string[] = []
    const queryParams: (string | boolean | number)[] = []
    let paramIndex = 1

    // Filter by object type if specified
    if (params.object_type) {
      whereClauses.push(`object_type = $${paramIndex++}`)
      queryParams.push(params.object_type)
    }

    // Filter by public status if specified
    if (params.is_public !== undefined) {
      whereClauses.push(`is_public = $${paramIndex++}`)
      queryParams.push(params.is_public)
    }

    // Search in filter name and description
    if (params.search) {
      whereClauses.push(`(filter_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      queryParams.push(`%${params.search}%`)
      paramIndex++
    }

    // User can see their own filters OR public filters
    whereClauses.push(`(user_id = $${paramIndex++} OR is_public = true)`)
    queryParams.push(authResult.userId)

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByColumn = params.sort_by || 'filter_name'
    const orderDirection = params.sort_order || 'asc'
    const orderBy = `ORDER BY ${orderByColumn} ${orderDirection.toUpperCase()}`

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM saved_filters ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count as string)

    // Get paginated results
    const dataQuery = `
      SELECT
        sf.*,
        u.email as created_by_email,
        COALESCE(p.first_name || ' ' || p.last_name, u.email) as created_by_full_name
      FROM saved_filters sf
      LEFT JOIN users u ON sf.user_id = u.id
      LEFT JOIN people p ON u.person_id = p.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    queryParams.push(params.limit, params.offset)

    const result = await query(dataQuery, queryParams)

    return successResponse({
      saved_filters: result.rows as SavedFilter[],
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        has_more: params.offset + params.limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching saved filters:', error)
    return errorResponse('Failed to fetch saved filters', 500)
  }
}

/**
 * POST /api/saved-filters
 * Create a new saved filter
 * Requires: 'write' scope
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiScope(request, ['write'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await parseRequestBody(request)
    const data = createSavedFilterSchema.parse(body)

    // Insert new saved filter
    const result = await query(
      `INSERT INTO saved_filters (
        user_id,
        filter_name,
        description,
        object_type,
        filter_config,
        is_public,
        is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        authResult.userId,
        data.filter_name,
        data.description || null,
        data.object_type,
        JSON.stringify(data.filter_config),
        data.is_public,
        data.is_default,
      ]
    )

    const savedFilter = result.rows[0] as SavedFilter

    return successResponse(savedFilter, 'Saved filter created successfully')
  } catch (error) {
    console.error('Error creating saved filter:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return errorResponse(error.message, 400)
    }
    return errorResponse('Failed to create saved filter', 500)
  }
}
