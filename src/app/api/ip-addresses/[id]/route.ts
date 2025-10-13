/**
 * IP Addresses API - Get, Update, Delete single IP address
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateIPAddressSchema } from '@/lib/schemas/ip-address'
import type { IPAddress } from '@/types'
import { parseRequestBody } from '@/lib/api'

// GET /api/ip-addresses/[id] - Get single IP address
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = 'SELECT * FROM ip_addresses WHERE id = $1'
    const result = await query<IPAddress>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'IP address not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching IP address:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch IP address',
      },
      { status: 400 }
    )
  }
}

// PATCH /api/ip-addresses/[id] - Update IP address
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = UpdateIPAddressSchema.parse(body)

    const updates: string[] = []
    const values: (string | number | null)[] = []
    let paramCount = 1

    // Build dynamic update query
    Object.entries(validatedData).forEach(([key, value]) => {
      updates.push(`${key} = $${paramCount}`)
      values.push(value === undefined ? null : value)
      paramCount++
    })

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add id to values
    values.push(id)

    const sql = `
      UPDATE ip_addresses
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<IPAddress>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'IP address not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'IP address updated successfully',
    })
  } catch (error) {
    console.error('Error updating IP address:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update IP address',
      },
      { status: 400 }
    )
  }
}

// DELETE /api/ip-addresses/[id] - Delete IP address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sql = 'DELETE FROM ip_addresses WHERE id = $1 RETURNING id'
    const result = await query<{ id: string }>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'IP address not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'IP address deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting IP address:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete IP address',
      },
      { status: 400 }
    )
  }
}
