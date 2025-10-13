/**
 * API Route: /api/people/[id]
 * Handles GET, PATCH, and DELETE operations for a single person
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdatePersonSchema } from '@/lib/schemas/person'
import type { Person } from '@/types'
import { z } from 'zod'
import { parseRequestBody } from '@/lib/api'
import { cache, generateDetailCacheKey } from '@/lib/cache'

const UUIDSchema = z.string().uuid('Invalid person ID format')

/**
 * GET /api/people/[id]
 * Get a single person by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = UUIDSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid person ID format' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = generateDetailCacheKey('people', validation.data)
    const cached = cache.get<Person>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        message: 'Person retrieved successfully (cached)',
        data: cached,
      })
    }

    const result = await query<Person>('SELECT * FROM people WHERE id = $1', [validation.data])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Person not found' }, { status: 404 })
    }

    const person = result.rows[0]

    // Cache for 60 seconds
    cache.set(cacheKey, person, 60)

    return NextResponse.json({
      success: true,
      message: 'Person retrieved successfully',
      data: person,
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch person', error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/people/[id]
 * Update a person by ID
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const idValidation = UUIDSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid person ID format' },
        { status: 400 }
      )
    }

    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validation = UpdatePersonSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if person exists
    const existingPerson = await query<Person>('SELECT * FROM people WHERE id = $1', [
      idValidation.data,
    ])
    if (existingPerson.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Person not found' }, { status: 404 })
    }

    // Verify foreign key references if being updated
    if (validation.data.company_id !== undefined && validation.data.company_id !== null) {
      const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [
        validation.data.company_id,
      ])
      if (companyCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 })
      }
    }

    if (validation.data.location_id !== undefined && validation.data.location_id !== null) {
      const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [
        validation.data.location_id,
      ])
      if (locationCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 })
      }
    }

    if (validation.data.manager_id !== undefined && validation.data.manager_id !== null) {
      // Prevent self-referential manager assignment
      if (validation.data.manager_id === idValidation.data) {
        return NextResponse.json(
          { success: false, message: 'A person cannot be their own manager' },
          { status: 400 }
        )
      }

      const managerCheck = await query('SELECT id FROM people WHERE id = $1', [
        validation.data.manager_id,
      ])
      if (managerCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Manager not found' }, { status: 404 })
      }
    }

    // Check for duplicate email if being updated
    if (
      validation.data.email !== undefined &&
      validation.data.email !== null &&
      validation.data.email !== ''
    ) {
      const emailCheck = await query<Person>(
        'SELECT id FROM people WHERE email = $1 AND id != $2',
        [validation.data.email, idValidation.data]
      )
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate employee_id if being updated
    if (validation.data.employee_id !== undefined && validation.data.employee_id !== null) {
      const employeeIdCheck = await query<Person>(
        'SELECT id FROM people WHERE employee_id = $1 AND id != $2',
        [validation.data.employee_id, idValidation.data]
      )
      if (employeeIdCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Employee ID already exists' },
          { status: 409 }
        )
      }
    }

    // Convert first_name + last_name to full_name if needed
    const updatedData = { ...validation.data }
    if (validation.data.first_name || validation.data.last_name) {
      const firstName = validation.data.first_name?.trim() || ''
      const lastName = validation.data.last_name?.trim() || ''
      if (firstName && lastName) {
        updatedData.full_name = `${firstName} ${lastName}`.trim()
      }
    }

    // Build dynamic UPDATE query
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    const fieldMapping: Record<string, string> = {
      full_name: 'full_name',
      email: 'email',
      username: 'username',
      phone: 'phone',
      mobile: 'mobile',
      person_type: 'person_type',
      company_id: 'company_id',
      employee_id: 'employee_id',
      job_title: 'job_title',
      department: 'department',
      location_id: 'location_id',
      manager_id: 'manager_id',
      start_date: 'start_date',
      status: 'status',
      preferred_contact_method: 'preferred_contact_method',
      notes: 'notes',
    }

    Object.entries(updatedData).forEach(([key, value]) => {
      if (fieldMapping[key] && key !== 'first_name' && key !== 'last_name') {
        updates.push(`${fieldMapping[key]} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add ID as last parameter
    values.push(idValidation.data)

    const result = await query<Person>(
      `UPDATE people SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    // Invalidate caches
    cache.invalidatePattern('people:list:*')
    cache.delete(generateDetailCacheKey('people', id))

    return NextResponse.json({
      success: true,
      message: 'Person updated successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update person', error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/people/[id]
 * Delete a person by ID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = UUIDSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid person ID format' },
        { status: 400 }
      )
    }

    // Check if person exists
    const existingPerson = await query<Person>('SELECT * FROM people WHERE id = $1', [
      validation.data,
    ])
    if (existingPerson.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Person not found' }, { status: 404 })
    }

    // Check for dependencies before deletion
    const dependencies: { table: string; count: number }[] = []

    // Check devices assigned to this person
    const devicesResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM devices WHERE assigned_to_id = $1 OR last_used_by_id = $1`,
      [validation.data]
    )
    const deviceCount = parseInt(devicesResult.rows[0].count, 10)
    if (deviceCount > 0) {
      dependencies.push({ table: 'devices', count: deviceCount })
    }

    // Check if person is a manager for others
    const managedPeopleResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM people WHERE manager_id = $1`,
      [validation.data]
    )
    const managedCount = parseInt(managedPeopleResult.rows[0].count, 10)
    if (managedCount > 0) {
      dependencies.push({ table: 'managed people', count: managedCount })
    }

    if (dependencies.length > 0) {
      const dependencyMessages = dependencies.map((dep) => `${dep.count} ${dep.table}`).join(', ')
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete person: dependencies exist (${dependencyMessages}). Please reassign or remove these first.`,
        },
        { status: 409 }
      )
    }

    // Delete the person
    await query('DELETE FROM people WHERE id = $1', [validation.data])

    // Invalidate caches
    cache.invalidatePattern('people:list:*')
    cache.delete(generateDetailCacheKey('people', validation.data))

    return NextResponse.json({
      success: true,
      message: 'Person deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete person', error: String(error) },
      { status: 500 }
    )
  }
}
