/**
 * Role API Routes - Individual Role Operations
 * Handles getting, updating, and deleting a specific role
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateRoleSchema } from '@/lib/schemas/rbac'
import type { Role } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { checkRoleHierarchyCycle, invalidateRoleCache } from '@/lib/rbac'

/**
 * GET /api/roles/:id
 * Get a single role by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await query<Role>('SELECT * FROM roles WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch role' }, { status: 500 })
  }
}

/**
 * PATCH /api/roles/:id
 * Update a role
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if it's a system role (system roles cannot be updated)
    const checkResult = await query<Role>('SELECT is_system_role FROM roles WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }
    if (checkResult.rows[0].is_system_role) {
      return NextResponse.json(
        { success: false, message: 'System roles cannot be modified' },
        { status: 403 }
      )
    }

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdateRoleSchema.parse(body)

    // Check for circular hierarchy if parent_role_id is being updated
    if (validated.parent_role_id !== undefined) {
      const hasCycle = await checkRoleHierarchyCycle(id, validated.parent_role_id)
      if (hasCycle) {
        return NextResponse.json(
          {
            success: false,
            message: 'Cannot set parent role: would create circular hierarchy',
          },
          { status: 400 }
        )
      }
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: Array<string | Date | null> = []
    let paramCount = 0

    // Add each field if provided
    if (validated.role_name !== undefined) {
      paramCount++
      updates.push(`role_name = $${paramCount}`)
      values.push(validated.role_name)
    }
    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }
    if (validated.parent_role_id !== undefined) {
      paramCount++
      updates.push(`parent_role_id = $${paramCount}`)
      values.push(validated.parent_role_id)
    }
    if (validated.created_date !== undefined) {
      paramCount++
      updates.push(`created_date = $${paramCount}`)
      values.push(validated.created_date)
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 1) {
      // Only updated_at was added, no actual fields to update
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add role ID as last parameter
    paramCount++
    values.push(id)

    const result = await query<Role>(
      `
      UPDATE roles
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }

    // Invalidate role permission cache
    invalidateRoleCache(id)

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating role:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to update role' }, { status: 500 })
  }
}

/**
 * DELETE /api/roles/:id
 * Delete a role
 * Note: role_permissions and role_assignments will be automatically deleted due to CASCADE constraint
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if it's a system role (system roles cannot be deleted)
    const checkResult = await query<Role>('SELECT is_system_role FROM roles WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }
    if (checkResult.rows[0].is_system_role) {
      return NextResponse.json(
        { success: false, message: 'System roles cannot be deleted' },
        { status: 403 }
      )
    }

    // Check assignments count
    const assignmentCheck = await query<{ count: string }>(
      'SELECT COUNT(*) FROM role_assignments WHERE role_id = $1',
      [id]
    )
    const assignmentCount = parseInt(assignmentCheck.rows[0].count, 10)

    // Delete the role (CASCADE will remove role_permissions and role_assignments entries)
    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Role deleted successfully',
        id: result.rows[0].id,
        removed_assignments: assignmentCount,
      },
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete role' }, { status: 500 })
  }
}
