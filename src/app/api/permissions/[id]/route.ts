/**
 * Individual Permission API Routes
 * Handles get, update, and delete for single permission
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdatePermissionSchema } from '@/lib/schemas/rbac'
import type { Permission } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { requireRole } from '@/lib/auth'
import { clearPermissionCache } from '@/lib/rbac'

/**
 * GET /api/permissions/:id
 * Get a single permission by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    await requireRole('user')

    const { id } = await params

    const result = await query<Permission>('SELECT * FROM permissions WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch permission' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/permissions/:id
 * Update a permission (super_admin only)
 * Note: object_type and action cannot be changed to maintain referential integrity
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require super_admin role
    await requireRole('super_admin')

    const { id } = await params

    // Check if permission exists
    const existingResult = await query<Permission>('SELECT * FROM permissions WHERE id = $1', [id])

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 })
    }

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdatePermissionSchema.parse(body)

    // Build UPDATE query dynamically
    const updates: string[] = []
    const values: Array<string | null> = []
    let paramCount = 0

    if (validated.permission_name !== undefined) {
      paramCount++
      updates.push(`permission_name = $${paramCount}`)
      values.push(validated.permission_name)
    }

    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }

    // If nothing to update, return current state
    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        data: existingResult.rows[0],
      })
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // Add ID parameter
    paramCount++
    values.push(id)

    // Execute UPDATE
    const sql = `
      UPDATE permissions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<Permission>(sql, values)

    // Clear permission cache since permissions changed
    clearPermissionCache()

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update permission' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/permissions/:id
 * Delete a permission (super_admin only)
 * Checks for usage in role_permissions before deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require super_admin role
    await requireRole('super_admin')

    const { id } = await params

    // Check if permission exists
    const existingResult = await query<Permission>('SELECT * FROM permissions WHERE id = $1', [id])

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 })
    }

    // Check if permission is assigned to any roles
    const usageCheck = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1',
      [id]
    )

    const usageCount = parseInt(usageCheck.rows[0]?.count || '0')

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete permission: It is assigned to ${usageCount} role(s). Remove role assignments first.`,
        },
        { status: 409 }
      )
    }

    // Delete permission
    await query('DELETE FROM permissions WHERE id = $1', [id])

    // Clear permission cache
    clearPermissionCache()

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}
