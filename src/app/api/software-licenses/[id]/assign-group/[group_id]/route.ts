/**
 * Software License Group Unassignment API Route
 * Handles removing a license assignment from a group
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/software-licenses/[id]/assign-group/[group_id]
 * Remove a software license assignment from a group
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; group_id: string }> }
) {
  try {
    const { id: license_id, group_id } = await context.params

    // Check if the assignment exists
    const existingCheck = await query(
      'SELECT 1 FROM group_software_licenses WHERE group_id = $1 AND license_id = $2',
      [group_id, license_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'License is not assigned to this group',
        },
        { status: 404 }
      )
    }

    // Remove the assignment
    await query('DELETE FROM group_software_licenses WHERE group_id = $1 AND license_id = $2', [
      group_id,
      license_id,
    ])

    return NextResponse.json({
      success: true,
      message: 'License unassigned from group successfully',
    })
  } catch (error) {
    console.error('Error unassigning license from group:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to unassign license from group',
      },
      { status: 500 }
    )
  }
}
