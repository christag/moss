/**
 * Location API Routes (by ID)
 * GET /api/locations/[id] - Get a single location
 * PATCH /api/locations/[id] - Update a location
 * DELETE /api/locations/[id] - Delete a location
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { safeValidate } from '@/lib/validation'
import { UpdateLocationSchema, UUIDSchema } from '@/lib/schemas/location'
import type { Location } from '@/types'

/**
 * GET /api/locations/[id]
 * Get a single location by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = safeValidate(UUIDSchema, id)
    if (!validation.success) {
      return errorResponse('Invalid location ID', validation.errors.errors, 400)
    }

    // Fetch location from database
    const result = await query<Location>('SELECT * FROM locations WHERE id = $1', [validation.data])

    if (result.rows.length === 0) {
      return errorResponse('Location not found', undefined, 404)
    }

    return successResponse(result.rows[0], 'Location retrieved successfully')
  } catch (error) {
    console.error('Error fetching location:', error)
    return errorResponse('Failed to fetch location', error, 500)
  }
}

/**
 * PATCH /api/locations/[id]
 * Update a location
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const idValidation = safeValidate(UUIDSchema, id)
    if (!idValidation.success) {
      return errorResponse('Invalid location ID', idValidation.errors.errors, 400)
    }

    // Parse and validate request body
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validation = safeValidate(UpdateLocationSchema, body)

    if (!validation.success) {
      return errorResponse('Validation failed', validation.errors.errors, 400)
    }

    const updates = validation.data

    // Check if location exists
    const existingResult = await query<Location>('SELECT * FROM locations WHERE id = $1', [
      idValidation.data,
    ])

    if (existingResult.rows.length === 0) {
      return errorResponse('Location not found', undefined, 404)
    }

    // If company_id is being updated, verify it exists
    if (updates.company_id !== undefined && updates.company_id !== null) {
      const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [
        updates.company_id,
      ])
      if (companyCheck.rows.length === 0) {
        return errorResponse('Company not found', undefined, 404)
      }
    }

    // Build UPDATE query dynamically
    const updateFields: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (updates.location_name !== undefined) {
      updateFields.push(`location_name = $${paramCount}`)
      values.push(updates.location_name)
      paramCount++
    }

    if (updates.company_id !== undefined) {
      updateFields.push(`company_id = $${paramCount}`)
      values.push(updates.company_id || null)
      paramCount++
    }

    if (updates.address !== undefined) {
      updateFields.push(`address = $${paramCount}`)
      values.push(updates.address || null)
      paramCount++
    }

    if (updates.city !== undefined) {
      updateFields.push(`city = $${paramCount}`)
      values.push(updates.city || null)
      paramCount++
    }

    if (updates.state !== undefined) {
      updateFields.push(`state = $${paramCount}`)
      values.push(updates.state || null)
      paramCount++
    }

    if (updates.zip !== undefined) {
      updateFields.push(`zip = $${paramCount}`)
      values.push(updates.zip || null)
      paramCount++
    }

    if (updates.country !== undefined) {
      updateFields.push(`country = $${paramCount}`)
      values.push(updates.country || null)
      paramCount++
    }

    if (updates.location_type !== undefined) {
      updateFields.push(`location_type = $${paramCount}`)
      values.push(updates.location_type || null)
      paramCount++
    }

    if (updates.timezone !== undefined) {
      updateFields.push(`timezone = $${paramCount}`)
      values.push(updates.timezone || null)
      paramCount++
    }

    if (updates.contact_phone !== undefined) {
      updateFields.push(`contact_phone = $${paramCount}`)
      values.push(updates.contact_phone || null)
      paramCount++
    }

    if (updates.access_instructions !== undefined) {
      updateFields.push(`access_instructions = $${paramCount}`)
      values.push(updates.access_instructions || null)
      paramCount++
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`)
      values.push(updates.notes || null)
      paramCount++
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', undefined, 400)
    }

    // Add ID as the last parameter
    values.push(idValidation.data)

    // Execute update
    const result = await query<Location>(
      `UPDATE locations
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    )

    return successResponse(result.rows[0], 'Location updated successfully')
  } catch (error) {
    console.error('Error updating location:', error)
    return errorResponse('Failed to update location', error, 500)
  }
}

/**
 * DELETE /api/locations/[id]
 * Delete a location
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = safeValidate(UUIDSchema, id)
    if (!validation.success) {
      return errorResponse('Invalid location ID', validation.errors.errors, 400)
    }

    // Check if location exists
    const existingResult = await query<Location>('SELECT * FROM locations WHERE id = $1', [
      validation.data,
    ])

    if (existingResult.rows.length === 0) {
      return errorResponse('Location not found', undefined, 404)
    }

    // Check for dependencies (rooms, devices, networks, people)
    const dependenciesResult = await query<{ count: string }>(
      `SELECT
        (SELECT COUNT(*) FROM rooms WHERE location_id = $1) +
        (SELECT COUNT(*) FROM devices WHERE location_id = $1) +
        (SELECT COUNT(*) FROM networks WHERE location_id = $1) +
        (SELECT COUNT(*) FROM people WHERE location_id = $1) as count`,
      [validation.data]
    )

    const dependencyCount = parseInt(dependenciesResult.rows[0].count, 10)

    if (dependencyCount > 0) {
      return errorResponse(
        'Cannot delete location with existing dependencies',
        {
          message: `This location has ${dependencyCount} associated records (rooms, devices, networks, or people). Please remove or reassign these records first.`,
        },
        409
      )
    }

    // Delete location
    await query('DELETE FROM locations WHERE id = $1', [validation.data])

    return successResponse({ id, deleted: true }, 'Location deleted successfully')
  } catch (error) {
    console.error('Error deleting location:', error)
    return errorResponse('Failed to delete location', error, 500)
  }
}
