/**
 * MCP Server Authentication Middleware
 * Validates OAuth 2.1 Bearer tokens
 */

import { getPool } from '../db'
import { verifyAccessToken } from '../oauth'
import type { OAuthScope, OAuthToken } from '@/types/oauth'

export interface MCPAuthContext {
  userId: string | null // null for client_credentials flow
  clientId: string
  scopes: OAuthScope[]
}

/**
 * Validate OAuth Bearer token from Authorization header
 * Returns auth context if valid, throws error if invalid
 */
export async function validateMCPAuth(authHeader: string | null): Promise<MCPAuthContext> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const pool = getPool()

  // Verify JWT signature and expiration
  const payload = await verifyAccessToken(token)
  if (!payload) {
    throw new Error('Invalid or expired access token')
  }

  // Check if token is revoked in database
  const tokenResult = await pool.query<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE access_token = $1 AND revoked = false',
    [token]
  )

  if (tokenResult.rows.length === 0) {
    throw new Error('Token revoked or not found')
  }

  const tokenRecord = tokenResult.rows[0]

  // Check if token has expired (database check as fallback)
  if (new Date() > tokenRecord.access_token_expires_at) {
    throw new Error('Access token expired')
  }

  return {
    userId: payload.sub || null,
    clientId: payload.client_id,
    scopes: payload.scopes,
  }
}

/**
 * Check if auth context has required scope
 */
export function hasScope(context: MCPAuthContext, requiredScope: OAuthScope): boolean {
  return context.scopes.includes(requiredScope)
}

/**
 * Check if auth context has any of the required scopes
 */
export function hasAnyScope(context: MCPAuthContext, requiredScopes: OAuthScope[]): boolean {
  return requiredScopes.some((scope) => context.scopes.includes(scope))
}

/**
 * Check if auth context has all required scopes
 */
export function hasAllScopes(context: MCPAuthContext, requiredScopes: OAuthScope[]): boolean {
  return requiredScopes.every((scope) => context.scopes.includes(scope))
}

/**
 * Require specific scope, throw error if not present
 */
export function requireScope(context: MCPAuthContext, scope: OAuthScope): void {
  if (!hasScope(context, scope)) {
    throw new Error(`Missing required scope: ${scope}`)
  }
}
