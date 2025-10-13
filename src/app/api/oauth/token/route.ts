/**
 * OAuth 2.1 Token Endpoint
 * POST /api/oauth/token
 *
 * Exchanges authorization code for access/refresh tokens
 * Supports: authorization_code, refresh_token, client_credentials grants
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { TokenRequestSchema, type TokenRequest } from '@/lib/schemas/oauth'
import {
  verifyClientSecret,
  verifyPKCE,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  getTokenExpirationDate,
  formatScopes,
  parseScopes,
  validateScopes,
} from '@/lib/oauth'
import { withCORS, getProductionCORSConfig } from '@/lib/cors'
import type { OAuthClient, OAuthAuthorizationCode, OAuthToken, TokenResponse } from '@/types/oauth'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return withCORS(
    request,
    async () => new NextResponse(null, { status: 204 }),
    getProductionCORSConfig()
  )
}

export async function POST(request: NextRequest) {
  return withCORS(request, async () => handleTokenRequest(request), getProductionCORSConfig())
}

async function handleTokenRequest(request: NextRequest) {
  const pool = getPool()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = TokenRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: validationResult.error.errors[0]?.message || 'Invalid request',
        },
        { status: 400 }
      )
    }

    const tokenRequest = validationResult.data

    // Verify client exists and is active
    const clientResult = await pool.query<OAuthClient>(
      'SELECT * FROM oauth_clients WHERE client_id = $1 AND is_active = true',
      [tokenRequest.client_id]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client not found or inactive' },
        { status: 401 }
      )
    }

    const client = clientResult.rows[0]

    // Verify client secret for confidential clients
    if (client.client_type === 'confidential') {
      if (!tokenRequest.client_secret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Client secret required' },
          { status: 401 }
        )
      }

      const secretValid = await verifyClientSecret(tokenRequest.client_secret, client.client_secret)
      if (!secretValid) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Invalid client secret' },
          { status: 401 }
        )
      }
    }

    // Handle different grant types
    switch (tokenRequest.grant_type) {
      case 'authorization_code':
        return handleAuthorizationCodeGrant(pool, client, tokenRequest)
      case 'refresh_token':
        return handleRefreshTokenGrant(pool, client, tokenRequest)
      case 'client_credentials':
        return handleClientCredentialsGrant(pool, client, tokenRequest)
      default:
        return NextResponse.json(
          { error: 'unsupported_grant_type', error_description: 'Grant type not supported' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[OAuth Token] Error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleAuthorizationCodeGrant(
  pool: ReturnType<typeof import('@/lib/db').getPool>,
  client: OAuthClient,
  request: Extract<TokenRequest, { grant_type: 'authorization_code' }>
) {
  // Retrieve authorization code
  const codeResult = await pool.query<OAuthAuthorizationCode>(
    `SELECT * FROM oauth_authorization_codes
     WHERE code = $1 AND client_id = $2 AND used = false AND expires_at > NOW()`,
    [request.code, client.id]
  )

  if (codeResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400 }
    )
  }

  const authCode = codeResult.rows[0]

  // Verify redirect_uri matches
  if (authCode.redirect_uri !== request.redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    )
  }

  // Verify PKCE code_verifier
  if (!verifyPKCE(request.code_verifier, authCode.code_challenge)) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid code verifier' },
      { status: 400 }
    )
  }

  // Mark code as used
  await pool.query('UPDATE oauth_authorization_codes SET used = true WHERE id = $1', [authCode.id])

  // Generate tokens
  const accessToken = await generateAccessToken(authCode.user_id, client.client_id, authCode.scopes)
  const refreshToken = await generateRefreshToken(authCode.user_id, client.client_id)

  // Store tokens in database
  await pool.query(
    `INSERT INTO oauth_tokens
     (access_token, refresh_token, client_id, user_id, scopes, access_token_expires_at, refresh_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      accessToken,
      refreshToken,
      client.id,
      authCode.user_id,
      authCode.scopes,
      getTokenExpirationDate(ACCESS_TOKEN_EXPIRES_IN),
      getTokenExpirationDate(REFRESH_TOKEN_EXPIRES_IN),
    ]
  )

  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    refresh_token: refreshToken,
    scope: formatScopes(authCode.scopes),
  }

  return NextResponse.json(response)
}

async function handleRefreshTokenGrant(
  pool: ReturnType<typeof import('@/lib/db').getPool>,
  client: OAuthClient,
  request: Extract<TokenRequest, { grant_type: 'refresh_token' }>
) {
  // Verify refresh token
  const payload = await verifyRefreshToken(request.refresh_token)
  if (!payload) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid refresh token' },
      { status: 400 }
    )
  }

  // Verify token belongs to this client
  if (payload.client_id !== client.client_id) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Token does not belong to this client' },
      { status: 400 }
    )
  }

  // Check if token is revoked
  const tokenResult = await pool.query<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE refresh_token = $1 AND revoked = false',
    [request.refresh_token]
  )

  if (tokenResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Token revoked or not found' },
      { status: 400 }
    )
  }

  const oldToken = tokenResult.rows[0]

  // Handle scope parameter (must be subset of original scopes)
  let scopes = oldToken.scopes
  if (request.scope) {
    const requestedScopes = parseScopes(request.scope)
    const scopeValidation = validateScopes(requestedScopes, oldToken.scopes)
    if (!scopeValidation.valid) {
      return NextResponse.json(
        { error: 'invalid_scope', error_description: 'Requested scope exceeds granted scope' },
        { status: 400 }
      )
    }
    scopes = scopeValidation.validatedScopes
  }

  // Generate new tokens
  const accessToken = await generateAccessToken(payload.sub, client.client_id, scopes)
  const newRefreshToken = await generateRefreshToken(payload.sub, client.client_id)

  // Revoke old refresh token (rotation)
  await pool.query('UPDATE oauth_tokens SET revoked = true WHERE id = $1', [oldToken.id])

  // Store new tokens
  await pool.query(
    `INSERT INTO oauth_tokens
     (access_token, refresh_token, client_id, user_id, scopes, access_token_expires_at, refresh_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      accessToken,
      newRefreshToken,
      client.id,
      payload.sub,
      scopes,
      getTokenExpirationDate(ACCESS_TOKEN_EXPIRES_IN),
      getTokenExpirationDate(REFRESH_TOKEN_EXPIRES_IN),
    ]
  )

  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    refresh_token: newRefreshToken,
    scope: formatScopes(scopes),
  }

  return NextResponse.json(response)
}

async function handleClientCredentialsGrant(
  pool: ReturnType<typeof import('@/lib/db').getPool>,
  client: OAuthClient,
  request: Extract<TokenRequest, { grant_type: 'client_credentials' }>
) {
  // Parse and validate scopes
  const requestedScopes = request.scope ? parseScopes(request.scope) : client.allowed_scopes
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

  // Generate access token (no user context, no refresh token)
  const accessToken = await generateAccessToken(
    '',
    client.client_id,
    scopeValidation.validatedScopes
  )

  // Store token
  await pool.query(
    `INSERT INTO oauth_tokens
     (access_token, client_id, user_id, scopes, access_token_expires_at)
     VALUES ($1, $2, NULL, $3, $4)`,
    [
      accessToken,
      client.id,
      scopeValidation.validatedScopes,
      getTokenExpirationDate(ACCESS_TOKEN_EXPIRES_IN),
    ]
  )

  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    scope: formatScopes(scopeValidation.validatedScopes),
  }

  return NextResponse.json(response)
}
