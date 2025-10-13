/**
 * IP Addresses API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateIPAddressSchema, IPAddressQuerySchema } from '@/lib/schemas/ip-address'
import type { IPAddress } from '@/types'
import { parseRequestBody } from '@/lib/api'

// GET /api/ip-addresses - List IP addresses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = IPAddressQuerySchema.parse(params)
    const { search, ip_version, type, io_id, network_id, limit, offset, sort_by, sort_order } =
      validatedParams

    let sql = 'SELECT * FROM ip_addresses WHERE 1=1'
    const values: (string | number)[] = []
    let paramCount = 1

    // Search across ip_address and dns_name
    if (search) {
      sql += ` AND (ip_address ILIKE $${paramCount} OR dns_name ILIKE $${paramCount})`
      values.push(`%${search}%`)
      paramCount++
    }

    // Filter by ip_version
    if (ip_version) {
      sql += ` AND ip_version = $${paramCount}`
      values.push(ip_version)
      paramCount++
    }

    // Filter by type
    if (type) {
      sql += ` AND type = $${paramCount}`
      values.push(type)
      paramCount++
    }

    // Filter by io_id
    if (io_id) {
      sql += ` AND io_id = $${paramCount}`
      values.push(io_id)
      paramCount++
    }

    // Filter by network_id
    if (network_id) {
      sql += ` AND network_id = $${paramCount}`
      values.push(network_id)
      paramCount++
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order}`

    // Pagination
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limit, offset)

    const result = await query<IPAddress>(sql, values)

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: {
        limit,
        offset,
        total: result.rows.length,
      },
    })
  } catch (error) {
    console.error('Error fetching IP addresses:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch IP addresses',
      },
      { status: 400 }
    )
  }
}

// POST /api/ip-addresses - Create new IP address
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = CreateIPAddressSchema.parse(body)

    const { io_id, network_id, ip_address, ip_version, type, dns_name, assignment_date, notes } =
      validatedData

    const sql = `
      INSERT INTO ip_addresses (
        io_id, network_id, ip_address, ip_version, type, dns_name, assignment_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const values = [
      io_id || null,
      network_id || null,
      ip_address,
      ip_version || null,
      type || null,
      dns_name || null,
      assignment_date || null,
      notes || null,
    ]

    const result = await query<IPAddress>(sql, values)

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'IP address created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating IP address:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create IP address',
      },
      { status: 400 }
    )
  }
}
