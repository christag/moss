/**
 * Devices Bulk API Route
 * Handles bulk creation of devices (up to 100 per request)
 * Used for CSV imports and batch operations
 */

import { NextRequest } from 'next/server'
import { getClient } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { CreateManyDevicesSchema, DEVICE_COLUMNS } from '@/lib/schemas/device'
import { bulkInsert } from '@/lib/bulk/bulkInsert'
import { cache } from '@/lib/cache'
import type { Device } from '@/types'

/**
 * POST /api/devices/bulk
 * Create multiple devices in a single transaction
 *
 * Request body: Array of device objects (1-100 items)
 * Response: { success: true, data: { created: number, items: Device[] } }
 */
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    // 1. Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data

    // 2. Validate array of devices
    const validated = CreateManyDevicesSchema.parse(body)

    // 3. Start transaction
    await client.query('BEGIN')

    // 4. Bulk insert devices using utility function
    const devices = await bulkInsert<Device>(
      'devices',
      DEVICE_COLUMNS as unknown as string[],
      validated.map((device) => ({
        parent_device_id: device.parent_device_id || null,
        assigned_to_id: device.assigned_to_id || null,
        last_used_by_id: device.last_used_by_id || null,
        location_id: device.location_id || null,
        room_id: device.room_id || null,
        company_id: device.company_id || null,
        hostname: device.hostname || null,
        device_type: device.device_type,
        serial_number: device.serial_number || null,
        model: device.model || null,
        manufacturer: device.manufacturer || null,
        purchase_date: device.purchase_date || null,
        warranty_expiration: device.warranty_expiration || null,
        install_date: device.install_date || null,
        status: device.status || 'active',
        asset_tag: device.asset_tag || null,
        operating_system: device.operating_system || null,
        os_version: device.os_version || null,
        last_audit_date: device.last_audit_date || null,
        notes: device.notes || null,
      })),
      client
    )

    // 5. Commit transaction
    await client.query('COMMIT')

    // 6. Invalidate list cache
    cache.invalidatePattern('devices:list:*')

    // 7. Return success response
    return successResponse(
      {
        created: devices.length,
        items: devices,
      },
      `Successfully created ${devices.length} devices`,
      201
    )
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK')

    console.error('Error bulk creating devices:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed', error, 400)
    }

    // Handle foreign key constraint violations
    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      return errorResponse(
        'Invalid reference ID provided. Check that location_id, room_id, company_id, assigned_to_id, and parent_device_id exist.',
        error.message,
        400
      )
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('violates unique constraint')) {
      return errorResponse(
        'Duplicate value detected. Serial numbers and asset tags must be unique.',
        error.message,
        409
      )
    }

    return errorResponse('Failed to bulk create devices', error, 500)
  } finally {
    // Always release the client back to the pool
    client.release()
  }
}
