/**
 * Permissions API Routes
 * Handles listing and creating permissions
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreatePermissionSchema } from '@/lib/schemas/rbac'
import type { Permission } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'

// Query schema for GET parameters
const PermissionQuerySchema = z.object({
  search: z.string().optional(),
  object_type: z.string().optional(),
  action: z.enum(['view', 'edit', 'delete', 'manage_permissions']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z
    .enum(['permission_name', 'object_type', 'action', 'created_at'])
    .default('object_type'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/permissions
 * List permissions with optional filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication (any logged-in user can view permissions)
    await requireRole('user')

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = PermissionQuerySchema.parse(params)
    const { search, object_type, action, limit, offset, sort_by, sort_order } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number> = []
    let paramCount = 0

    if (search) {
      paramCount++
      conditions.push(`(permission_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`)
      values.push(`%${search}%`)
    }

    if (object_type) {
      paramCount++
      conditions.push(`object_type = $${paramCount}`)
      values.push(object_type)
    }

    if (action) {
      paramCount++
      conditions.push(`action = $${paramCount}`)
      values.push(action)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Add pagination
    paramCount++
    const limitClause = `LIMIT $${paramCount}`
    values.push(limit)

    paramCount++
    const offsetClause = `OFFSET $${paramCount}`
    values.push(offset)

    // Execute query
    const sql = `
      SELECT * FROM permissions
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<Permission>(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM permissions ${whereClause}`
    const countResult = await query<{ total: string }>(countSql, values.slice(0, paramCount - 2))
    const total = parseInt(countResult.rows[0]?.total || '0')

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + result.rows.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/permissions
 * Create a new permission (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require super_admin role
    await requireRole('super_admin')

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreatePermissionSchema.parse(body)

    // Check if permission already exists
    const existingCheck = await query<Permission>(
      `SELECT id FROM permissions
       WHERE object_type = $1 AND action = $2`,
      [validated.object_type, validated.action]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Permission for ${validated.action} on ${validated.object_type} already exists`,
        },
        { status: 409 }
      )
    }

    // Build INSERT query
    const fields: string[] = []
    const placeholders: string[] = []
    const values: Array<string | null> = []
    let paramCount = 0

    // Required fields
    paramCount++
    fields.push('permission_name')
    placeholders.push(`$${paramCount}`)
    values.push(validated.permission_name)

    paramCount++
    fields.push('object_type')
    placeholders.push(`$${paramCount}`)
    values.push(validated.object_type)

    paramCount++
    fields.push('action')
    placeholders.push(`$${paramCount}`)
    values.push(validated.action)

    // Optional fields
    if (validated.description !== undefined) {
      paramCount++
      fields.push('description')
      placeholders.push(`$${paramCount}`)
      values.push(validated.description)
    }

    // Execute INSERT
    const sql = `
      INSERT INTO permissions (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const result = await query<Permission>(sql, values)

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create permission' },
      { status: 500 }
    )
  }
}
