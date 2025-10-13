/**
 * Individual Role Permission API Route
 * Handles removing a specific permission from a role
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { invalidateRoleCache } from '@/lib/rbac'

interface RouteParams {
  params: {
    id: string
    permissionId: string
  }
}

/**
 * DELETE /api/roles/:id/permissions/:permissionId
 * Remove a specific permission from a role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roleId, permissionId } = params

    // Check if it's a system role (system roles cannot have permissions modified)
    const checkResult = await query('SELECT is_system_role FROM roles WHERE id = $1', [roleId])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }
    if (checkResult.rows[0].is_system_role) {
      return NextResponse.json(
        { success: false, message: 'System role permissions cannot be modified' },
        { status: 403 }
      )
    }

    // Check if permission exists
    const permissionCheck = await query('SELECT id FROM permissions WHERE id = $1', [permissionId])
    if (permissionCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 })
    }

    // Check if the role-permission association exists
    const associationCheck = await query(
      'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    )

    if (associationCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Permission not assigned to this role' },
        { status: 404 }
      )
    }

    // Delete the role-permission association
    await query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [
      roleId,
      permissionId,
    ])

    // Invalidate role permission cache
    invalidateRoleCache(roleId)

    return NextResponse.json({
      success: true,
      message: 'Permission removed from role successfully',
    })
  } catch (error) {
    console.error('Error removing permission from role:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to remove permission from role' },
      { status: 500 }
    )
  }
}
