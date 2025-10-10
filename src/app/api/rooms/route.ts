/**
 * Rooms API - List and Create
 * GET /api/rooms - List rooms with filtering, searching, sorting, and pagination
 * POST /api/rooms - Create a new room
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { safeValidate } from '@/lib/validation'
import { CreateRoomSchema, ListRoomsQuerySchema } from '@/lib/schemas/room'
import type { Room } from '@/types'

/**
 * GET /api/rooms
 * List all rooms with optional filtering, searching, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validation = safeValidate(ListRoomsQuerySchema, params)
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 })
    }

    const { page, limit, location_id, room_type, floor, search, sort_by, sort_order } =
      validation.data

    // Build dynamic WHERE conditions
    const conditions: string[] = []
    const values: (string | number | null | undefined)[] = []
    let paramCount = 1

    if (location_id) {
      conditions.push(`location_id = $${paramCount}`)
      values.push(location_id)
      paramCount++
    }

    if (room_type) {
      conditions.push(`room_type = $${paramCount}`)
      values.push(room_type)
      paramCount++
    }

    if (floor) {
      conditions.push(`floor = $${paramCount}`)
      values.push(floor)
      paramCount++
    }

    if (search) {
      conditions.push(`room_name ILIKE $${paramCount}`)
      values.push(`%${search}%`)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM rooms ${whereClause}`,
      values
    )
    const totalCount = parseInt(countResult.rows[0].count, 10)

    // Get paginated results
    const offset = (page - 1) * limit
    const sortColumn = sort_by || 'room_name'
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC'

    values.push(limit, offset)
    const roomsResult = await query<Room>(
      `SELECT * FROM rooms
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: {
        rooms: roomsResult.rows,
        pagination: {
          page,
          limit,
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch rooms' }, { status: 500 })
  }
}

/**
 * POST /api/rooms
 * Create a new room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = safeValidate(CreateRoomSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 })
    }

    const {
      location_id,
      room_name,
      room_number,
      room_type,
      floor,
      capacity,
      access_requirements,
      notes,
    } = validation.data

    // Verify location exists
    const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [location_id])
    if (locationCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 })
    }

    // Insert new room
    const result = await query<Room>(
      `INSERT INTO rooms (location_id, room_name, room_number, room_type, floor, capacity, access_requirements, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        location_id,
        room_name,
        room_number || null,
        room_type || null,
        floor || null,
        capacity || null,
        access_requirements || null,
        notes || null,
      ]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ success: false, message: 'Failed to create room' }, { status: 500 })
  }
}
