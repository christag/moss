/**
 * OAuth 2.1 Token Revocation Endpoint
 * POST /api/oauth/revoke
 *
 * Revokes access or refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { RevokeTokenRequestSchema } from '@/lib/schemas/oauth'
import { verifyClientSecret } from '@/lib/oauth'
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
  return withCORS(request, async () => handleRevocationRequest(request), getProductionCORSConfig())
}

async function handleRevocationRequest(request: NextRequest) {
  const pool = getPool()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = RevokeTokenRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: validationResult.error.errors[0]?.message || 'Invalid request',
        },
        { status: 400 }
      )
    }

    const { token, client_id, client_secret } = validationResult.data

    // Verify client exists and is active
    const clientResult = await pool.query<OAuthClient>(
      'SELECT * FROM oauth_clients WHERE client_id = $1 AND is_active = true',
      [client_id]
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
      if (!client_secret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Client secret required' },
          { status: 401 }
        )
      }

      const secretValid = await verifyClientSecret(client_secret, client.client_secret)
      if (!secretValid) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Invalid client secret' },
          { status: 401 }
        )
      }
    }

    // Revoke token (works for both access and refresh tokens)
    // We revoke by marking the record as revoked, not deleting it (audit trail)
    await pool.query(
      `UPDATE oauth_tokens
       SET revoked = true, updated_at = NOW()
       WHERE (access_token = $1 OR refresh_token = $1)
         AND client_id = $2
         AND revoked = false`,
      [token, client.id]
    )

    // RFC 7009: The revocation endpoint responds with HTTP status code 200
    // regardless of whether the token exists or not (prevent token scanning)
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[OAuth Revoke] Error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
