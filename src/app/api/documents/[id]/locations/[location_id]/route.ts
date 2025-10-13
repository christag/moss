/**
 * Document-Location Association Delete API Route
 * Handles removing location associations from documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/documents/[id]/locations/[location_id]
 * Remove a location association from a document
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; location_id: string }> }
) {
  try {
    const { id: document_id, location_id } = await context.params

    // Check if the association exists
    const existingCheck = await query(
      'SELECT 1 FROM document_locations WHERE document_id = $1 AND location_id = $2',
      [document_id, location_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Location is not associated with this document',
        },
        { status: 404 }
      )
    }

    // Remove the association
    await query('DELETE FROM document_locations WHERE document_id = $1 AND location_id = $2', [
      document_id,
      location_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'Location association removed successfully',
    })
  } catch (error) {
    console.error('Error removing location association:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove location association',
      },
      { status: 500 }
    )
  }
}
