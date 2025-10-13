/**
 * Document-Network Association Delete API Route
 * Handles removing network associations from documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/documents/[id]/networks/[network_id]
 * Remove a network association from a document
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; network_id: string }> }
) {
  try {
    const { id: document_id, network_id } = await context.params

    // Check if the association exists
    const existingCheck = await query(
      'SELECT 1 FROM document_networks WHERE document_id = $1 AND network_id = $2',
      [document_id, network_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network is not associated with this document',
        },
        { status: 404 }
      )
    }

    // Remove the association
    await query('DELETE FROM document_networks WHERE document_id = $1 AND network_id = $2', [
      document_id,
      network_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'Network association removed successfully',
    })
  } catch (error) {
    console.error('Error removing network association:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove network association',
      },
      { status: 500 }
    )
  }
}
