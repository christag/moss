/**
 * Document-Device Association API Routes
 * Handles associating documents with devices
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Device } from '@/types'

/**
 * GET /api/documents/[id]/devices
 * Get all devices associated with a document
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

    // Fetch associated devices
    const result = await query<Device>(
      `
      SELECT d.*
      FROM devices d
      INNER JOIN document_devices dd ON dd.device_id = d.id
      WHERE dd.document_id = $1
      ORDER BY d.hostname ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Associated devices retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching associated devices:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch associated devices',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/[id]/devices
 * Associate a device with a document
 * Body: { device_id: string }
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

    if (!body.device_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'device_id is required',
        },
        { status: 400 }
      )
    }

    const device_id = body.device_id

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

    // Verify device exists
    const deviceCheck = await query('SELECT id FROM devices WHERE id = $1', [device_id])
    if (deviceCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device not found',
        },
        { status: 404 }
      )
    }

    // Check if already associated
    const existingCheck = await query(
      'SELECT 1 FROM document_devices WHERE document_id = $1 AND device_id = $2',
      [document_id, device_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device is already associated with this document',
        },
        { status: 409 }
      )
    }

    // Create association
    await query('INSERT INTO document_devices (document_id, device_id) VALUES ($1, $2)', [
      document_id,
      device_id,
    ])

    // Return the device details
    const deviceResult = await query<Device>('SELECT * FROM devices WHERE id = $1', [device_id])

    return NextResponse.json({
      success: true,
      data: deviceResult.rows[0],
      message: 'Device associated with document successfully',
    })
  } catch (error) {
    console.error('Error associating device:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to associate device',
      },
      { status: 500 }
    )
  }
}
