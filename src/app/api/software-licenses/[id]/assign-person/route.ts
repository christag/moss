/**
 * Software License Person Assignment API Route
 * Handles assigning a license to a person
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Person } from '@/types'

/**
 * POST /api/software-licenses/[id]/assign-person
 * Assign a software license to a person
 * Body: { person_id: string }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: license_id } = await context.params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }
    const body = parseResult.data as Record<string, unknown>

    if (!body.person_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'person_id is required',
        },
        { status: 400 }
      )
    }

    const person_id = body.person_id

    // Verify license exists and check seat availability
    const licenseCheck = await query(
      'SELECT seats_purchased, seats_assigned FROM software_licenses WHERE id = $1',
      [license_id]
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
    const seatsAvailable = (license.seats_purchased || 0) - (license.seats_assigned || 0)

    if (seatsAvailable <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No available seats for this license',
        },
        { status: 400 }
      )
    }

    // Verify person exists
    const personCheck = await query('SELECT id FROM people WHERE id = $1', [person_id])
    if (personCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Person not found',
        },
        { status: 404 }
      )
    }

    // Check if already assigned
    const existingCheck = await query(
      'SELECT 1 FROM person_software_licenses WHERE person_id = $1 AND license_id = $2',
      [person_id, license_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'License is already assigned to this person',
        },
        { status: 409 }
      )
    }

    // Assign license
    await query('INSERT INTO person_software_licenses (person_id, license_id) VALUES ($1, $2)', [
      person_id,
      license_id,
    ])

    // Update seats_assigned count
    await query(
      'UPDATE software_licenses SET seats_assigned = COALESCE(seats_assigned, 0) + 1 WHERE id = $1',
      [license_id]
    )

    // Return the person details
    const personResult = await query<Person>('SELECT * FROM people WHERE id = $1', [person_id])

    return NextResponse.json({
      success: true,
      data: personResult.rows[0],
      message: 'License assigned to person successfully',
    })
  } catch (error) {
    console.error('Error assigning license to person:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to assign license to person',
      },
      { status: 500 }
    )
  }
}
