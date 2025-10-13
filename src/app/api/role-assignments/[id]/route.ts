/**
 * Individual Role Assignment API Routes
 * Handles GET, PATCH, DELETE for specific role assignments
 */
import { NextRequest, NextResponse } from 'next/server'
import { query, getPool } from '@/lib/db'
import { UpdateRoleAssignmentSchema } from '@/lib/schemas/rbac'
import type { RoleAssignment } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { requireRole } from '@/lib/auth'
import { invalidateUserCache } from '@/lib/rbac'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/role-assignments/:id
 * Get a single role assignment with all related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = params

    // Query with JOINs to get all related data
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
      LEFT JOIN people gb ON ra.granted_by = (SELECT person_id FROM users WHERE id = ra.granted_by)
      LEFT JOIN role_assignment_locations ral ON ra.id = ral.assignment_id
      LEFT JOIN locations l ON ral.location_id = l.id
      WHERE ra.id = $1
      GROUP BY ra.id, r.role_name, r.description, p.full_name, p.email, g.group_name, gb.full_name
    `

    const result = await query<RoleAssignment & { locations: unknown }>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Role assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching role assignment:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch role assignment' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/role-assignments/:id
 * Update a role assignment's scope or locations
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = await params

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdateRoleAssignmentSchema.parse(body)

    const pool = getPool()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Check if assignment exists
      const existingResult = await client.query<RoleAssignment>(
        'SELECT * FROM role_assignments WHERE id = $1',
        [id]
      )

      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { success: false, message: 'Role assignment not found' },
          { status: 404 }
        )
      }

      const existing = existingResult.rows[0]

      // Build UPDATE query dynamically
      const fields: string[] = []
      const values: Array<string | Date | null> = []
      let paramCount = 0

      if (validated.scope !== undefined) {
        paramCount++
        fields.push(`scope = $${paramCount}`)
        values.push(validated.scope)
      }

      if (validated.assigned_date !== undefined) {
        paramCount++
        fields.push(`assigned_date = $${paramCount}`)
        values.push(validated.assigned_date)
      }

      if (validated.notes !== undefined) {
        paramCount++
        fields.push(`notes = $${paramCount}`)
        values.push(validated.notes)
      }

      // Add updated_at
      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      if (fields.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { success: false, message: 'No fields to update' },
          { status: 400 }
        )
      }

      // Add id parameter for WHERE clause
      paramCount++
      values.push(id)

      // Update role assignment
      const updateSql = `
        UPDATE role_assignments
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `

      const updateResult = await client.query<RoleAssignment>(updateSql, values)
      const updated = updateResult.rows[0]

      // Handle location scoping changes
      if (validated.scope !== undefined || validated.location_ids !== undefined) {
        // If scope is changing away from 'location' or new location_ids provided
        if (
          (validated.scope !== undefined && validated.scope !== 'location') ||
          validated.location_ids !== undefined
        ) {
          // Delete existing location assignments
          await client.query('DELETE FROM role_assignment_locations WHERE assignment_id = $1', [id])

          // Insert new locations if scope is 'location'
          const finalScope = validated.scope !== undefined ? validated.scope : existing.scope
          if (
            finalScope === 'location' &&
            validated.location_ids &&
            validated.location_ids.length > 0
          ) {
            for (const locationId of validated.location_ids) {
              await client.query(
                'INSERT INTO role_assignment_locations (assignment_id, location_id) VALUES ($1, $2)',
                [id, locationId]
              )
            }
          }
        }
      }

      await client.query('COMMIT')

      // Invalidate user permission cache
      if (existing.person_id) {
        // Get user_id from person_id
        const userResult = await query<{ id: string }>(
          'SELECT id FROM users WHERE person_id = $1',
          [existing.person_id]
        )
        if (userResult.rows[0]) {
          invalidateUserCache(userResult.rows[0].id)
        }
      }

      // If group assignment, invalidate all group members
      if (existing.group_id) {
        const groupMembers = await query<{ user_id: string }>(
          `SELECT u.id as user_id
           FROM group_members gm
           JOIN users u ON u.person_id = gm.person_id
           WHERE gm.group_id = $1`,
          [existing.group_id]
        )

        for (const member of groupMembers.rows) {
          invalidateUserCache(member.user_id)
        }
      }

      return NextResponse.json({ success: true, data: updated })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating role assignment:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update role assignment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/role-assignments/:id
 * Revoke a role assignment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = params

    const pool = getPool()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get assignment details before deleting
      const assignmentResult = await client.query<RoleAssignment>(
        'SELECT * FROM role_assignments WHERE id = $1',
        [id]
      )

      if (assignmentResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { success: false, message: 'Role assignment not found' },
          { status: 404 }
        )
      }

      const assignment = assignmentResult.rows[0]

      // Delete location assignments first (cascade should handle this, but explicit is safer)
      await client.query('DELETE FROM role_assignment_locations WHERE assignment_id = $1', [id])

      // Delete the role assignment
      await client.query('DELETE FROM role_assignments WHERE id = $1', [id])

      await client.query('COMMIT')

      // Invalidate user permission cache
      if (assignment.person_id) {
        // Get user_id from person_id
        const userResult = await query<{ id: string }>(
          'SELECT id FROM users WHERE person_id = $1',
          [assignment.person_id]
        )
        if (userResult.rows[0]) {
          invalidateUserCache(userResult.rows[0].id)
        }
      }

      // If group assignment, invalidate all group members
      if (assignment.group_id) {
        const groupMembers = await query<{ user_id: string }>(
          `SELECT u.id as user_id
           FROM group_members gm
           JOIN users u ON u.person_id = gm.person_id
           WHERE gm.group_id = $1`,
          [assignment.group_id]
        )

        for (const member of groupMembers.rows) {
          invalidateUserCache(member.user_id)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Role assignment revoked successfully',
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error deleting role assignment:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to delete role assignment' },
      { status: 500 }
    )
  }
}
