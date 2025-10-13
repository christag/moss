/**
 * OAuth 2.1 Authorization Endpoint
 * POST /api/oauth/authorize
 *
 * Initiates OAuth authorization code flow with PKCE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { AuthorizeRequestSchema } from '@/lib/schemas/oauth'
import {
  generateAuthorizationCode,
  AUTHORIZATION_CODE_EXPIRES_IN,
  getTokenExpirationDate,
  parseScopes,
  validateScopes,
} from '@/lib/oauth'
import { withCORS, getProductionCORSConfig } from '@/lib/cors'
import type { OAuthClient } from '@/types/oauth'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return withCORS(
    request,
    async () => new NextResponse(null, { status: 204 }),
    getProductionCORSConfig()
  )
}

export async function POST(request: NextRequest) {
  return withCORS(
    request,
    async () => handleAuthorizationRequest(request),
    getProductionCORSConfig()
  )
}

async function handleAuthorizationRequest(request: NextRequest) {
  const pool = getPool()

  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', error_description: 'User must be authenticated' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = AuthorizeRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: validationResult.error.errors[0]?.message || 'Invalid request',
        },
        { status: 400 }
      )
    }

    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } =
      validationResult.data

    // Verify client exists and is active
    const clientResult = await pool.query<OAuthClient>(
      'SELECT * FROM oauth_clients WHERE client_id = $1 AND is_active = true',
      [client_id]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client not found or inactive' },
        { status: 400 }
      )
    }

    const client = clientResult.rows[0]

    // Verify redirect_uri is registered for this client
    if (!client.redirect_uris.includes(redirect_uri)) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
        { status: 400 }
      )
    }

    // Parse and validate scopes
    const requestedScopes = parseScopes(scope)
    const scopeValidation = validateScopes(requestedScopes, client.allowed_scopes)

    if (!scopeValidation.valid) {
      return NextResponse.json(
        {
          error: 'invalid_scope',
          error_description: `Invalid scopes: ${scopeValidation.invalidScopes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Generate authorization code
    const code = generateAuthorizationCode()
    const expiresAt = getTokenExpirationDate(AUTHORIZATION_CODE_EXPIRES_IN)

    // Store authorization code in database
    await pool.query(
      `INSERT INTO oauth_authorization_codes
       (code, client_id, user_id, redirect_uri, scopes, code_challenge, code_challenge_method, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        code,
        client.id,
        session.user.id,
        redirect_uri,
        scopeValidation.validatedScopes,
        code_challenge,
        code_challenge_method,
        expiresAt,
      ]
    )

    // Return authorization code with state
    const response: { code: string; state?: string } = { code }
    if (state) {
      response.state = state
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[OAuth Authorize] Error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
