/**
 * API Token Authentication Library
 *
 * Provides Bearer token authentication for API endpoints.
 * Usage:
 *   - Call generateApiToken() to create new tokens for users
 *   - Call verifyApiToken() to validate incoming requests
 *   - Use requireApiAuth() middleware in API routes
 *   - Use requireApiScope() for scope-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '@/lib/db'

// Token configuration
const TOKEN_PREFIX = 'moss_'
const TOKEN_LENGTH = 32 // characters after prefix
const TOKEN_PREFIX_DISPLAY_LENGTH = 10 // how many chars to show in UI

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = TOKEN_PREFIX

  // Use crypto for secure random generation
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)

  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars[array[i] % chars.length]
  }

  return token
}

/**
 * Generate a new API token for a user
 *
 * @param userId - UUID of the user
 * @param tokenName - User-friendly name (e.g., "Production Server")
 * @param scopes - Array of scopes: ['read', 'write', 'admin']
 * @param expiresAt - Optional expiration date (null = never expires)
 * @returns Object with token (plaintext - show once!) and token metadata
 */
export async function generateApiToken(
  userId: string,
  tokenName: string,
  scopes: string[] = ['read'],
  expiresAt: Date | null = null
): Promise<{
  token: string
  tokenId: string
  tokenPrefix: string
  createdAt: Date
}> {
  const pool = getPool()
  const token = generateSecureToken()
  const tokenHash = await bcrypt.hash(token, 10)
  const tokenPrefix = token.substring(0, TOKEN_PREFIX_DISPLAY_LENGTH)

  const result = await pool.query(
    `INSERT INTO api_tokens
     (user_id, token_name, token_hash, token_prefix, scopes, expires_at, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, created_at`,
    [userId, tokenName, tokenHash, tokenPrefix, JSON.stringify(scopes), expiresAt]
  )

  return {
    token, // IMPORTANT: Only returned once! Must be displayed to user immediately
    tokenId: result.rows[0].id,
    tokenPrefix,
    createdAt: result.rows[0].created_at,
  }
}

/**
 * Verify an API token from a request
 *
 * @param token - Bearer token from Authorization header
 * @param ipAddress - Client IP for usage tracking
 * @returns Token data if valid, null if invalid
 */
export async function verifyApiToken(
  token: string,
  ipAddress?: string
): Promise<{
  tokenId: string
  userId: string
  scopes: string[]
  userEmail: string
  userRole: string
} | null> {
  const pool = getPool()
  // Query all active, non-expired tokens
  const result = await pool.query(
    `SELECT
      t.id,
      t.user_id,
      t.token_hash,
      t.scopes,
      u.email,
      u.role
     FROM api_tokens t
     JOIN users u ON t.user_id = u.id
     WHERE t.is_active = true
     AND (t.expires_at IS NULL OR t.expires_at > NOW())
     AND u.is_active = true`
  )

  // Check each token hash (can't query by hash since it's bcrypt)
  for (const row of result.rows) {
    const isValid = await bcrypt.compare(token, row.token_hash)

    if (isValid) {
      // Record usage asynchronously (don't block response)
      pool
        .query(
          `UPDATE api_tokens
         SET last_used_at = NOW(),
             last_used_ip = $1,
             usage_count = usage_count + 1
         WHERE id = $2`,
          [ipAddress || null, row.id]
        )
        .catch((err) => console.error('Failed to record token usage:', err))

      return {
        tokenId: row.id,
        userId: row.user_id,
        scopes: row.scopes,
        userEmail: row.email,
        userRole: row.role,
      }
    }
  }

  return null
}

/**
 * Extract Bearer token from Authorization header
 *
 * @param request - Next.js request object
 * @returns Token string or null
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return null
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Get client IP address from request
 *
 * @param request - Next.js request object
 * @returns IP address string
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for real IP (reverse proxy, load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Note: NextRequest doesn't have direct IP access in Next.js 15
  // IP should be passed via headers in production environments
  return 'unknown'
}

/**
 * Middleware: Require valid API authentication
 *
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireApiAuth(request)
 *   if (authResult instanceof NextResponse) return authResult
 *
 *   const { userId, userEmail, scopes } = authResult
 *   // ... your API logic
 * }
 * ```
 */
export async function requireApiAuth(request: NextRequest): Promise<
  | {
      tokenId: string
      userId: string
      scopes: string[]
      userEmail: string
      userRole: string
    }
  | NextResponse
> {
  const token = extractBearerToken(request)

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing Authorization header',
        message: 'Please provide a Bearer token in the Authorization header',
      },
      { status: 401 }
    )
  }

  const clientIp = getClientIp(request)
  const tokenData = await verifyApiToken(token, clientIp)

  if (!tokenData) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid or expired token',
        message: 'The provided API token is invalid, expired, or has been revoked',
      },
      { status: 401 }
    )
  }

  return tokenData
}

/**
 * Middleware: Require specific scope(s)
 *
 * @param request - Next.js request object
 * @param requiredScopes - Array of required scopes (user must have at least one)
 * @returns Token data if authorized, error response if not
 */
export async function requireApiScope(
  request: NextRequest,
  requiredScopes: string[]
): Promise<
  | {
      tokenId: string
      userId: string
      scopes: string[]
      userEmail: string
      userRole: string
    }
  | NextResponse
> {
  const authResult = await requireApiAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const hasRequiredScope = requiredScopes.some((scope) => authResult.scopes.includes(scope))

  if (!hasRequiredScope) {
    return NextResponse.json(
      {
        success: false,
        error: 'Insufficient permissions',
        message: `This endpoint requires one of the following scopes: ${requiredScopes.join(', ')}`,
        yourScopes: authResult.scopes,
      },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Middleware: Require admin role
 *
 * Checks both token scopes and user role
 */
export async function requireApiAdmin(request: NextRequest): Promise<
  | {
      tokenId: string
      userId: string
      scopes: string[]
      userEmail: string
      userRole: string
    }
  | NextResponse
> {
  const authResult = await requireApiAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const hasAdminScope = authResult.scopes.includes('admin')
  const hasAdminRole = ['admin', 'super_admin'].includes(authResult.userRole)

  if (!hasAdminScope && !hasAdminRole) {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin access required',
        message: 'This endpoint requires admin privileges',
      },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Revoke an API token
 *
 * @param tokenId - UUID of the token to revoke
 * @param userId - UUID of user (for authorization - can only revoke own tokens unless admin)
 * @returns Success boolean
 */
export async function revokeApiToken(tokenId: string, userId: string): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    `UPDATE api_tokens
     SET is_active = false,
         updated_at = NOW()
     WHERE id = $1
     AND user_id = $2
     RETURNING id`,
    [tokenId, userId]
  )

  return (result.rowCount ?? 0) > 0
}

/**
 * Revoke an API token (admin version - can revoke any token)
 *
 * @param tokenId - UUID of the token to revoke
 * @returns Success boolean
 */
export async function revokeApiTokenAdmin(tokenId: string): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    `UPDATE api_tokens
     SET is_active = false,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [tokenId]
  )

  return (result.rowCount ?? 0) > 0
}

/**
 * List API tokens for a user
 *
 * @param userId - UUID of the user
 * @returns Array of token metadata (excludes token_hash)
 */
export async function listUserApiTokens(userId: string) {
  const pool = getPool()
  const result = await pool.query(
    `SELECT
      id,
      token_name,
      token_prefix,
      scopes,
      last_used_at,
      last_used_ip,
      usage_count,
      expires_at,
      is_active,
      created_at,
      updated_at
     FROM api_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  )

  return result.rows
}

/**
 * List all API tokens (admin only)
 *
 * @param filters - Optional filters (is_active, user_id)
 * @returns Array of token metadata with user info
 */
export async function listAllApiTokens(filters?: { isActive?: boolean; userId?: string }) {
  const pool = getPool()
  let query = `
    SELECT
      t.id,
      t.user_id,
      t.token_name,
      t.token_prefix,
      t.scopes,
      t.last_used_at,
      t.last_used_ip,
      t.usage_count,
      t.expires_at,
      t.is_active,
      t.created_at,
      t.updated_at,
      u.email as user_email,
      p.full_name as user_full_name
     FROM api_tokens t
     JOIN users u ON t.user_id = u.id
     JOIN people p ON u.person_id = p.id
     WHERE 1=1
  `

  const params: unknown[] = []
  let paramIndex = 1

  if (filters?.isActive !== undefined) {
    query += ` AND t.is_active = $${paramIndex}`
    params.push(filters.isActive)
    paramIndex++
  }

  if (filters?.userId) {
    query += ` AND t.user_id = $${paramIndex}`
    params.push(filters.userId)
    paramIndex++
  }

  query += ' ORDER BY t.created_at DESC'

  const result = await pool.query(query, params)
  return result.rows
}
