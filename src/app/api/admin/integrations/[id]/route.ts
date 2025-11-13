/**
 * API Route: Admin Integration Detail
 * GET - Get single integration
 * PUT - Update integration
 * DELETE - Delete integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth, hasRole } from '@/lib/auth'
import { UpdateIntegrationSchema } from '@/lib/schemas/admin'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import type { IntegrationConfig } from '@/types/integrations'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const pool = getPool()
    const result = await pool.query<IntegrationConfig>(
      `SELECT * FROM integration_configs WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching integration:', error)
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validationResult = UpdateIntegrationSchema.safeParse(parseResult.data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { id } = await params
    const data = validationResult.data
    const pool = getPool()

    const result = await pool.query<IntegrationConfig>(
      `UPDATE integration_configs SET
        name = COALESCE($1, name),
        config = COALESCE($2, config),
        is_enabled = COALESCE($3, is_enabled),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [data.name, data.config ? JSON.stringify(data.config) : null, data.is_active, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const integration = result.rows[0]

    await logAdminAction({
      user_id: session.user.id,
      action: 'update_integration',
      category: 'integrations',
      target_type: 'integration',
      target_id: integration.id,
      details: { changes: data },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json(integration)
  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const pool = getPool()

    // Get integration details before deletion for logging
    const integrationResult = await pool.query<IntegrationConfig>(
      `SELECT * FROM integration_configs WHERE id = $1`,
      [id]
    )

    if (integrationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const integration = integrationResult.rows[0]

    // Delete the integration
    await pool.query(`DELETE FROM integration_configs WHERE id = $1`, [id])

    await logAdminAction({
      user_id: session.user.id,
      action: 'delete_integration',
      category: 'integrations',
      target_type: 'integration',
      target_id: id,
      details: {
        integration_type: integration.integration_type,
        name: integration.name,
      },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({ message: 'Integration deleted successfully' })
  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}
