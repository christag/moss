/**
 * Company API Routes (by ID)
 * GET /api/companies/[id] - Get a single company
 * PATCH /api/companies/[id] - Update a company
 * DELETE /api/companies/[id] - Delete a company
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { safeValidate } from '@/lib/validation'
import { UpdateCompanySchema, UUIDSchema } from '@/lib/schemas/company'
import { cache, generateDetailCacheKey } from '@/lib/cache'
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

    // Check cache first
    const cacheKey = generateDetailCacheKey('companies', validation.data)
    const cached = cache.get<Company>(cacheKey)
    if (cached) {
      return successResponse(cached, 'Company retrieved successfully (cached)')
    }

    // Fetch company from database
    const result = await query<Company>('SELECT * FROM companies WHERE id = $1', [validation.data])

    if (result.rows.length === 0) {
      return errorResponse('Company not found', undefined, 404)
    }

    const company = result.rows[0]

    // Cache the result for 60 seconds (detail data doesn't change as frequently)
    cache.set(cacheKey, company, 60)

    return successResponse(company, 'Company retrieved successfully')
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
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
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

    // Invalidate both list and detail caches
    cache.invalidatePattern('companies:list:*')
    cache.delete(generateDetailCacheKey('companies', idValidation.data))

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
    const dependenciesResult = await query<{
      locations_count: string
      people_count: string
      software_count: string
      contracts_count: string
    }>(
      `SELECT
        (SELECT COUNT(*) FROM locations WHERE company_id = $1) as locations_count,
        (SELECT COUNT(*) FROM people WHERE company_id = $1) as people_count,
        (SELECT COUNT(*) FROM software WHERE company_id = $1) as software_count,
        (SELECT COUNT(*) FROM contracts WHERE company_id = $1) as contracts_count`,
      [validation.data]
    )

    const locationCount = parseInt(dependenciesResult.rows[0].locations_count, 10)
    const peopleCount = parseInt(dependenciesResult.rows[0].people_count, 10)
    const softwareCount = parseInt(dependenciesResult.rows[0].software_count, 10)
    const contractCount = parseInt(dependenciesResult.rows[0].contracts_count, 10)
    const totalDependencies = locationCount + peopleCount + softwareCount + contractCount

    if (totalDependencies > 0) {
      const dependencies: string[] = []
      if (locationCount > 0) dependencies.push(`${locationCount} location(s)`)
      if (peopleCount > 0) dependencies.push(`${peopleCount} people`)
      if (softwareCount > 0) dependencies.push(`${softwareCount} software product(s)`)
      if (contractCount > 0) dependencies.push(`${contractCount} contract(s)`)

      return errorResponse(
        'Cannot delete company with existing dependencies',
        {
          message: `This company has ${dependencies.join(', ')} linked to it. Please remove or reassign these records first.`,
          dependencies: {
            locations: locationCount,
            people: peopleCount,
            software: softwareCount,
            contracts: contractCount,
          },
        },
        409
      )
    }

    // Delete company
    await query('DELETE FROM companies WHERE id = $1', [validation.data])

    // Invalidate both list and detail caches
    cache.invalidatePattern('companies:list:*')
    cache.delete(generateDetailCacheKey('companies', validation.data))

    return successResponse({ id, deleted: true }, 'Company deleted successfully')
  } catch (error) {
    console.error('Error deleting company:', error)
    return errorResponse('Failed to delete company', error, 500)
  }
}
