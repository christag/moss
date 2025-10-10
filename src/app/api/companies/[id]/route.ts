/**
 * Company API Routes (by ID)
 * GET /api/companies/[id] - Get a single company
 * PATCH /api/companies/[id] - Update a company
 * DELETE /api/companies/[id] - Delete a company
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { safeValidate } from '@/lib/validation'
import { UpdateCompanySchema, UUIDSchema } from '@/lib/schemas/company'
import type { Company } from '@/types'

/**
 * GET /api/companies/[id]
 * Get a single company by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const validation = safeValidate(UUIDSchema, id)
    if (!validation.success) {
      return errorResponse('Invalid company ID', validation.errors.errors, 400)
    }

    // Fetch company from database
    const result = await query<Company>('SELECT * FROM companies WHERE id = $1', [validation.data])

    if (result.rows.length === 0) {
      return errorResponse('Company not found', undefined, 404)
    }

    return successResponse(result.rows[0], 'Company retrieved successfully')
  } catch (error) {
    console.error('Error fetching company:', error)
    return errorResponse('Failed to fetch company', error, 500)
  }
}

/**
 * PATCH /api/companies/[id]
 * Update a company
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID
    const idValidation = safeValidate(UUIDSchema, id)
    if (!idValidation.success) {
      return errorResponse('Invalid company ID', idValidation.errors.errors, 400)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = safeValidate(UpdateCompanySchema, body)

    if (!validation.success) {
      return errorResponse('Validation failed', validation.errors.errors, 400)
    }

    const updates = validation.data

    // Check if company exists
    const existingResult = await query<Company>('SELECT * FROM companies WHERE id = $1', [
      idValidation.data,
    ])

    if (existingResult.rows.length === 0) {
      return errorResponse('Company not found', undefined, 404)
    }

    // Build UPDATE query dynamically
    const updateFields: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (updates.company_name !== undefined) {
      updateFields.push(`company_name = $${paramCount}`)
      values.push(updates.company_name)
      paramCount++
    }

    if (updates.company_type !== undefined) {
      updateFields.push(`company_type = $${paramCount}`)
      values.push(updates.company_type)
      paramCount++
    }

    if (updates.website !== undefined) {
      updateFields.push(`website = $${paramCount}`)
      values.push(updates.website || null)
      paramCount++
    }

    if (updates.phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`)
      values.push(updates.phone || null)
      paramCount++
    }

    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramCount}`)
      values.push(updates.email || null)
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

    if (updates.account_number !== undefined) {
      updateFields.push(`account_number = $${paramCount}`)
      values.push(updates.account_number || null)
      paramCount++
    }

    if (updates.support_url !== undefined) {
      updateFields.push(`support_url = $${paramCount}`)
      values.push(updates.support_url || null)
      paramCount++
    }

    if (updates.support_phone !== undefined) {
      updateFields.push(`support_phone = $${paramCount}`)
      values.push(updates.support_phone || null)
      paramCount++
    }

    if (updates.support_email !== undefined) {
      updateFields.push(`support_email = $${paramCount}`)
      values.push(updates.support_email || null)
      paramCount++
    }

    if (updates.tax_id !== undefined) {
      updateFields.push(`tax_id = $${paramCount}`)
      values.push(updates.tax_id || null)
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
    const result = await query<Company>(
      `UPDATE companies
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    )

    return successResponse(result.rows[0], 'Company updated successfully')
  } catch (error) {
    console.error('Error updating company:', error)
    return errorResponse('Failed to update company', error, 500)
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a company
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
      return errorResponse('Invalid company ID', validation.errors.errors, 400)
    }

    // Check if company exists
    const existingResult = await query<Company>('SELECT * FROM companies WHERE id = $1', [
      validation.data,
    ])

    if (existingResult.rows.length === 0) {
      return errorResponse('Company not found', undefined, 404)
    }

    // Check for dependencies (locations, people, etc.)
    const dependenciesResult = await query<{ count: string }>(
      `SELECT
        (SELECT COUNT(*) FROM locations WHERE company_id = $1) +
        (SELECT COUNT(*) FROM people WHERE company_id = $1) +
        (SELECT COUNT(*) FROM software WHERE publisher_id = $1) +
        (SELECT COUNT(*) FROM contracts WHERE vendor_id = $1) as count`,
      [validation.data]
    )

    const dependencyCount = parseInt(dependenciesResult.rows[0].count, 10)

    if (dependencyCount > 0) {
      return errorResponse(
        'Cannot delete company with existing dependencies',
        {
          message: `This company has ${dependencyCount} associated records (locations, people, software, or contracts). Please remove or reassign these records first.`,
        },
        409
      )
    }

    // Delete company
    await query('DELETE FROM companies WHERE id = $1', [validation.data])

    return successResponse({ id, deleted: true }, 'Company deleted successfully')
  } catch (error) {
    console.error('Error deleting company:', error)
    return errorResponse('Failed to delete company', error, 500)
  }
}
