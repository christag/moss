/**
 * Devices API Routes
 * Handles listing and creating devices
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { CreateDeviceSchema, DeviceQuerySchema } from '@/lib/schemas/device'
import type { Device } from '@/types'

/**
 * GET /api/devices
 * List devices with optional filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = DeviceQuerySchema.parse(params)
    const {
      search,
      device_type,
      status,
      location_id,
      room_id,
      company_id,
      assigned_to_id,
      manufacturer,
      page,
      limit,
      sort_by,
      sort_order,
    } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: (string | number | null | undefined)[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      conditions.push(
        `(hostname ILIKE $${paramCount} OR serial_number ILIKE $${paramCount} OR model ILIKE $${paramCount} OR asset_tag ILIKE $${paramCount})`
      )
      values.push(`%${search}%`)
    }

    if (device_type) {
      paramCount++
      conditions.push(`device_type = $${paramCount}`)
      values.push(device_type)
    }

    if (status) {
      paramCount++
      conditions.push(`status = $${paramCount}`)
      values.push(status)
    }

    if (location_id) {
      paramCount++
      conditions.push(`location_id = $${paramCount}`)
      values.push(location_id)
    }

    if (room_id) {
      paramCount++
      conditions.push(`room_id = $${paramCount}`)
      values.push(room_id)
    }

    if (company_id) {
      paramCount++
      conditions.push(`company_id = $${paramCount}`)
      values.push(company_id)
    }

    if (assigned_to_id) {
      paramCount++
      conditions.push(`assigned_to_id = $${paramCount}`)
      values.push(assigned_to_id)
    }

    if (manufacturer) {
      paramCount++
      conditions.push(`manufacturer ILIKE $${paramCount}`)
      values.push(`%${manufacturer}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM devices ${whereClause}`, values)
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const offset = (page - 1) * limit
    values.push(limit, offset)

    const devicesResult = await query<Device>(
      `
      SELECT * FROM devices
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `,
      values
    )

    return successResponse({
      devices: devicesResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return errorResponse('Failed to fetch devices', undefined, 500)
  }
}

/**
 * POST /api/devices
 * Create a new device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validated = CreateDeviceSchema.parse(body)

    // Insert device
    const result = await query<Device>(
      `
      INSERT INTO devices (
        parent_device_id,
        assigned_to_id,
        last_used_by_id,
        location_id,
        room_id,
        company_id,
        hostname,
        device_type,
        serial_number,
        model,
        manufacturer,
        purchase_date,
        warranty_expiration,
        install_date,
        status,
        asset_tag,
        operating_system,
        os_version,
        last_audit_date,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `,
      [
        validated.parent_device_id || null,
        validated.assigned_to_id || null,
        validated.last_used_by_id || null,
        validated.location_id || null,
        validated.room_id || null,
        validated.company_id || null,
        validated.hostname || null,
        validated.device_type,
        validated.serial_number || null,
        validated.model || null,
        validated.manufacturer || null,
        validated.purchase_date || null,
        validated.warranty_expiration || null,
        validated.install_date || null,
        validated.status || 'active',
        validated.asset_tag || null,
        validated.operating_system || null,
        validated.os_version || null,
        validated.last_audit_date || null,
        validated.notes || null,
      ]
    )

    return successResponse(result.rows[0], undefined, 201)
  } catch (error) {
    console.error('Error creating device:', error)
    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      return errorResponse('Invalid reference ID provided', undefined, 400)
    }
    return errorResponse('Failed to create device', undefined, 500)
  }
}
