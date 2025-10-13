/**
 * Individual Object Permission API Routes
 * Handles DELETE for specific object permissions
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { ObjectPermission } from '@/types'
import { requireRole } from '@/lib/auth'
import { invalidateUserCache } from '@/lib/rbac'

/**
 * DELETE /api/object-permissions/:id
 * Revoke an object-level permission
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Require admin role
    await requireRole('admin')

    // Get permission details before deleting
    const permissionResult = await query<ObjectPermission>(
      'SELECT * FROM object_permissions WHERE id = $1',
      [id]
    )

    if (permissionResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Object permission not found' },
        { status: 404 }
      )
    }

    const permission = permissionResult.rows[0]

    // Delete the object permission
    await query('DELETE FROM object_permissions WHERE id = $1', [id])

    // Invalidate user permission cache
    if (permission.person_id) {
      // Get user_id from person_id
      const userResult = await query<{ id: string }>('SELECT id FROM users WHERE person_id = $1', [
        permission.person_id,
      ])
      if (userResult.rows[0]) {
        invalidateUserCache(userResult.rows[0].id)
      }
    }

    // If group permission, invalidate all group members
    if (permission.group_id) {
      const groupMembers = await query<{ user_id: string }>(
        `SELECT u.id as user_id
         FROM group_members gm
         JOIN users u ON u.person_id = gm.person_id
         WHERE gm.group_id = $1`,
        [permission.group_id]
      )

      for (const member of groupMembers.rows) {
        invalidateUserCache(member.user_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Object permission revoked successfully',
    })
  } catch (error) {
    console.error('Error deleting object permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to delete object permission' },
      { status: 500 }
    )
  }
}
