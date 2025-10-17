/**
 * Role Assignments API Routes
 * Handles role assignments with location scoping
 */
import { NextRequest, NextResponse } from 'next/server'
import { query, getPool } from '@/lib/db'
import { CreateRoleAssignmentSchema } from '@/lib/schemas/rbac'
import type { RoleAssignment } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { requireRole } from '@/lib/auth'
import { invalidateUserCache } from '@/lib/rbac'
import { z } from 'zod'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'

// Query schema for GET parameters
const RoleAssignmentQuerySchema = z.object({
  person_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  scope: z.enum(['global', 'location', 'specific_objects']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['assigned_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/role-assignments
 * List role assignments with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role to view role assignments
    await requireRole('admin')

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = RoleAssignmentQuerySchema.parse(params)
    const { person_id, group_id, role_id, scope, limit, offset, sort_by, sort_order } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number> = []
    let paramCount = 0

    if (person_id) {
      paramCount++
      conditions.push(`ra.person_id = $${paramCount}`)
      values.push(person_id)
    }

    if (group_id) {
      paramCount++
      conditions.push(`ra.group_id = $${paramCount}`)
      values.push(group_id)
    }

    if (role_id) {
      paramCount++
      conditions.push(`ra.role_id = $${paramCount}`)
      values.push(role_id)
    }

    if (scope) {
      paramCount++
      conditions.push(`ra.scope = $${paramCount}`)
      values.push(scope)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ra.${sort_by} ${sort_order.toUpperCase()}`

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
        ra.*,
        r.role_name,
        r.description as role_description,
        p.full_name as person_name,
        p.email as person_email,
        g.group_name,
        gb.full_name as granted_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', l.id,
              'location_name', l.location_name
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) as locations
      FROM role_assignments ra
      JOIN roles r ON ra.role_id = r.id
      LEFT JOIN people p ON ra.person_id = p.id
      LEFT JOIN groups g ON ra.group_id = g.id
      LEFT JOIN users u ON u.person_id = ra.person_id OR u.person_id = (SELECT person_id FROM group_members WHERE group_id = ra.group_id LIMIT 1)
      LEFT JOIN people gb ON ra.granted_by = (SELECT person_id FROM users WHERE id = ra.granted_by)
      LEFT JOIN role_assignment_locations ral ON ra.id = ral.assignment_id
      LEFT JOIN locations l ON ral.location_id = l.id
      ${whereClause}
      GROUP BY ra.id, r.role_name, r.description, p.full_name, p.email, g.group_name, gb.full_name
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<RoleAssignment & { locations: unknown }>(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM role_assignments ra ${whereClause}`
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
    console.error('Error fetching role assignments:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch role assignments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/role-assignments
 * Create a new role assignment with optional location scoping
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
    const validated = CreateRoleAssignmentSchema.parse(body)

    const pool = getPool()

    // Start transaction
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Check if role exists
      const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1', [
        validated.role_id,
      ])

      if (roleCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
      }

      // Check if assignment already exists
      const existingCheck = await client.query(
        `SELECT id FROM role_assignments
         WHERE role_id = $1 AND (
           (person_id = $2 AND person_id IS NOT NULL) OR
           (group_id = $3 AND group_id IS NOT NULL)
         )`,
        [validated.role_id, validated.person_id || null, validated.group_id || null]
      )

      if (existingCheck.rows.length > 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { success: false, message: 'Role assignment already exists' },
          { status: 409 }
        )
      }

      // Build INSERT query for role_assignments
      const fields: string[] = ['role_id', 'scope', 'granted_by']
      const placeholders: string[] = ['$1', '$2', '$3']
      const values: Array<string | Date | null> = [
        validated.role_id,
        validated.scope,
        session.user.id, // granted_by
      ]
      let paramCount = 3

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

      if (validated.assigned_date) {
        paramCount++
        fields.push('assigned_date')
        placeholders.push(`$${paramCount}`)
        values.push(validated.assigned_date)
      }

      if (validated.notes) {
        paramCount++
        fields.push('notes')
        placeholders.push(`$${paramCount}`)
        values.push(validated.notes)
      }

      // Insert role assignment
      const insertSql = `
        INSERT INTO role_assignments (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `

      const insertResult = await client.query<RoleAssignment>(insertSql, values)
      const assignment = insertResult.rows[0]

      // If location scoping, insert into role_assignment_locations
      if (
        validated.scope === 'location' &&
        validated.location_ids &&
        validated.location_ids.length > 0
      ) {
        for (const locationId of validated.location_ids) {
          await client.query(
            'INSERT INTO role_assignment_locations (assignment_id, location_id) VALUES ($1, $2)',
            [assignment.id, locationId]
          )
        }
      }

      await client.query('COMMIT')

      // Invalidate user permission cache
      if (validated.person_id) {
        // Get user_id from person_id
        const userResult = await query<{ id: string }>(
          'SELECT id FROM users WHERE person_id = $1',
          [validated.person_id]
        )
        if (userResult.rows[0]) {
          invalidateUserCache(userResult.rows[0].id)
        }
      }

      // Log admin action
      await logAdminAction({
        user_id: session.user.id,
        action: 'role_assignment_created',
        category: 'rbac',
        target_type: 'role_assignment',
        target_id: assignment.id,
        details: {
          role_id: validated.role_id,
          person_id: validated.person_id,
          group_id: validated.group_id,
          scope: validated.scope,
          location_ids: validated.location_ids,
        },
        ip_address: getIPAddress(request.headers),
        user_agent: getUserAgent(request.headers),
      })

      return NextResponse.json({ success: true, data: assignment }, { status: 201 })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating role assignment:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create role assignment' },
      { status: 500 }
    )
  }
}
