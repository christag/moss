/**
 * Group API Routes - Individual Group Operations
 * Handles getting, updating, and deleting a specific group
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateGroupSchema } from '@/lib/schemas/group'
import type { Group } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/groups/:id
 * Get a single group by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await query<Group>('SELECT * FROM groups WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch group' }, { status: 500 })
  }
}

/**
 * PATCH /api/groups/:id
 * Update a group
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = UpdateGroupSchema.parse(body)

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Add each field if provided
    if (validated.group_name !== undefined) {
      paramCount++
      updates.push(`group_name = $${paramCount}`)
      values.push(validated.group_name)
    }
    if (validated.group_type !== undefined) {
      paramCount++
      updates.push(`group_type = $${paramCount}`)
      values.push(validated.group_type)
    }
    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }
    if (validated.group_id_external !== undefined) {
      paramCount++
      updates.push(`group_id_external = $${paramCount}`)
      values.push(validated.group_id_external)
    }
    if (validated.created_date !== undefined) {
      paramCount++
      updates.push(`created_date = $${paramCount}`)
      values.push(validated.created_date)
    }
    if (validated.notes !== undefined) {
      paramCount++
      updates.push(`notes = $${paramCount}`)
      values.push(validated.notes)
    }

    // Always update updated_at (no parameter needed)
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 1) {
      // Only updated_at was added, no actual fields to update
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add group ID as last parameter
    paramCount++
    values.push(id)

    const result = await query<Group>(
      `
      UPDATE groups
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating group:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to update group' }, { status: 500 })
  }
}

/**
 * DELETE /api/groups/:id
 * Delete a group
 * Note: group_members will be automatically deleted due to CASCADE constraint
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if group exists and has members (optional - could just let CASCADE handle it)
    const memberCheck = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1',
      [id]
    )
    const memberCount = parseInt(memberCheck.rows[0].count, 10)

    // Delete the group (CASCADE will remove group_members entries)
    const result = await query('DELETE FROM groups WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Group deleted successfully',
        id: result.rows[0].id,
        removed_members: memberCount,
      },
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete group' }, { status: 500 })
  }
}
