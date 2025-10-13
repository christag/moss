/**
 * Software License Person Unassignment API Route
 * Handles removing a license assignment from a person
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * DELETE /api/software-licenses/[id]/assign-person/[person_id]
 * Remove a software license assignment from a person
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; person_id: string }> }
) {
  try {
    const { id: license_id, person_id } = await context.params

    // Check if the assignment exists
    const existingCheck = await query(
      'SELECT 1 FROM person_software_licenses WHERE person_id = $1 AND license_id = $2',
      [person_id, license_id]
    )

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'License is not assigned to this person',
        },
        { status: 404 }
      )
    }

    // Remove the assignment
    await query('DELETE FROM person_software_licenses WHERE person_id = $1 AND license_id = $2', [
      person_id,
      license_id,
    ])

    // Decrement seats_assigned count
    await query(
      'UPDATE software_licenses SET seats_assigned = GREATEST(COALESCE(seats_assigned, 0) - 1, 0) WHERE id = $1',
      [license_id]
    )

    return NextResponse.json({
      success: true,
      message: 'License unassigned from person successfully',
    })
  } catch (error) {
    console.error('Error unassigning license from person:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to unassign license from person',
      },
      { status: 500 }
    )
  }
}
