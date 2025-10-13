/**
 * OAuth 2.1 Authorization Server Implementation
 * Provides token generation, validation, and PKCE verification
 */

import * as crypto from 'crypto'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import type { AccessTokenPayload, RefreshTokenPayload, OAuthScope } from '@/types/oauth'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
)
const ISSUER = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const AUDIENCE = 'mcp-server'

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = 5 * 60 // 5 minutes
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 // 30 days
const AUTHORIZATION_CODE_EXPIRES_IN = 10 * 60 // 10 minutes

/**
 * Generate a secure authorization code
 */
export function generateAuthorizationCode(): string {
  return nanoid(32)
}

/**
 * Generate a secure client ID
 */
export function generateClientId(): string {
  return `mcp_${nanoid(24)}`
}

/**
 * Generate a secure client secret
 */
export function generateClientSecret(): string {
  return nanoid(48)
}

/**
 * Hash a client secret with bcrypt
 */
export async function hashClientSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, 10)
}

/**
 * Verify a client secret against a hash
 */
export async function verifyClientSecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash)
}

/**
 * Verify PKCE code_verifier against code_challenge
 * Only supports S256 method (SHA-256 hash)
 */
export function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest()
  const computedChallenge = hash.toString('base64url')
  return computedChallenge === codeChallenge
}

/**
 * Generate an OAuth 2.1 access token (JWT)
 */
export async function generateAccessToken(
  userId: string,
  clientId: string,
  scopes: OAuthScope[]
): Promise<string> {
  const payload: AccessTokenPayload = {
    sub: userId,
    client_id: clientId,
    scopes,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRES_IN,
    iss: ISSUER,
    aud: AUDIENCE,
  }

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .setIssuer(payload.iss)
    .setAudience(payload.aud)
    .sign(JWT_SECRET)
}

/**
 * Generate an OAuth 2.1 refresh token (JWT)
 */
export async function generateRefreshToken(userId: string, clientId: string): Promise<string> {
  const payload: RefreshTokenPayload = {
    sub: userId,
    client_id: clientId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRES_IN,
    iss: ISSUER,
    aud: AUDIENCE,
    jti: nanoid(16), // Unique token ID for revocation
  }

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .setIssuer(payload.iss)
    .setAudience(payload.aud)
    .setJti(payload.jti)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    return payload as unknown as AccessTokenPayload
  } catch {
    return null
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    return payload as unknown as RefreshTokenPayload
  } catch {
    return null
  }
}

/**
 * Validate OAuth scopes
 * Ensures requested scopes are valid and allowed for the client
 */
export function validateScopes(
  requestedScopes: string[],
  allowedScopes: OAuthScope[]
): {
  valid: boolean
  validatedScopes: OAuthScope[]
  invalidScopes: string[]
} {
  const validScopes: OAuthScope[] = []
  const invalidScopes: string[] = []

  const allowedScopeSet = new Set(allowedScopes)

  for (const scope of requestedScopes) {
    if (allowedScopeSet.has(scope as OAuthScope)) {
      validScopes.push(scope as OAuthScope)
    } else {
      invalidScopes.push(scope)
    }
  }

  return {
    valid: invalidScopes.length === 0,
    validatedScopes: validScopes,
    invalidScopes,
  }
}

/**
 * Parse scopes from space-separated string
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Format scopes as space-separated string
 */
export function formatScopes(scopes: OAuthScope[]): string {
  return scopes.join(' ')
}

/**
 * Calculate token expiration date
 */
export function getTokenExpirationDate(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000)
}

// Export constants for use in API routes
export { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, AUTHORIZATION_CODE_EXPIRES_IN }
