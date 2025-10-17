/**
 * Roles API Routes
 * Handles listing and creating roles
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateRoleSchema } from '@/lib/schemas/rbac'
import type { Role } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'

// Query schema for GET parameters
const RoleQuerySchema = z.object({
  search: z.string().optional(),
  is_system_role: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['role_name', 'created_at', 'is_system_role']).default('role_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/roles
 * List roles with optional filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = RoleQuerySchema.parse(params)
    const { search, is_system_role, limit, offset, sort_by, sort_order } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number | boolean> = []
    let paramCount = 0

    if (search) {
      paramCount++
      conditions.push(`(role_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`)
      values.push(`%${search}%`)
    }

    if (is_system_role !== undefined) {
      paramCount++
      conditions.push(`is_system_role = $${paramCount}`)
      values.push(is_system_role)
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
      SELECT * FROM roles
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<Role>(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM roles ${whereClause}`
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
    console.error('Error fetching roles:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch roles' }, { status: 500 })
  }
}

/**
 * POST /api/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreateRoleSchema.parse(body)

    // Build INSERT query
    const fields: string[] = []
    const placeholders: string[] = []
    const values: Array<string | boolean | Date | null> = []
    let paramCount = 0

    // Required field
    paramCount++
    fields.push('role_name')
    placeholders.push(`$${paramCount}`)
    values.push(validated.role_name)

    // Optional fields
    if (validated.description !== undefined) {
      paramCount++
      fields.push('description')
      placeholders.push(`$${paramCount}`)
      values.push(validated.description)
    }

    if (validated.is_system_role !== undefined) {
      paramCount++
      fields.push('is_system_role')
      placeholders.push(`$${paramCount}`)
      values.push(validated.is_system_role)
    }

    if (validated.created_date !== undefined) {
      paramCount++
      fields.push('created_date')
      placeholders.push(`$${paramCount}`)
      values.push(validated.created_date)
    }

    // Execute INSERT
    const sql = `
      INSERT INTO roles (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const result = await query<Role>(sql, values)
    const createdRole = result.rows[0]

    // Log admin action
    const session = await auth()
    if (session?.user?.id) {
      await logAdminAction({
        user_id: session.user.id,
        action: 'role_created',
        category: 'rbac',
        target_type: 'role',
        target_id: createdRole.id,
        details: {
          role_name: createdRole.role_name,
          description: createdRole.description,
          is_system_role: createdRole.is_system_role,
        },
        ip_address: getIPAddress(request.headers),
        user_agent: getUserAgent(request.headers),
      })
    }

    return NextResponse.json({ success: true, data: createdRole }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to create role' }, { status: 500 })
  }
}
