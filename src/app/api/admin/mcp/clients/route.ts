/**
 * Admin API: OAuth Client Management
 * GET/POST /api/admin/mcp/clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { CreateOAuthClientSchema } from '@/lib/schemas/oauth'
import { generateClientId, generateClientSecret, hashClientSecret } from '@/lib/oauth'
import type { OAuthClient } from '@/types/oauth'

export async function GET(_request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    const pool = getPool()

    // Get all OAuth clients (exclude client_secret hash)
    const result = await pool.query<OAuthClient>(`
      SELECT
        id, client_id, client_name, redirect_uris, allowed_scopes,
        client_type, is_active, created_by, created_at, updated_at
      FROM oauth_clients
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      success: true,
      clients: result.rows,
    })
  } catch (error) {
    console.error('[Admin MCP Clients] GET Error:', error)
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireRole('admin')

    const body = await request.json()
    const validationResult = CreateOAuthClientSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Generate client credentials
    const clientId = generateClientId()
    const clientSecret = generateClientSecret()
    const clientSecretHash = await hashClientSecret(clientSecret)

    const pool = getPool()

    // Insert new client
    const result = await pool.query<OAuthClient>(
      `INSERT INTO oauth_clients
       (client_id, client_secret, client_name, redirect_uris, allowed_scopes, client_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, client_id, client_name, redirect_uris, allowed_scopes, client_type, is_active, created_at`,
      [
        clientId,
        clientSecretHash,
        data.client_name,
        data.redirect_uris,
        data.allowed_scopes,
        data.client_type,
        session.user.id,
      ]
    )

    // Return client with plaintext secret (only time it's shown)
    return NextResponse.json({
      success: true,
      message: 'OAuth client created successfully',
      client: result.rows[0],
      client_secret: clientSecret, // IMPORTANT: Save this - it won't be shown again
    })
  } catch (error) {
    console.error('[Admin MCP Clients] POST Error:', error)
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  }
}
