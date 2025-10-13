/**
 * Document-SaaS Service Association Delete API Route
 * Handles removing SaaS service associations from documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/documents/[id]/saas-services/[saas_service_id]
 * Remove a SaaS service association from a document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; saas_service_id: string }> }
) {
  try {
    const { id: document_id, saas_service_id } = await context.params

    // Check if the association exists
    const existingCheck = await query(
      'SELECT 1 FROM document_saas_services WHERE document_id = $1 AND saas_service_id = $2',
      [document_id, saas_service_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'SaaS service is not associated with this document',
        },
        { status: 404 }
      )
    }

    // Remove the association
    await query(
      'DELETE FROM document_saas_services WHERE document_id = $1 AND saas_service_id = $2',
      [document_id, saas_service_id]
    )

    return NextResponse.json({
      success: true,
      message: 'SaaS service association removed successfully',
    })
  } catch (error) {
    console.error('Error removing SaaS service association:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove SaaS service association',
      },
      { status: 500 }
    )
  }
}
