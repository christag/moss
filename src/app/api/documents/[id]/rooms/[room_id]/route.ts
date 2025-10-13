/**
 * Document-Room Association Delete API Route
 * Handles removing room associations from documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/documents/[id]/rooms/[room_id]
 * Remove a room association from a document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; room_id: string }> }
) {
  try {
    const { id: document_id, room_id } = await context.params

    // Check if the association exists
    const existingCheck = await query(
      'SELECT 1 FROM document_rooms WHERE document_id = $1 AND room_id = $2',
      [document_id, room_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room is not associated with this document',
        },
        { status: 404 }
      )
    }

    // Remove the association
    await query('DELETE FROM document_rooms WHERE document_id = $1 AND room_id = $2', [
      document_id,
      room_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'Room association removed successfully',
    })
  } catch (error) {
    console.error('Error removing room association:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove room association',
      },
      { status: 500 }
    )
  }
}
