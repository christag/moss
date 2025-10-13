/**
 * Room Documents API Routes
 * Handles getting documents associated with a specific room
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * GET /api/rooms/:id/documents
 * Get all documents associated with a specific room
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const roomId = id

    // Validate room exists
    const roomCheck = await query('SELECT id FROM rooms WHERE id = $1', [roomId])
    if (roomCheck.rows.length === 0) {
      return errorResponse('Room not found', 404)
    }

    // Get documents associated with this room via document_rooms junction table
    const result = await query(
      `
      SELECT
        d.id,
        d.title,
        d.document_type,
        d.status,
        d.version,
        d.created_date,
        d.updated_date,
        d.created_at,
        d.updated_at,
        p.full_name as author_name
      FROM documents d
      INNER JOIN document_rooms dr ON d.id = dr.document_id
      LEFT JOIN people p ON d.author_id = p.id
      WHERE dr.room_id = $1
      ORDER BY d.updated_at DESC
      `,
      [roomId]
    )

    return successResponse(
      {
        documents: result.rows,
        pagination: {
          total_count: result.rows.length,
          page: 1,
          page_size: result.rows.length,
          total_pages: 1,
        },
      },
      'Documents retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching room documents:', error)
    return errorResponse('Failed to fetch documents')
  }
}
