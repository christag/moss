/**
 * Device API Routes - Individual Device Operations
 * Handles getting, updating, and deleting a specific device
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { UpdateDeviceSchema } from '@/lib/schemas/device'
import type { Device } from '@/types'

/**
 * GET /api/devices/:id
 * Get a single device by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await query<Device>('SELECT * FROM devices WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return errorResponse('Device not found', undefined, 404)
    }

    return successResponse(result.rows[0])
  } catch (error) {
    console.error('Error fetching device:', error)
    return errorResponse('Failed to fetch device', undefined, 500)
  }
}

/**
 * PATCH /api/devices/:id
 * Update a device
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validated = UpdateDeviceSchema.parse(body)

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Add each field if provided
    if (validated.parent_device_id !== undefined) {
      paramCount++
      updates.push(`parent_device_id = $${paramCount}`)
      values.push(validated.parent_device_id)
    }
    if (validated.assigned_to_id !== undefined) {
      paramCount++
      updates.push(`assigned_to_id = $${paramCount}`)
      values.push(validated.assigned_to_id)
    }
    if (validated.last_used_by_id !== undefined) {
      paramCount++
      updates.push(`last_used_by_id = $${paramCount}`)
      values.push(validated.last_used_by_id)
    }
    if (validated.location_id !== undefined) {
      paramCount++
      updates.push(`location_id = $${paramCount}`)
      values.push(validated.location_id)
    }
    if (validated.room_id !== undefined) {
      paramCount++
      updates.push(`room_id = $${paramCount}`)
      values.push(validated.room_id)
    }
    if (validated.company_id !== undefined) {
      paramCount++
      updates.push(`company_id = $${paramCount}`)
      values.push(validated.company_id)
    }
    if (validated.hostname !== undefined) {
      paramCount++
      updates.push(`hostname = $${paramCount}`)
      values.push(validated.hostname)
    }
    if (validated.device_type !== undefined) {
      paramCount++
      updates.push(`device_type = $${paramCount}`)
      values.push(validated.device_type)
    }
    if (validated.serial_number !== undefined) {
      paramCount++
      updates.push(`serial_number = $${paramCount}`)
      values.push(validated.serial_number)
    }
    if (validated.model !== undefined) {
      paramCount++
      updates.push(`model = $${paramCount}`)
      values.push(validated.model)
    }
    if (validated.manufacturer !== undefined) {
      paramCount++
      updates.push(`manufacturer = $${paramCount}`)
      values.push(validated.manufacturer)
    }
    if (validated.purchase_date !== undefined) {
      paramCount++
      updates.push(`purchase_date = $${paramCount}`)
      values.push(validated.purchase_date)
    }
    if (validated.warranty_expiration !== undefined) {
      paramCount++
      updates.push(`warranty_expiration = $${paramCount}`)
      values.push(validated.warranty_expiration)
    }
    if (validated.install_date !== undefined) {
      paramCount++
      updates.push(`install_date = $${paramCount}`)
      values.push(validated.install_date)
    }
    if (validated.status !== undefined) {
      paramCount++
      updates.push(`status = $${paramCount}`)
      values.push(validated.status)
    }
    if (validated.asset_tag !== undefined) {
      paramCount++
      updates.push(`asset_tag = $${paramCount}`)
      values.push(validated.asset_tag)
    }
    if (validated.operating_system !== undefined) {
      paramCount++
      updates.push(`operating_system = $${paramCount}`)
      values.push(validated.operating_system)
    }
    if (validated.os_version !== undefined) {
      paramCount++
      updates.push(`os_version = $${paramCount}`)
      values.push(validated.os_version)
    }
    if (validated.last_audit_date !== undefined) {
      paramCount++
      updates.push(`last_audit_date = $${paramCount}`)
      values.push(validated.last_audit_date)
    }
    if (validated.notes !== undefined) {
      paramCount++
      updates.push(`notes = $${paramCount}`)
      values.push(validated.notes)
    }

    // Always update updated_at (no parameter needed)
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 1) {
      // Only updated_at was added, no actual fields to update
      return errorResponse('No fields to update', undefined, 400)
    }

    // Add device ID as last parameter
    paramCount++
    values.push(id)

    const result = await query<Device>(
      `
      UPDATE devices
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    )

    if (result.rows.length === 0) {
      return errorResponse('Device not found', undefined, 404)
    }

    return successResponse(result.rows[0])
  } catch (error) {
    console.error('Error updating device:', error)
    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      return errorResponse('Invalid reference ID provided', undefined, 400)
    }
    return errorResponse('Failed to update device', undefined, 500)
  }
}

/**
 * DELETE /api/devices/:id
 * Delete a device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if device exists and has child devices
    const childCheck = await query('SELECT COUNT(*) FROM devices WHERE parent_device_id = $1', [id])
    const childCount = parseInt(childCheck.rows[0].count)

    if (childCount > 0) {
      return errorResponse(
        `Cannot delete device: ${childCount} child device(s) must be removed first`,
        undefined,
        400
      )
    }

    // Delete the device
    const result = await query('DELETE FROM devices WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return errorResponse('Device not found', undefined, 404)
    }

    return successResponse({ message: 'Device deleted successfully', id: result.rows[0].id })
  } catch (error) {
    console.error('Error deleting device:', error)
    return errorResponse('Failed to delete device', undefined, 500)
  }
}
