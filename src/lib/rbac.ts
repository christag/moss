/**
 * RBAC (Role-Based Access Control) Permission Checking Library
 *
 * Provides core functions for checking user permissions with support for:
 * - Hierarchical role inheritance
 * - Location-based scoping
 * - Object-level permission overrides
 * - Permission caching for performance
 */

import { query } from './db'
import type {
  Role,
  Permission,
  ObjectPermission,
  PermissionAction,
  ObjectType,
  UUID,
} from '@/types'

// ============================================================================
// Types
// ============================================================================

export interface PermissionCheckResult {
  granted: boolean
  reason: string
  path?: string[] // Permission path for debugging (e.g., ["User", "Role Assignment", "Role: Admin", "Permission: view devices"])
}

export interface UserPermissions {
  rolePermissions: PermissionWithSource[]
  objectPermissions: ObjectPermission[]
  locationScopes: UUID[] // Location IDs user has access to
}

export interface PermissionWithSource {
  permission: Permission
  role_id: UUID
  role_name: string
  is_inherited: boolean
  inherited_from_role_id?: UUID
  inherited_from_role_name?: string
}

// ============================================================================
// Permission Cache
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class PermissionCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private ttl: number = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      // Clear entire cache
      this.cache.clear()
      return
    }

    // Clear entries matching pattern
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  invalidateUser(userId: UUID): void {
    this.invalidate(`user:${userId}`)
  }

  invalidateRole(roleId: UUID): void {
    this.invalidate(`role:${roleId}`)
  }
}

const permissionCache = new PermissionCache()

// ============================================================================
// Core Permission Functions
// ============================================================================

/**
 * Get role hierarchy for a given role (all parent roles recursively)
 * Uses the role_hierarchy_permissions view created in migration 006
 */
export async function getRoleHierarchy(roleId: UUID): Promise<Role[]> {
  const cacheKey = `role:${roleId}:hierarchy`
  const cached = permissionCache.get<Role[]>(cacheKey)
  if (cached) return cached

  const sql = `
    WITH RECURSIVE role_tree AS (
      -- Base case: Start with the given role
      SELECT
        id,
        role_name,
        description,
        is_system_role,
        parent_role_id,
        created_date,
        created_at,
        updated_at,
        0 as depth
      FROM roles
      WHERE id = $1

      UNION ALL

      -- Recursive case: Add parent roles
      SELECT
        r.id,
        r.role_name,
        r.description,
        r.is_system_role,
        r.parent_role_id,
        r.created_date,
        r.created_at,
        r.updated_at,
        rt.depth + 1
      FROM role_tree rt
      JOIN roles r ON rt.parent_role_id = r.id
      WHERE rt.depth < 10 -- Prevent infinite loops
    )
    SELECT * FROM role_tree
    ORDER BY depth ASC
  `

  const result = await query<Role>(sql, [roleId])
  permissionCache.set(cacheKey, result.rows)
  return result.rows
}

/**
 * Check if a role hierarchy contains a cycle
 * Returns true if adding parentId to roleId would create a cycle
 */
export async function checkRoleHierarchyCycle(
  roleId: UUID,
  parentId: UUID | null
): Promise<boolean> {
  if (!parentId) return false
  if (roleId === parentId) return true

  const sql = `SELECT check_role_hierarchy_cycle($1, $2) as has_cycle`
  const result = await query<{ has_cycle: boolean }>(sql, [roleId, parentId])
  return result.rows[0]?.has_cycle || false
}

/**
 * Get all permissions for a role, including inherited permissions
 */
export async function getRolePermissions(
  roleId: UUID,
  includeInherited: boolean = true
): Promise<PermissionWithSource[]> {
  const cacheKey = `role:${roleId}:permissions:${includeInherited}`
  const cached = permissionCache.get<PermissionWithSource[]>(cacheKey)
  if (cached) return cached

  if (!includeInherited) {
    // Get only direct permissions
    const sql = `
      SELECT
        p.*,
        r.id as role_id,
        r.role_name,
        false as is_inherited
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.id = $1
      ORDER BY p.object_type, p.action
    `

    const result = await query<
      Permission & { role_id: UUID; role_name: string; is_inherited: boolean }
    >(sql, [roleId])
    const permissions = result.rows.map((row) => ({
      permission: {
        id: row.id,
        permission_name: row.permission_name,
        object_type: row.object_type,
        action: row.action,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      role_id: row.role_id,
      role_name: row.role_name,
      is_inherited: false,
    }))

    permissionCache.set(cacheKey, permissions)
    return permissions
  }

  // Get permissions including inherited (using the view from migration 006)
  const sql = `
    SELECT
      permission_id as id,
      permission_name,
      object_type,
      action,
      NULL as description,
      NOW() as created_at,
      NOW() as updated_at,
      role_id,
      inherited_from_role_id,
      inherited_from_role_name,
      depth,
      is_direct_permission
    FROM role_hierarchy_permissions
    WHERE role_id = $1
    ORDER BY depth ASC, object_type, action
  `

  const result = await query<{
    id: UUID
    permission_name: string
    object_type: ObjectType
    action: PermissionAction
    description: string | null
    created_at: Date
    updated_at: Date
    role_id: UUID
    inherited_from_role_id: UUID
    inherited_from_role_name: string
    depth: number
    is_direct_permission: boolean
  }>(sql, [roleId])

  const permissions: PermissionWithSource[] = result.rows.map((row) => ({
    permission: {
      id: row.id,
      permission_name: row.permission_name,
      object_type: row.object_type,
      action: row.action,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    role_id: row.role_id,
    role_name: row.inherited_from_role_name,
    is_inherited: !row.is_direct_permission,
    inherited_from_role_id: row.is_direct_permission ? undefined : row.inherited_from_role_id,
    inherited_from_role_name: row.is_direct_permission ? undefined : row.inherited_from_role_name,
  }))

  permissionCache.set(cacheKey, permissions)
  return permissions
}

/**
 * Get all permissions for a user (from all role assignments)
 */
export async function getUserPermissions(userId: UUID): Promise<UserPermissions> {
  const cacheKey = `user:${userId}:permissions`
  const cached = permissionCache.get<UserPermissions>(cacheKey)
  if (cached) return cached

  // Get all role assignments for the user (including group memberships)
  const assignmentsSql = `
    SELECT DISTINCT
      ra.id,
      ra.role_id,
      ra.scope,
      r.role_name
    FROM role_assignments ra
    JOIN roles r ON ra.role_id = r.id
    WHERE ra.person_id = $1
       OR ra.group_id IN (
         SELECT group_id FROM group_members WHERE person_id = $1
       )
  `

  const assignmentsResult = await query<{
    id: UUID
    role_id: UUID
    scope: string
    role_name: string
  }>(assignmentsSql, [userId])

  // Get all permissions from all roles (including inherited)
  const rolePermissions: PermissionWithSource[] = []
  for (const assignment of assignmentsResult.rows) {
    const permissions = await getRolePermissions(assignment.role_id, true)
    rolePermissions.push(...permissions)
  }

  // Remove duplicates (same permission from multiple roles)
  const uniquePermissions = rolePermissions.reduce((acc, perm) => {
    const key = `${perm.permission.object_type}:${perm.permission.action}`
    if (!acc.has(key)) {
      acc.set(key, perm)
    }
    return acc
  }, new Map<string, PermissionWithSource>())

  // Get location scopes
  const locationScopesSql = `
    SELECT DISTINCT ral.location_id
    FROM role_assignments ra
    JOIN role_assignment_locations ral ON ra.id = ral.assignment_id
    WHERE ra.scope = 'location'
      AND (ra.person_id = $1 OR ra.group_id IN (
        SELECT group_id FROM group_members WHERE person_id = $1
      ))
  `

  const locationScopesResult = await query<{ location_id: UUID }>(locationScopesSql, [userId])
  const locationScopes = locationScopesResult.rows.map((row) => row.location_id)

  // Get object-level permissions
  const objectPermissionsSql = `
    SELECT
      op.*,
      p.full_name as person_name
    FROM object_permissions op
    LEFT JOIN people p ON op.person_id = p.id
    WHERE op.person_id = $1
       OR op.group_id IN (
         SELECT group_id FROM group_members WHERE person_id = $1
       )
  `

  const objectPermissionsResult = await query<ObjectPermission>(objectPermissionsSql, [userId])

  const userPermissions: UserPermissions = {
    rolePermissions: Array.from(uniquePermissions.values()),
    objectPermissions: objectPermissionsResult.rows,
    locationScopes,
  }

  permissionCache.set(cacheKey, userPermissions)
  return userPermissions
}

/**
 * Check if user has access to a specific location
 */
export async function hasLocationAccess(userId: UUID, locationId: UUID): Promise<boolean> {
  // Check if user has any location-scoped role assignments
  const sql = `
    SELECT COUNT(*) as count
    FROM role_assignments ra
    WHERE ra.scope = 'location'
      AND (ra.person_id = $1 OR ra.group_id IN (
        SELECT group_id FROM group_members WHERE person_id = $1
      ))
  `

  const result = await query<{ count: string }>(sql, [userId])
  const hasLocationScopes = parseInt(result.rows[0]?.count || '0') > 0

  // If no location scopes, user has global access
  if (!hasLocationScopes) {
    return true
  }

  // Check if user has access to this specific location
  const locationSql = `
    SELECT COUNT(*) as count
    FROM role_assignments ra
    JOIN role_assignment_locations ral ON ra.id = ral.assignment_id
    WHERE ra.scope = 'location'
      AND ral.location_id = $2
      AND (ra.person_id = $1 OR ra.group_id IN (
        SELECT group_id FROM group_members WHERE person_id = $1
      ))
  `

  const locationResult = await query<{ count: string }>(locationSql, [userId, locationId])
  return parseInt(locationResult.rows[0]?.count || '0') > 0
}

/**
 * Main permission checking function
 *
 * Priority order:
 * 1. Object-level permissions (highest priority)
 * 2. Role permissions (with inheritance)
 * 3. Default deny
 */
export async function checkPermission(
  userId: UUID,
  action: PermissionAction,
  objectType: ObjectType,
  objectId?: UUID
): Promise<PermissionCheckResult> {
  try {
    // Get user permissions
    const userPermissions = await getUserPermissions(userId)

    // 1. Check object-level permissions first (highest priority)
    if (objectId) {
      const objectPermission = userPermissions.objectPermissions.find(
        (op) =>
          op.object_type === objectType &&
          op.object_id === objectId &&
          op.permission_type === action
      )

      if (objectPermission) {
        return {
          granted: true,
          reason: 'Granted by object-level permission override',
          path: ['User', 'Object Permission', `${objectType}:${objectId}`, `Action: ${action}`],
        }
      }
    }

    // 2. Check role permissions (with inheritance)
    const rolePermission = userPermissions.rolePermissions.find(
      (rp) => rp.permission.object_type === objectType && rp.permission.action === action
    )

    if (rolePermission) {
      const path = ['User', 'Role Assignment']
      if (rolePermission.is_inherited) {
        path.push(`Inherited from: ${rolePermission.inherited_from_role_name}`)
      } else {
        path.push(`Role: ${rolePermission.role_name}`)
      }
      path.push(`Permission: ${action} ${objectType}`)

      return {
        granted: true,
        reason: rolePermission.is_inherited
          ? `Granted by inherited permission from role: ${rolePermission.inherited_from_role_name}`
          : `Granted by role: ${rolePermission.role_name}`,
        path,
      }
    }

    // 3. Default deny
    return {
      granted: false,
      reason: `No permission found for ${action} on ${objectType}`,
      path: ['User', 'No matching permission'],
    }
  } catch (error) {
    console.error('Error checking permission:', error)
    return {
      granted: false,
      reason: 'Error checking permission',
    }
  }
}

/**
 * Check if user has permission with location scoping enforcement
 */
export async function checkPermissionWithLocation(
  userId: UUID,
  action: PermissionAction,
  objectType: ObjectType,
  locationId: UUID,
  objectId?: UUID
): Promise<PermissionCheckResult> {
  // First check basic permission
  const permissionResult = await checkPermission(userId, action, objectType, objectId)

  if (!permissionResult.granted) {
    return permissionResult
  }

  // Check location access
  const hasAccess = await hasLocationAccess(userId, locationId)

  if (!hasAccess) {
    return {
      granted: false,
      reason: 'Permission denied: User does not have access to this location',
      path: [...(permissionResult.path || []), 'Location access denied'],
    }
  }

  return permissionResult
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Invalidate permission cache for a user
 * Call this when a user's role assignments or permissions change
 */
export function invalidateUserCache(userId: UUID): void {
  permissionCache.invalidateUser(userId)
}

/**
 * Invalidate permission cache for a role
 * Call this when a role's permissions or hierarchy changes
 */
export function invalidateRoleCache(roleId: UUID): void {
  permissionCache.invalidateRole(roleId)
}

/**
 * Clear entire permission cache
 * Use sparingly (e.g., after major RBAC changes)
 */
export function clearPermissionCache(): void {
  permissionCache.invalidate()
}
