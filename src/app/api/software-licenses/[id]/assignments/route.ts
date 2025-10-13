/**
 * Software License Assignments API Routes
 * Handles viewing all assignments (people and groups) for a license
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Person, Group } from '@/types'

interface LicenseAssignments {
  people: Person[]
  groups: Group[]
  seats_total: number
  seats_assigned: number
  seats_available: number
}

/**
 * GET /api/software-licenses/[id]/assignments
 * Retrieve all assignments for a software license (people and groups)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Verify license exists and get seat info
    const licenseCheck = await query(
      'SELECT seats_purchased, seats_assigned FROM software_licenses WHERE id = $1',
      [id]
    )

    if (licenseCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Software license not found',
        },
        { status: 404 }
      )
    }

    const license = licenseCheck.rows[0]

    // Fetch assigned people
    const peopleResult = await query<Person>(
      `
      SELECT p.*
      FROM people p
      INNER JOIN person_software_licenses psl ON psl.person_id = p.id
      WHERE psl.license_id = $1
      ORDER BY p.full_name ASC
    `,
      [id]
    )

    // Fetch assigned groups
    const groupsResult = await query<Group>(
      `
      SELECT g.*
      FROM groups g
      INNER JOIN group_software_licenses gsl ON gsl.group_id = g.id
      WHERE gsl.license_id = $1
      ORDER BY g.group_name ASC
    `,
      [id]
    )

    const assignments: LicenseAssignments = {
      people: peopleResult.rows,
      groups: groupsResult.rows,
      seats_total: license.seats_purchased || 0,
      seats_assigned: license.seats_assigned || 0,
      seats_available: (license.seats_purchased || 0) - (license.seats_assigned || 0),
    }

    return NextResponse.json({
      success: true,
      data: assignments,
      message: 'License assignments retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching license assignments:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch license assignments',
      },
      { status: 500 }
    )
  }
}
