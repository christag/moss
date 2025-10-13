/**
 * Admin Authentication Helpers
 * Server-side utilities for checking admin permissions
 */

import { redirect } from 'next/navigation'
import { auth, hasRole } from './auth'
import { getPool } from './db'
import type { UserRole, AdminAuditLog } from '@/types'

/**
 * Require admin role (admin or super_admin)
 * Redirects to home page if user doesn't have admin role
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const isAdmin = hasRole(session.user.role, 'admin')
  if (!isAdmin) {
    redirect('/?error=insufficient_permissions')
  }

  return session
}

/**
 * Require super admin role
 * Redirects to home page if user doesn't have super_admin role
 */
export async function requireSuperAdmin() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const isSuperAdmin = hasRole(session.user.role, 'super_admin')
  if (!isSuperAdmin) {
    redirect('/?error=insufficient_permissions')
  }

  return session
}

/**
 * Check if current user has admin role (without redirecting)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user) {
    return false
  }
  return hasRole(session.user.role, 'admin')
}

/**
 * Check if current user has super admin role (without redirecting)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user) {
    return false
  }
  return hasRole(session.user.role, 'super_admin')
}

/**
 * Log admin action to audit log
 */
export async function logAdminAction(params: {
  user_id: string
  action: string
  category: string
  target_type?: string
  target_id?: string
  details: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO admin_audit_log (
        user_id,
        action,
        category,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.user_id,
        params.action,
        params.category,
        params.target_type || null,
        params.target_id || null,
        JSON.stringify(params.details),
        params.ip_address || null,
        params.user_agent || null,
      ]
    )
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Get admin audit logs with optional filtering
 */
export async function getAdminAuditLogs(params?: {
  user_id?: string
  action?: string
  category?: string
  limit?: number
  offset?: number
}): Promise<AdminAuditLog[]> {
  const pool = getPool()

  let query = `
    SELECT
      aal.id,
      aal.user_id,
      aal.action,
      aal.category,
      aal.target_type,
      aal.target_id,
      aal.details,
      aal.ip_address,
      aal.user_agent,
      aal.created_at
    FROM admin_audit_log aal
    WHERE 1=1
  `

  const queryParams: unknown[] = []
  let paramIndex = 1

  if (params?.user_id) {
    query += ` AND aal.user_id = $${paramIndex}`
    queryParams.push(params.user_id)
    paramIndex++
  }

  if (params?.action) {
    query += ` AND aal.action = $${paramIndex}`
    queryParams.push(params.action)
    paramIndex++
  }

  if (params?.category) {
    query += ` AND aal.category = $${paramIndex}`
    queryParams.push(params.category)
    paramIndex++
  }

  query += ` ORDER BY aal.created_at DESC`

  if (params?.limit) {
    query += ` LIMIT $${paramIndex}`
    queryParams.push(params.limit)
    paramIndex++
  }

  if (params?.offset) {
    query += ` OFFSET $${paramIndex}`
    queryParams.push(params.offset)
    paramIndex++
  }

  const result = await pool.query<AdminAuditLog>(query, queryParams)
  return result.rows
}

/**
 * Check if user has permission to access a specific admin section
 * Super admins have access to everything
 * Regular admins have access to most sections except user management
 */
export function canAccessAdminSection(
  userRole: UserRole,
  section:
    | 'branding'
    | 'storage'
    | 'integrations'
    | 'fields'
    | 'import_export'
    | 'audit_logs'
    | 'authentication'
    | 'rbac'
    | 'notifications'
    | 'backup'
): boolean {
  // Super admins can access everything
  if (userRole === 'super_admin') {
    return true
  }

  // Regular admins can access most sections
  if (userRole === 'admin') {
    // These sections require super_admin
    const superAdminOnlySections = ['authentication', 'rbac']
    return !superAdminOnlySections.includes(section)
  }

  // Regular users cannot access any admin sections
  return false
}

/**
 * Get user's IP address from request headers
 */
export function getIPAddress(headers: Headers): string | undefined {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return undefined
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined
}
