/**
 * Document-Room Association API Routes
 * Handles associating documents with rooms
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Room } from '@/types'

/**
 * GET /api/documents/[id]/rooms
 * Get all rooms associated with a document
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    // Fetch associated rooms
    const result = await query<Room>(
      `
      SELECT r.*
      FROM rooms r
      INNER JOIN document_rooms dr ON dr.room_id = r.id
      WHERE dr.document_id = $1
      ORDER BY r.room_name ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Associated rooms retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching associated rooms:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch associated rooms',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/[id]/rooms
 * Associate a room with a document
 * Body: { room_id: string }
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

    if (!body.room_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'room_id is required',
        },
        { status: 400 }
      )
    }

    const room_id = body.room_id

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

    // Verify room exists
    const roomCheck = await query('SELECT id FROM rooms WHERE id = $1', [room_id])
    if (roomCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room not found',
        },
        { status: 404 }
      )
    }

    // Check if already associated
    const existingCheck = await query(
      'SELECT 1 FROM document_rooms WHERE document_id = $1 AND room_id = $2',
      [document_id, room_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room is already associated with this document',
        },
        { status: 409 }
      )
    }

    // Create association
    await query('INSERT INTO document_rooms (document_id, room_id) VALUES ($1, $2)', [
      document_id,
      room_id,
    ])

    // Return the room details
    const roomResult = await query<Room>('SELECT * FROM rooms WHERE id = $1', [room_id])

    return NextResponse.json({
      success: true,
      data: roomResult.rows[0],
      message: 'Room associated with document successfully',
    })
  } catch (error) {
    console.error('Error associating room:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to associate room',
      },
      { status: 500 }
    )
  }
}
