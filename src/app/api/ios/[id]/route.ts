/**
 * IO Detail API Routes
 * Handles retrieving, updating, and deleting individual IOs
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateIOSchema } from '@/lib/schemas/io'
import type { IO } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/ios/[id]
 * Retrieve a single IO by ID
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const sql = 'SELECT * FROM ios WHERE id = $1'
    const result = await query<IO>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'IO not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'IO retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching IO:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch IO',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ios/[id]
 * Update an IO by ID
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = UpdateIOSchema.parse(body)

    // Build dynamic UPDATE query
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    // Add each field to update if provided
    if (validatedData.device_id !== undefined) {
      updates.push(`device_id = $${paramIndex}`)
      values.push(validatedData.device_id)
      paramIndex++
    }

    if (validatedData.room_id !== undefined) {
      updates.push(`room_id = $${paramIndex}`)
      values.push(validatedData.room_id)
      paramIndex++
    }

    if (validatedData.native_network_id !== undefined) {
      updates.push(`native_network_id = $${paramIndex}`)
      values.push(validatedData.native_network_id)
      paramIndex++
    }

    if (validatedData.connected_to_io_id !== undefined) {
      updates.push(`connected_to_io_id = $${paramIndex}`)
      values.push(validatedData.connected_to_io_id)
      paramIndex++
    }

    if (validatedData.interface_name !== undefined) {
      updates.push(`interface_name = $${paramIndex}`)
      values.push(validatedData.interface_name)
      paramIndex++
    }

    if (validatedData.interface_type !== undefined) {
      updates.push(`interface_type = $${paramIndex}`)
      values.push(validatedData.interface_type)
      paramIndex++
    }

    if (validatedData.media_type !== undefined) {
      updates.push(`media_type = $${paramIndex}`)
      values.push(validatedData.media_type)
      paramIndex++
    }

    if (validatedData.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(validatedData.status)
      paramIndex++
    }

    if (validatedData.speed !== undefined) {
      updates.push(`speed = $${paramIndex}`)
      values.push(validatedData.speed)
      paramIndex++
    }

    if (validatedData.duplex !== undefined) {
      updates.push(`duplex = $${paramIndex}`)
      values.push(validatedData.duplex)
      paramIndex++
    }

    if (validatedData.trunk_mode !== undefined) {
      updates.push(`trunk_mode = $${paramIndex}`)
      values.push(validatedData.trunk_mode)
      paramIndex++
    }

    if (validatedData.port_number !== undefined) {
      updates.push(`port_number = $${paramIndex}`)
      values.push(validatedData.port_number)
      paramIndex++
    }

    if (validatedData.mac_address !== undefined) {
      updates.push(`mac_address = $${paramIndex}`)
      values.push(validatedData.mac_address)
      paramIndex++
    }

    if (validatedData.voltage !== undefined) {
      updates.push(`voltage = $${paramIndex}`)
      values.push(validatedData.voltage)
      paramIndex++
    }

    if (validatedData.amperage !== undefined) {
      updates.push(`amperage = $${paramIndex}`)
      values.push(validatedData.amperage)
      paramIndex++
    }

    if (validatedData.wattage !== undefined) {
      updates.push(`wattage = $${paramIndex}`)
      values.push(validatedData.wattage)
      paramIndex++
    }

    if (validatedData.power_connector_type !== undefined) {
      updates.push(`power_connector_type = $${paramIndex}`)
      values.push(validatedData.power_connector_type)
      paramIndex++
    }

    if (validatedData.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(validatedData.description)
      paramIndex++
    }

    if (validatedData.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(validatedData.notes)
      paramIndex++
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      return NextResponse.json(
        {
          success: false,
          message: 'No fields to update',
        },
        { status: 400 }
      )
    }

    const sql = `
      UPDATE ios
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(id)

    const result = await query<IO>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'IO not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'IO updated successfully',
    })
  } catch (error) {
    console.error('Error updating IO:', error)
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
        message: 'Failed to update IO',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ios/[id]
 * Delete an IO by ID
 * Checks for dependent io_tagged_networks and connected IOs before deleting
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Check for IO tagged networks
    const taggedCheckSql = 'SELECT COUNT(*) as count FROM io_tagged_networks WHERE io_id = $1'
    const taggedResult = await query<{ count: string }>(taggedCheckSql, [id])
    const taggedCount = parseInt(taggedResult.rows[0]?.count || '0')

    // Check for connected IOs (other IOs connected to this one)
    const connectedCheckSql = 'SELECT COUNT(*) as count FROM ios WHERE connected_to_io_id = $1'
    const connectedResult = await query<{ count: string }>(connectedCheckSql, [id])
    const connectedCount = parseInt(connectedResult.rows[0]?.count || '0')

    // Check for IP addresses
    const ipCheckSql = 'SELECT COUNT(*) as count FROM ip_addresses WHERE io_id = $1'
    const ipResult = await query<{ count: string }>(ipCheckSql, [id])
    const ipCount = parseInt(ipResult.rows[0]?.count || '0')

    const totalDependencies = taggedCount + connectedCount + ipCount

    if (totalDependencies > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete IO: ${taggedCount} tagged network(s), ${connectedCount} connected IO(s), and ${ipCount} IP address(es) are using this IO`,
        },
        { status: 400 }
      )
    }

    const sql = 'DELETE FROM ios WHERE id = $1 RETURNING *'
    const result = await query<IO>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'IO not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'IO deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting IO:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete IO',
      },
      { status: 500 }
    )
  }
}
