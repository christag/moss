/**
 * Single Room API
 * GET /api/rooms/[id] - Get a single room
 * PATCH /api/rooms/[id] - Update a room
 * DELETE /api/rooms/[id] - Delete a room
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { safeValidate } from '@/lib/validation'
import { UpdateRoomSchema, UUIDSchema } from '@/lib/schemas/room'
import type { Room } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/rooms/[id]
 * Get a single room by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = safeValidate(UUIDSchema, id)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.errors.errors[0]?.message || 'Invalid UUID' },
        { status: 400 }
      )
    }

    const result = await query<Room>('SELECT * FROM rooms WHERE id = $1', [validation.data])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch room' }, { status: 500 })
  }
}

/**
 * PATCH /api/rooms/[id]
 * Update a room
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

    // Validate UUID
    const idValidation = safeValidate(UUIDSchema, id)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, message: idValidation.errors.errors[0]?.message || 'Invalid UUID' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = safeValidate(UpdateRoomSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.errors.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if room exists
    const roomCheck = await query('SELECT id FROM rooms WHERE id = $1', [idValidation.data])
    if (roomCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 })
    }

    // If location_id is being changed, verify new location exists
    if (validation.data.location_id) {
      const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [
        validation.data.location_id,
      ])
      if (locationCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 })
      }
    }

    // Build dynamic UPDATE query
    const updates: string[] = []
    const values: (string | number | null | undefined)[] = []
    let paramCount = 1

    const fields = validation.data
    const fieldMapping: Record<string, string> = {
      location_id: 'location_id',
      room_name: 'room_name',
      room_number: 'room_number',
      room_type: 'room_type',
      floor: 'floor',
      capacity: 'capacity',
      access_requirements: 'access_requirements',
      notes: 'notes',
    }

    Object.entries(fields).forEach(([key, value]) => {
      if (fieldMapping[key] && value !== undefined) {
        updates.push(`${fieldMapping[key]} = $${paramCount}`)
        values.push(value as string | number | null)
        paramCount++
      }
    })

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(idValidation.data)

    const result = await query<Room>(
      `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ success: false, message: 'Failed to update room' }, { status: 500 })
  }
}

/**
 * DELETE /api/rooms/[id]
 * Delete a room (with dependency checking)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = safeValidate(UUIDSchema, id)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.errors.errors[0]?.message || 'Invalid UUID' },
        { status: 400 }
      )
    }

    // Check if room exists
    const roomCheck = await query('SELECT id FROM rooms WHERE id = $1', [validation.data])
    if (roomCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 })
    }

    // Check for dependencies (devices)
    const dependenciesResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM devices WHERE room_id = $1`,
      [validation.data]
    )

    const dependencyCount = parseInt(dependenciesResult.rows[0].count, 10)
    if (dependencyCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete room: ${dependencyCount} device(s) are assigned to this room. Please reassign or delete them first.`,
        },
        { status: 409 }
      )
    }

    // Delete the room
    await query('DELETE FROM rooms WHERE id = $1', [validation.data])

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete room' }, { status: 500 })
  }
}
