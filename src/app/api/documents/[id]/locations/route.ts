/**
 * Document-Location Association API Routes
 * Handles associating documents with locations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Location } from '@/types'

/**
 * GET /api/documents/[id]/locations
 * Get all locations associated with a document
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

    // Fetch associated locations
    const result = await query<Location>(
      `
      SELECT l.*
      FROM locations l
      INNER JOIN document_locations dl ON dl.location_id = l.id
      WHERE dl.document_id = $1
      ORDER BY l.location_name ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Associated locations retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching associated locations:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch associated locations',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/[id]/locations
 * Associate a location with a document
 * Body: { location_id: string }
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

    if (!body.location_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'location_id is required',
        },
        { status: 400 }
      )
    }

    const location_id = body.location_id

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

    // Verify location exists
    const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [location_id])
    if (locationCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Location not found',
        },
        { status: 404 }
      )
    }

    // Check if already associated
    const existingCheck = await query(
      'SELECT 1 FROM document_locations WHERE document_id = $1 AND location_id = $2',
      [document_id, location_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Location is already associated with this document',
        },
        { status: 409 }
      )
    }

    // Create association
    await query('INSERT INTO document_locations (document_id, location_id) VALUES ($1, $2)', [
      document_id,
      location_id,
    ])

    // Return the location details
    const locationResult = await query<Location>('SELECT * FROM locations WHERE id = $1', [
      location_id,
    ])

    return NextResponse.json({
      success: true,
      data: locationResult.rows[0],
      message: 'Location associated with document successfully',
    })
  } catch (error) {
    console.error('Error associating location:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to associate location',
      },
      { status: 500 }
    )
  }
}
