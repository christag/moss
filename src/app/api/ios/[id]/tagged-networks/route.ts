/**
 * IO Tagged Networks API Routes
 * Handles VLAN tagging on trunk ports (io_tagged_networks junction table)
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Network } from '@/types'

/**
 * GET /api/ios/[id]/tagged-networks
 * Retrieve all tagged VLANs for an IO (trunk port configuration)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // First verify the IO exists
    const ioCheck = await query('SELECT id FROM ios WHERE id = $1', [id])
    if (ioCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'IO not found',
        },
        { status: 404 }
      )
    }

    // Fetch tagged networks with full network details
    const sql = `
      SELECT n.*
      FROM networks n
      INNER JOIN io_tagged_networks itn ON itn.network_id = n.id
      WHERE itn.io_id = $1
      ORDER BY n.network_name ASC
    `
    const result = await query<Network>(sql, [id])

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Tagged networks retrieved successfully',
      pagination: {
        total_count: result.rows.length,
      },
    })
  } catch (error) {
    console.error('Error fetching tagged networks:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch tagged networks',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ios/[id]/tagged-networks
 * Add a VLAN to trunk port (tag a network on an IO)
 * Body: { network_id: string }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: io_id } = await context.params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }
    const body = parseResult.data as Record<string, unknown>

    if (!body.network_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'network_id is required',
        },
        { status: 400 }
      )
    }

    const network_id = body.network_id

    // Verify IO exists
    const ioCheck = await query('SELECT id, trunk_mode FROM ios WHERE id = $1', [io_id])
    if (ioCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'IO not found',
        },
        { status: 404 }
      )
    }

    // Verify network exists
    const networkCheck = await query('SELECT id FROM networks WHERE id = $1', [network_id])
    if (networkCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network not found',
        },
        { status: 404 }
      )
    }

    // Check if already tagged
    const existingCheck = await query(
      'SELECT 1 FROM io_tagged_networks WHERE io_id = $1 AND network_id = $2',
      [io_id, network_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network is already tagged on this IO',
        },
        { status: 409 }
      )
    }

    // Add tagged network
    await query('INSERT INTO io_tagged_networks (io_id, network_id) VALUES ($1, $2)', [
      io_id,
      network_id,
    ])

    // Return the network details
    const networkResult = await query<Network>('SELECT * FROM networks WHERE id = $1', [network_id])

    return NextResponse.json({
      success: true,
      data: networkResult.rows[0],
      message: 'Network tagged successfully',
    })
  } catch (error) {
    console.error('Error tagging network:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to tag network',
      },
      { status: 500 }
    )
  }
}
