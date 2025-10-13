/**
 * Network Detail API Routes
 * Handles get, update, and delete for individual networks
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateNetworkSchema } from '@/lib/schemas/network'
import type { Network } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/networks/:id
 * Get a single network by ID
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const sql = 'SELECT * FROM networks WHERE id = $1'
    const result = await query<Network>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Network not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching network:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch network' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/networks/:id
 * Update a network
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

    // Validate request body
    const validated = UpdateNetworkSchema.parse(body)

    // Build UPDATE query dynamically based on provided fields
    const updates: string[] = []
    const values: (string | number | boolean | null | undefined)[] = []
    let paramCount = 0

    if (validated.location_id !== undefined) {
      paramCount++
      updates.push(`location_id = $${paramCount}`)
      values.push(validated.location_id)
    }

    if (validated.network_name !== undefined) {
      paramCount++
      updates.push(`network_name = $${paramCount}`)
      values.push(validated.network_name)
    }

    if (validated.network_address !== undefined) {
      paramCount++
      updates.push(`network_address = $${paramCount}`)
      values.push(validated.network_address)
    }

    if (validated.vlan_id !== undefined) {
      paramCount++
      updates.push(`vlan_id = $${paramCount}`)
      values.push(validated.vlan_id)
    }

    if (validated.network_type !== undefined) {
      paramCount++
      updates.push(`network_type = $${paramCount}`)
      values.push(validated.network_type)
    }

    if (validated.gateway !== undefined) {
      paramCount++
      updates.push(`gateway = $${paramCount}`)
      values.push(validated.gateway)
    }

    if (validated.dns_servers !== undefined) {
      paramCount++
      updates.push(`dns_servers = $${paramCount}`)
      values.push(validated.dns_servers)
    }

    if (validated.dhcp_enabled !== undefined) {
      paramCount++
      updates.push(`dhcp_enabled = $${paramCount}`)
      values.push(validated.dhcp_enabled)
    }

    if (validated.dhcp_range_start !== undefined) {
      paramCount++
      updates.push(`dhcp_range_start = $${paramCount}`)
      values.push(validated.dhcp_range_start)
    }

    if (validated.dhcp_range_end !== undefined) {
      paramCount++
      updates.push(`dhcp_range_end = $${paramCount}`)
      values.push(validated.dhcp_range_end)
    }

    if (validated.description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      values.push(validated.description)
    }

    if (validated.notes !== undefined) {
      paramCount++
      updates.push(`notes = $${paramCount}`)
      values.push(validated.notes)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // Add ID parameter
    paramCount++
    values.push(id)

    const sql = `
      UPDATE networks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<Network>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Network not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating network:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update network' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/networks/:id
 * Delete a network
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Check for dependent IOs (interfaces using this network)
    const iosCheckSql = 'SELECT COUNT(*) as count FROM ios WHERE native_network_id = $1'
    const iosResult = await query<{ count: string }>(iosCheckSql, [id])
    const iosCount = parseInt(iosResult.rows[0]?.count || '0')

    // Check for tagged network relationships
    const taggedCheckSql = 'SELECT COUNT(*) as count FROM io_tagged_networks WHERE network_id = $1'
    const taggedResult = await query<{ count: string }>(taggedCheckSql, [id])
    const taggedCount = parseInt(taggedResult.rows[0]?.count || '0')

    const totalDependencies = iosCount + taggedCount

    if (totalDependencies > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete network: ${iosCount} interface(s) and ${taggedCount} tagged interface(s) are using this network`,
        },
        { status: 400 }
      )
    }

    // Delete the network
    const sql = 'DELETE FROM networks WHERE id = $1 RETURNING *'
    const result = await query<Network>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Network not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Network deleted successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error deleting network:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete network' },
      { status: 500 }
    )
  }
}
