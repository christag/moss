/**
 * Group Members API Routes
 * Handles getting, adding, and removing members from a group
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { AddGroupMemberSchema, RemoveGroupMemberSchema } from '@/lib/schemas/rbac'
import type { Person } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/groups/:id/members
 * Get all members of a group
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify group exists
    const groupCheck = await query('SELECT id FROM groups WHERE id = $1', [id])
    if (groupCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    }

    // Get all members for this group
    const sql = `
      SELECT p.*
      FROM people p
      INNER JOIN group_members gm ON p.id = gm.person_id
      WHERE gm.group_id = $1
      ORDER BY p.last_name, p.first_name
    `

    const result = await query<Person>(sql, [id])

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch group members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/groups/:id/members
 * Add a member to a group
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params

    // Verify group exists
    const groupCheck = await query('SELECT id FROM groups WHERE id = $1', [groupId])
    if (groupCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    }

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = AddGroupMemberSchema.parse(body)

    // Verify person exists
    const personCheck = await query('SELECT id FROM people WHERE id = $1', [validated.person_id])
    if (personCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Person not found' }, { status: 404 })
    }

    // Check if already a member
    const memberCheck = await query(
      'SELECT * FROM group_members WHERE group_id = $1 AND person_id = $2',
      [groupId, validated.person_id]
    )

    if (memberCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Person is already a member of this group' },
        { status: 400 }
      )
    }

    // Add member
    await query('INSERT INTO group_members (group_id, person_id) VALUES ($1, $2)', [
      groupId,
      validated.person_id,
    ])

    // Fetch and return the person's details
    const personResult = await query<Person>('SELECT * FROM people WHERE id = $1', [
      validated.person_id,
    ])

    return NextResponse.json({
      success: true,
      data: personResult.rows[0],
      message: 'Member added successfully',
    })
  } catch (error) {
    console.error('Error adding group member:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to add group member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/:id/members
 * Remove a member from a group
 * Person ID provided in request body
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = RemoveGroupMemberSchema.parse(body)

    // Remove member
    const result = await query(
      'DELETE FROM group_members WHERE group_id = $1 AND person_id = $2 RETURNING *',
      [groupId, validated.person_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Person is not a member of this group' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
      data: { group_id: groupId, person_id: validated.person_id },
    })
  } catch (error) {
    console.error('Error removing group member:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to remove group member' },
      { status: 500 }
    )
  }
}
