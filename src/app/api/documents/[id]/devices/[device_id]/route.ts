/**
 * Document-Device Association Delete API Route
 * Handles removing device associations from documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/documents/[id]/devices/[device_id]
 * Remove a device association from a document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; device_id: string }> }
) {
  try {
    const { id: document_id, device_id } = await context.params

    // Check if the association exists
    const existingCheck = await query(
      'SELECT 1 FROM document_devices WHERE document_id = $1 AND device_id = $2',
      [document_id, device_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device is not associated with this document',
        },
        { status: 404 }
      )
    }

    // Remove the association
    await query('DELETE FROM document_devices WHERE document_id = $1 AND device_id = $2', [
      document_id,
      device_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'Device association removed successfully',
    })
  } catch (error) {
    console.error('Error removing device association:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove device association',
      },
      { status: 500 }
    )
  }
}
