/**
 * Role Permissions API Routes
 * Handles getting and setting permissions for a specific role
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { AssignPermissionsToRoleSchema } from '@/lib/schemas/rbac'
import { parseRequestBody } from '@/lib/api'
import { getRolePermissions, invalidateRoleCache } from '@/lib/rbac'
import { auth } from '@/lib/auth'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'

/**
 * GET /api/roles/:id/permissions
 * Get all permissions assigned to a role (including inherited permissions)
 * Query parameter: include_inherited=true to show inherited permissions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeInherited = searchParams.get('include_inherited') === 'true'

    // Verify role exists
    const roleCheck = await query('SELECT id FROM roles WHERE id = $1', [id])
    if (roleCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }

    // Get permissions with inheritance info using the rbac library
    const permissions = await getRolePermissions(id, includeInherited)

    return NextResponse.json({ success: true, data: permissions })
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch role permissions' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/roles/:id/permissions
 * Replace all permissions for a role
 * This is a full replace operation - removes existing and adds new ones
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if it's a system role (system roles cannot have permissions modified)
    const checkResult = await query('SELECT is_system_role FROM roles WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }
    if (checkResult.rows[0].is_system_role) {
      return NextResponse.json(
        { success: false, message: 'System role permissions cannot be modified' },
        { status: 403 }
      )
    }

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = AssignPermissionsToRoleSchema.parse(body)

    // Get existing permissions before update for audit log
    const existingPermissions = await getRolePermissions(id, false)
    const existingPermissionIds = existingPermissions.map((p) => p.permission.id)

    // Begin transaction
    await query('BEGIN')

    try {
      // Delete existing role permissions
      await query('DELETE FROM role_permissions WHERE role_id = $1', [id])

      // Insert new permissions
      if (validated.permission_ids.length > 0) {
        const values: string[] = []
        const placeholders: string[] = []

        validated.permission_ids.forEach((permissionId, index) => {
          const offset = index * 2
          placeholders.push(`($${offset + 1}, $${offset + 2})`)
          values.push(id, permissionId)
        })

        const insertSql = `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${placeholders.join(', ')}
        `

        await query(insertSql, values)
      }

      // Commit transaction
      await query('COMMIT')

      // Invalidate role permission cache
      invalidateRoleCache(id)

      // Fetch updated permissions
      const permissions = await getRolePermissions(id, false)

      // Log admin action
      const session = await auth()
      if (session?.user?.id) {
        await logAdminAction({
          user_id: session.user.id,
          action: 'role_permissions_updated',
          category: 'rbac',
          target_type: 'role',
          target_id: id,
          details: {
            before_count: existingPermissionIds.length,
            after_count: validated.permission_ids.length,
            added_permissions: validated.permission_ids.filter(
              (pId) => !existingPermissionIds.includes(pId)
            ),
            removed_permissions: existingPermissionIds.filter(
              (pId) => !validated.permission_ids.includes(pId)
            ),
          },
          ip_address: getIPAddress(request.headers),
          user_agent: getUserAgent(request.headers),
        })
      }

      return NextResponse.json({
        success: true,
        data: permissions,
        message: 'Role permissions updated successfully',
      })
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error updating role permissions:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update role permissions' },
      { status: 500 }
    )
  }
}
