/**
 * Networks API Routes
 * Handles listing and creating networks
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateNetworkSchema, NetworkQuerySchema } from '@/lib/schemas/network'
import type { Network } from '@/types'

/**
 * GET /api/networks
 * List networks with optional filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = NetworkQuerySchema.parse(params)
    const { search, network_type, location_id, dhcp_enabled, limit, offset, sort_by, sort_order } =
      validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: (string | number | boolean | null | undefined)[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      conditions.push(
        `(network_name ILIKE $${paramCount} OR network_address ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      )
      values.push(`%${search}%`)
    }

    if (network_type) {
      paramCount++
      conditions.push(`network_type = $${paramCount}`)
      values.push(network_type)
    }

    if (location_id) {
      paramCount++
      conditions.push(`location_id = $${paramCount}`)
      values.push(location_id)
    }

    if (dhcp_enabled !== undefined) {
      paramCount++
      conditions.push(`dhcp_enabled = $${paramCount}`)
      values.push(dhcp_enabled)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Add pagination
    paramCount++
    const limitClause = `LIMIT $${paramCount}`
    values.push(limit)

    paramCount++
    const offsetClause = `OFFSET $${paramCount}`
    values.push(offset)

    // Execute query
    const sql = `
      SELECT * FROM networks
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<Network>(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM networks ${whereClause}`
    const countResult = await query<{ total: string }>(countSql, values.slice(0, paramCount - 2))
    const total = parseInt(countResult.rows[0]?.total || '0')

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + result.rows.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching networks:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch networks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/networks
 * Create a new network
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validated = CreateNetworkSchema.parse(body)

    // Build INSERT query
    const fields: string[] = []
    const placeholders: string[] = []
    const values: (string | number | boolean | null | undefined)[] = []
    let paramCount = 0

    // Required field
    paramCount++
    fields.push('network_name')
    placeholders.push(`$${paramCount}`)
    values.push(validated.network_name)

    // DHCP enabled (has default, but include if provided)
    paramCount++
    fields.push('dhcp_enabled')
    placeholders.push(`$${paramCount}`)
    values.push(validated.dhcp_enabled)

    // Optional fields
    if (validated.location_id !== undefined) {
      paramCount++
      fields.push('location_id')
      placeholders.push(`$${paramCount}`)
      values.push(validated.location_id)
    }

    if (validated.network_address !== undefined) {
      paramCount++
      fields.push('network_address')
      placeholders.push(`$${paramCount}`)
      values.push(validated.network_address)
    }

    if (validated.vlan_id !== undefined) {
      paramCount++
      fields.push('vlan_id')
      placeholders.push(`$${paramCount}`)
      values.push(validated.vlan_id)
    }

    if (validated.network_type !== undefined) {
      paramCount++
      fields.push('network_type')
      placeholders.push(`$${paramCount}`)
      values.push(validated.network_type)
    }

    if (validated.gateway !== undefined) {
      paramCount++
      fields.push('gateway')
      placeholders.push(`$${paramCount}`)
      values.push(validated.gateway)
    }

    if (validated.dns_servers !== undefined) {
      paramCount++
      fields.push('dns_servers')
      placeholders.push(`$${paramCount}`)
      values.push(validated.dns_servers)
    }

    if (validated.dhcp_range_start !== undefined) {
      paramCount++
      fields.push('dhcp_range_start')
      placeholders.push(`$${paramCount}`)
      values.push(validated.dhcp_range_start)
    }

    if (validated.dhcp_range_end !== undefined) {
      paramCount++
      fields.push('dhcp_range_end')
      placeholders.push(`$${paramCount}`)
      values.push(validated.dhcp_range_end)
    }

    if (validated.description !== undefined) {
      paramCount++
      fields.push('description')
      placeholders.push(`$${paramCount}`)
      values.push(validated.description)
    }

    if (validated.notes !== undefined) {
      paramCount++
      fields.push('notes')
      placeholders.push(`$${paramCount}`)
      values.push(validated.notes)
    }

    // Execute INSERT
    const sql = `
      INSERT INTO networks (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const result = await query<Network>(sql, values)

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating network:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create network' },
      { status: 500 }
    )
  }
}
