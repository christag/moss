/**
 * IOs API Routes
 * Handles listing and creating IOs (Interfaces/Ports)
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateIOSchema, IOQuerySchema } from '@/lib/schemas/io'
import type { IO } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/ios
 * List IOs with optional filtering, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = IOQuerySchema.parse(params)

    const {
      search,
      interface_type,
      media_type,
      status,
      device_id,
      room_id,
      native_network_id,
      connected_to_io_id,
      trunk_mode,
      limit,
      offset,
      sort_by,
      sort_order,
    } = validatedParams

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const values: (string | number)[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(
        `(interface_name ILIKE $${paramIndex} OR port_number ILIKE $${paramIndex} OR mac_address ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      )
      values.push(`%${search}%`)
      paramIndex++
    }

    if (interface_type) {
      conditions.push(`interface_type = $${paramIndex}`)
      values.push(interface_type)
      paramIndex++
    }

    if (media_type) {
      conditions.push(`media_type = $${paramIndex}`)
      values.push(media_type)
      paramIndex++
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (device_id) {
      conditions.push(`device_id = $${paramIndex}`)
      values.push(device_id)
      paramIndex++
    }

    if (room_id) {
      conditions.push(`room_id = $${paramIndex}`)
      values.push(room_id)
      paramIndex++
    }

    if (native_network_id) {
      conditions.push(`native_network_id = $${paramIndex}`)
      values.push(native_network_id)
      paramIndex++
    }

    if (connected_to_io_id) {
      conditions.push(`connected_to_io_id = $${paramIndex}`)
      values.push(connected_to_io_id)
      paramIndex++
    }

    if (trunk_mode) {
      conditions.push(`trunk_mode = $${paramIndex}`)
      values.push(trunk_mode)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build query
    const sql = `
      SELECT * FROM ios
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    values.push(limit, offset)

    const result = await query<IO>(sql, values)

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: `Retrieved ${result.rows.length} IO(s)`,
    })
  } catch (error) {
    console.error('Error fetching IOs:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch IOs',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ios
 * Create a new IO
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = CreateIOSchema.parse(body)

    const {
      device_id,
      room_id,
      native_network_id,
      connected_to_io_id,
      interface_name,
      interface_type,
      media_type,
      status,
      speed,
      duplex,
      trunk_mode,
      port_number,
      mac_address,
      voltage,
      amperage,
      wattage,
      power_connector_type,
      description,
      notes,
    } = validatedData

    const sql = `
      INSERT INTO ios (
        device_id, room_id, native_network_id, connected_to_io_id,
        interface_name, interface_type, media_type, status,
        speed, duplex, trunk_mode, port_number, mac_address,
        voltage, amperage, wattage, power_connector_type,
        description, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `

    const values = [
      device_id || null,
      room_id || null,
      native_network_id || null,
      connected_to_io_id || null,
      interface_name,
      interface_type,
      media_type || null,
      status || 'active',
      speed || null,
      duplex || null,
      trunk_mode || null,
      port_number || null,
      mac_address || null,
      voltage || null,
      amperage || null,
      wattage || null,
      power_connector_type || null,
      description || null,
      notes || null,
    ]

    const result = await query<IO>(sql, values)

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'IO created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating IO:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create IO',
      },
      { status: 500 }
    )
  }
}
