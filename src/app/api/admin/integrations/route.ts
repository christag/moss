/**
 * API Route: Admin Integrations
 * GET - List all integrations
 * POST - Create new integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth, hasRole } from '@/lib/auth'
import { CreateIntegrationSchema } from '@/lib/schemas/admin'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import type { Integration } from '@/types'

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()
    const result = await pool.query<Integration>(
      `SELECT * FROM integrations ORDER BY created_at DESC`
    )

    return NextResponse.json({ integrations: result.rows })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const validationResult = CreateIntegrationSchema.safeParse(parseResult.data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const pool = getPool()

    const result = await pool.query<Integration>(
      `INSERT INTO integrations (
        integration_type, name, provider, config,
        sync_enabled, sync_frequency, is_active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.integration_type,
        data.name,
        data.provider,
        JSON.stringify(data.config),
        data.sync_enabled || false,
        data.sync_frequency || null,
        data.is_active !== undefined ? data.is_active : true,
        data.notes || null,
      ]
    )

    const integration = result.rows[0]

    await logAdminAction({
      user_id: session.user.id,
      action: 'create_integration',
      category: 'integrations',
      target_type: 'integration',
      target_id: integration.id,
      details: { integration_type: data.integration_type, name: data.name },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json(integration, { status: 201 })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}
