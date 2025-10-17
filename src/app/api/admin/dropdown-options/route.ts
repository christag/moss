/**
 * API Route: /api/admin/dropdown-options
 * Manage dropdown field options (list, create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { CreateDropdownOptionSchema, QueryDropdownOptionsSchema } from '@/lib/schemas/admin'
import { query } from '@/lib/db'
import type { DropdownFieldOption } from '@/types'

/**
 * GET /api/admin/dropdown-options
 * List dropdown options with optional filtering
 *
 * Query params:
 * - object_type: Filter by object type
 * - field_name: Filter by field name
 * - is_active: Filter by active status (true/false)
 * - include_usage_count: Include usage counts (default: true)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100, max: 500)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const params = {
      object_type: searchParams.get('object_type'),
      field_name: searchParams.get('field_name'),
      is_active: searchParams.get('is_active'),
      include_usage_count: searchParams.get('include_usage_count'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }

    const validation = QueryDropdownOptionsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { object_type, field_name, is_active, include_usage_count, page, limit } = validation.data

    // Build WHERE clause
    const whereClauses: string[] = []
    const queryParams: unknown[] = []
    let paramCount = 1

    if (object_type) {
      whereClauses.push(`object_type = $${paramCount}`)
      queryParams.push(object_type)
      paramCount++
    }

    if (field_name) {
      whereClauses.push(`field_name = $${paramCount}`)
      queryParams.push(field_name)
      paramCount++
    }

    if (is_active !== undefined && is_active !== null) {
      whereClauses.push(`is_active = $${paramCount}`)
      queryParams.push(is_active)
      paramCount++
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Calculate pagination
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dropdown_field_options
      ${whereClause}
    `
    const countResult = await query<{ total: string }>(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get options
    const optionsQuery = `
      SELECT
        id,
        object_type,
        field_name,
        option_value,
        option_label,
        display_order,
        is_active,
        is_system,
        ${include_usage_count ? 'usage_count,' : '0 as usage_count,'}
        color,
        description,
        created_at,
        updated_at
      FROM dropdown_field_options
      ${whereClause}
      ORDER BY object_type, field_name, display_order, option_label
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `
    const optionsResult = await query<DropdownFieldOption>(optionsQuery, [
      ...queryParams,
      limit,
      offset,
    ])

    return NextResponse.json({
      success: true,
      data: {
        options: optionsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dropdown options:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dropdown options',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dropdown-options
 * Create a new dropdown option
 *
 * Body:
 * - object_type: Object type (e.g., 'devices', 'people')
 * - field_name: Field name in snake_case (e.g., 'device_type')
 * - option_value: Option value in snake_case (e.g., 'laptop')
 * - option_label: Display label (e.g., 'Laptop')
 * - display_order: Sort order (default: 0)
 * - color: Hex color (optional)
 * - description: Help text (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    // Parse and validate request body
    const body = await request.json()
    const validation = CreateDropdownOptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if option already exists
    const existingCheck = await query(
      `SELECT id FROM dropdown_field_options
       WHERE object_type = $1 AND field_name = $2 AND option_value = $3`,
      [data.object_type, data.field_name, data.option_value]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Option already exists for this field',
          field: 'option_value',
        },
        { status: 409 }
      )
    }

    // Insert new option
    const insertQuery = `
      INSERT INTO dropdown_field_options (
        object_type,
        field_name,
        option_value,
        option_label,
        display_order,
        color,
        description,
        is_active,
        is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
      RETURNING *
    `

    const result = await query<DropdownFieldOption>(insertQuery, [
      data.object_type,
      data.field_name,
      data.option_value,
      data.option_label,
      data.display_order ?? 0,
      data.color ?? null,
      data.description ?? null,
    ])

    const newOption = result.rows[0]

    return NextResponse.json(
      {
        success: true,
        message: 'Dropdown option created successfully',
        data: newOption,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dropdown option:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create dropdown option',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
