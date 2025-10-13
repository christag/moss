/**
 * IO Tagged Network Delete API Route
 * Handles removing a VLAN tag from a trunk port
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/ios/[id]/tagged-networks/[network_id]
 * Remove a VLAN tag from a trunk port
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; network_id: string }> }
) {
  try {
    const { id: io_id, network_id } = await context.params

    // Check if the tagging exists
    const existingCheck = await query(
      'SELECT 1 FROM io_tagged_networks WHERE io_id = $1 AND network_id = $2',
      [io_id, network_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network is not tagged on this IO',
        },
        { status: 404 }
      )
    }

    // Remove the tag
    await query('DELETE FROM io_tagged_networks WHERE io_id = $1 AND network_id = $2', [
      io_id,
      network_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'Network tag removed successfully',
    })
  } catch (error) {
    console.error('Error removing network tag:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove network tag',
      },
      { status: 500 }
    )
  }
}
