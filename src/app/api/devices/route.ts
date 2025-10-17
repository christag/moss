/**
 * Devices API Routes
 * Handles listing and creating devices
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { CreateDeviceSchema, DeviceQuerySchema } from '@/lib/schemas/device'
import { cache, generateListCacheKey } from '@/lib/cache'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { Device } from '@/types'

/**
 * GET /api/devices
 * List devices with optional filtering, searching, and pagination
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof Response) return authResult
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

    // Generate cache key
    const cacheKey = generateListCacheKey('devices', validated)

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'Devices retrieved successfully (cached)')
    }

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number> = []
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
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM devices ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count, 10)

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

    const responseData = {
      devices: devicesResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }

    // Cache for 30 seconds
    cache.set(cacheKey, responseData, 30)

    return successResponse(responseData, 'Devices retrieved successfully')
  } catch (error) {
    console.error('Error fetching devices:', error)
    return errorResponse('Failed to fetch devices', undefined, 500)
  }
}

/**
 * POST /api/devices
 * Create a new device
 * Requires: 'write' scope
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'write' scope
  const authResult = await requireApiScope(request, ['write'])
  if (authResult instanceof Response) return authResult

  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreateDeviceSchema.parse(body)

    // Validate foreign key references before insertion
    if (validated.parent_device_id) {
      const parentCheck = await query('SELECT id FROM devices WHERE id = $1', [
        validated.parent_device_id,
      ])
      if (parentCheck.rows.length === 0) {
        return errorResponse('Parent device not found', undefined, 404)
      }

      // Check for circular reference (parent pointing to itself would be caught at PATCH time)
      // For POST, we just ensure parent exists
    }

    if (validated.assigned_to_id) {
      const assignedToCheck = await query('SELECT id FROM people WHERE id = $1', [
        validated.assigned_to_id,
      ])
      if (assignedToCheck.rows.length === 0) {
        return errorResponse('Assigned person not found', undefined, 404)
      }
    }

    if (validated.last_used_by_id) {
      const lastUsedByCheck = await query('SELECT id FROM people WHERE id = $1', [
        validated.last_used_by_id,
      ])
      if (lastUsedByCheck.rows.length === 0) {
        return errorResponse('Last used by person not found', undefined, 404)
      }
    }

    if (validated.location_id) {
      const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [
        validated.location_id,
      ])
      if (locationCheck.rows.length === 0) {
        return errorResponse('Location not found', undefined, 404)
      }
    }

    if (validated.room_id) {
      const roomCheck = await query('SELECT id FROM rooms WHERE id = $1', [validated.room_id])
      if (roomCheck.rows.length === 0) {
        return errorResponse('Room not found', undefined, 404)
      }
    }

    if (validated.company_id) {
      const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [
        validated.company_id,
      ])
      if (companyCheck.rows.length === 0) {
        return errorResponse('Company not found', undefined, 404)
      }
    }

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

    // Invalidate list cache
    cache.invalidatePattern('devices:list:*')

    return successResponse(result.rows[0], 'Device created successfully', 201)
  } catch (error) {
    console.error('Error creating device:', error)

    // Handle database constraint violations
    if (error && typeof error === 'object' && 'code' in error) {
      // Unique constraint violation (duplicate hostname)
      if (
        error.code === '23505' &&
        'constraint' in error &&
        error.constraint === 'devices_hostname_unique'
      ) {
        return errorResponse(
          'A device with this hostname already exists. Hostnames must be unique.',
          undefined,
          400
        )
      }

      // Foreign key constraint violation
      if (error.code === '23503') {
        return errorResponse('Invalid reference ID provided', undefined, 400)
      }
    }

    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      return errorResponse('Invalid reference ID provided', undefined, 400)
    }

    return errorResponse('Failed to create device', undefined, 500)
  }
}
