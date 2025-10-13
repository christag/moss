/**
 * Object Permissions API Routes
 * Handles object-level permission overrides
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateObjectPermissionSchema } from '@/lib/schemas/rbac'
import type { ObjectPermission } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { requireRole } from '@/lib/auth'
import { invalidateUserCache } from '@/lib/rbac'
import { z } from 'zod'

// Query schema for GET parameters
const ObjectPermissionQuerySchema = z.object({
  object_type: z.string().optional(),
  object_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  permission_type: z.enum(['view', 'edit', 'delete', 'manage_permissions']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['granted_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/object-permissions
 * List object permissions with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role to view object permissions
    await requireRole('admin')

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = ObjectPermissionQuerySchema.parse(params)
    const {
      object_type,
      object_id,
      person_id,
      group_id,
      permission_type,
      limit,
      offset,
      sort_by,
      sort_order,
    } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number> = []
    let paramCount = 0

    if (object_type) {
      paramCount++
      conditions.push(`op.object_type = $${paramCount}`)
      values.push(object_type)
    }

    if (object_id) {
      paramCount++
      conditions.push(`op.object_id = $${paramCount}`)
      values.push(object_id)
    }

    if (person_id) {
      paramCount++
      conditions.push(`op.person_id = $${paramCount}`)
      values.push(person_id)
    }

    if (group_id) {
      paramCount++
      conditions.push(`op.group_id = $${paramCount}`)
      values.push(group_id)
    }

    if (permission_type) {
      paramCount++
      conditions.push(`op.permission_type = $${paramCount}`)
      values.push(permission_type)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByClause = `ORDER BY op.${sort_by} ${sort_order.toUpperCase()}`

    // Add pagination
    paramCount++
    const limitClause = `LIMIT $${paramCount}`
    values.push(limit)

    paramCount++
    const offsetClause = `OFFSET $${paramCount}`
    values.push(offset)

    // Execute query with JOINs to get related data
    const sql = `
      SELECT
        op.*,
        p.full_name as person_name,
        p.email as person_email,
        g.group_name,
        gb.full_name as granted_by_name
      FROM object_permissions op
      LEFT JOIN people p ON op.person_id = p.id
      LEFT JOIN groups g ON op.group_id = g.id
      LEFT JOIN people gb ON op.granted_by = (SELECT person_id FROM users WHERE id = op.granted_by)
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<
      ObjectPermission & {
        person_name?: string
        person_email?: string
        group_name?: string
        granted_by_name?: string
      }
    >(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM object_permissions op ${whereClause}`
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
    console.error('Error fetching object permissions:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch object permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/object-permissions
 * Grant an object-level permission to a person or group
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireRole('admin')

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreateObjectPermissionSchema.parse(body)

    // Check if permission already exists
    const existingCheck = await query<ObjectPermission>(
      `SELECT id FROM object_permissions
       WHERE object_type = $1 AND object_id = $2 AND permission_type = $3
       AND (
         (person_id = $4 AND person_id IS NOT NULL) OR
         (group_id = $5 AND group_id IS NOT NULL)
       )`,
      [
        validated.object_type,
        validated.object_id,
        validated.permission_type,
        validated.person_id || null,
        validated.group_id || null,
      ]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Object permission already exists' },
        { status: 409 }
      )
    }

    // Build INSERT query
    const fields: string[] = ['object_type', 'object_id', 'permission_type', 'granted_by']
    const placeholders: string[] = ['$1', '$2', '$3', '$4']
    const values: Array<string | Date | null> = [
      validated.object_type,
      validated.object_id,
      validated.permission_type,
      session.user.id, // granted_by
    ]
    let paramCount = 4

    if (validated.person_id) {
      paramCount++
      fields.push('person_id')
      placeholders.push(`$${paramCount}`)
      values.push(validated.person_id)
    }

    if (validated.group_id) {
      paramCount++
      fields.push('group_id')
      placeholders.push(`$${paramCount}`)
      values.push(validated.group_id)
    }

    if (validated.granted_date) {
      paramCount++
      fields.push('granted_date')
      placeholders.push(`$${paramCount}`)
      values.push(validated.granted_date)
    }

    // Insert object permission
    const insertSql = `
      INSERT INTO object_permissions (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const insertResult = await query<ObjectPermission>(insertSql, values)
    const permission = insertResult.rows[0]

    // Invalidate user permission cache
    if (validated.person_id) {
      // Get user_id from person_id
      const userResult = await query<{ id: string }>('SELECT id FROM users WHERE person_id = $1', [
        validated.person_id,
      ])
      if (userResult.rows[0]) {
        invalidateUserCache(userResult.rows[0].id)
      }
    }

    // If group permission, invalidate all group members
    if (validated.group_id) {
      const groupMembers = await query<{ user_id: string }>(
        `SELECT u.id as user_id
         FROM group_members gm
         JOIN users u ON u.person_id = gm.person_id
         WHERE gm.group_id = $1`,
        [validated.group_id]
      )

      for (const member of groupMembers.rows) {
        invalidateUserCache(member.user_id)
      }
    }

    return NextResponse.json({ success: true, data: permission }, { status: 201 })
  } catch (error) {
    console.error('Error creating object permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create object permission' },
      { status: 500 }
    )
  }
}
