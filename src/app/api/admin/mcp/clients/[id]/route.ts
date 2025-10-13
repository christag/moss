/**
 * Admin API: Individual OAuth Client Management
 * GET/PATCH/DELETE /api/admin/mcp/clients/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { UpdateOAuthClientSchema } from '@/lib/schemas/oauth'
import type { OAuthClient } from '@/types/oauth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')

    const { id } = await params
    const pool = getPool()

    const result = await pool.query<OAuthClient>(
      `SELECT id, client_id, client_name, redirect_uris, allowed_scopes,
              client_type, is_active, created_by, created_at, updated_at
       FROM oauth_clients
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      client: result.rows[0],
    })
  } catch (error) {
    console.error('[Admin MCP Client] GET Error:', error)
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')

    const { id } = await params
    const body = await request.json()
    const validationResult = UpdateOAuthClientSchema.safeParse(body)

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
    const pool = getPool()

    // Build dynamic UPDATE query
    const updates: string[] = []
    const values: (string | string[] | boolean)[] = [id]
    let paramCount = 1

    if (data.client_name !== undefined) {
      paramCount++
      updates.push(`client_name = $${paramCount}`)
      values.push(data.client_name)
    }

    if (data.redirect_uris !== undefined) {
      paramCount++
      updates.push(`redirect_uris = $${paramCount}`)
      values.push(data.redirect_uris)
    }

    if (data.allowed_scopes !== undefined) {
      paramCount++
      updates.push(`allowed_scopes = $${paramCount}`)
      values.push(data.allowed_scopes)
    }

    if (data.is_active !== undefined) {
      paramCount++
      updates.push(`is_active = $${paramCount}`)
      values.push(data.is_active)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)

    const result = await pool.query<OAuthClient>(
      `UPDATE oauth_clients
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, client_id, client_name, redirect_uris, allowed_scopes, client_type, is_active`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      client: result.rows[0],
    })
  } catch (error) {
    console.error('[Admin MCP Client] PATCH Error:', error)
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('admin')

    const { id } = await params
    const pool = getPool()

    // Revoke all tokens for this client first
    await pool.query('UPDATE oauth_tokens SET revoked = true WHERE client_id = $1', [id])

    // Delete the client
    const result = await pool.query('DELETE FROM oauth_clients WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('[Admin MCP Client] DELETE Error:', error)
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  }
}
