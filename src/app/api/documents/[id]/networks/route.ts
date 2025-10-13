/**
 * Document-Network Association API Routes
 * Handles associating documents with networks
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Network } from '@/types'

/**
 * GET /api/documents/[id]/networks
 * Get all networks associated with a document
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Verify document exists
    const docCheck = await query('SELECT id FROM documents WHERE id = $1', [id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found',
        },
        { status: 404 }
      )
    }

    // Fetch associated networks
    const result = await query<Network>(
      `
      SELECT n.*
      FROM networks n
      INNER JOIN document_networks dn ON dn.network_id = n.id
      WHERE dn.document_id = $1
      ORDER BY n.network_name ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Associated networks retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching associated networks:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch associated networks',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/[id]/networks
 * Associate a network with a document
 * Body: { network_id: string }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: document_id } = await context.params

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

    // Verify document exists
    const docCheck = await query('SELECT id FROM documents WHERE id = $1', [document_id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found',
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

    // Check if already associated
    const existingCheck = await query(
      'SELECT 1 FROM document_networks WHERE document_id = $1 AND network_id = $2',
      [document_id, network_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network is already associated with this document',
        },
        { status: 409 }
      )
    }

    // Create association
    await query('INSERT INTO document_networks (document_id, network_id) VALUES ($1, $2)', [
      document_id,
      network_id,
    ])

    // Return the network details
    const networkResult = await query<Network>('SELECT * FROM networks WHERE id = $1', [network_id])

    return NextResponse.json({
      success: true,
      data: networkResult.rows[0],
      message: 'Network associated with document successfully',
    })
  } catch (error) {
    console.error('Error associating network:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to associate network',
      },
      { status: 500 }
    )
  }
}
