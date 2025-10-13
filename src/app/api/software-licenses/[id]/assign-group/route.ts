/**
 * Software License Group Assignment API Route
 * Handles assigning a license to a group
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { Group } from '@/types'

/**
 * POST /api/software-licenses/[id]/assign-group
 * Assign a software license to a group
 * Body: { group_id: string }
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

    if (!body.group_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'group_id is required',
        },
        { status: 400 }
      )
    }

    const group_id = body.group_id

    // Verify license exists
    const licenseCheck = await query('SELECT id FROM software_licenses WHERE id = $1', [license_id])

    if (licenseCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Software license not found',
        },
        { status: 404 }
      )
    }

    // Verify group exists
    const groupCheck = await query('SELECT id FROM groups WHERE id = $1', [group_id])
    if (groupCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Group not found',
        },
        { status: 404 }
      )
    }

    // Check if already assigned
    const existingCheck = await query(
      'SELECT 1 FROM group_software_licenses WHERE group_id = $1 AND license_id = $2',
      [group_id, license_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'License is already assigned to this group',
        },
        { status: 409 }
      )
    }

    // Assign license to group
    await query('INSERT INTO group_software_licenses (group_id, license_id) VALUES ($1, $2)', [
      group_id,
      license_id,
    ])

    // Return the group details
    const groupResult = await query<Group>('SELECT * FROM groups WHERE id = $1', [group_id])

    return NextResponse.json({
      success: true,
      data: groupResult.rows[0],
      message: 'License assigned to group successfully',
    })
  } catch (error) {
    console.error('Error assigning license to group:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to assign license to group',
      },
      { status: 500 }
    )
  }
}
