/**
 * Locations API Routes
 * GET /api/locations - List all locations with filters
 * POST /api/locations - Create a new location
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { safeValidate } from '@/lib/validation'
import { CreateLocationSchema, LocationQuerySchema } from '@/lib/schemas/location'
import type { Location } from '@/types'

/**
 * GET /api/locations
 * List all locations with optional filtering, searching, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validation = safeValidate(LocationQuerySchema, params)
    if (!validation.success) {
      return errorResponse('Invalid query parameters', validation.errors.errors, 400)
    }

    const {
      page,
      limit,
      sort_by,
      sort_order,
      search,
      company_id,
      location_type,
      city,
      state,
      country,
    } = validation.data

    // Build SQL query with filters
    const conditions: string[] = ['1=1']
    const values: unknown[] = []
    let paramCount = 1

    if (search) {
      conditions.push(
        `(location_name ILIKE $${paramCount} OR city ILIKE $${paramCount} OR country ILIKE $${paramCount})`
      )
      values.push(`%${search}%`)
      paramCount++
    }

    if (company_id) {
      conditions.push(`company_id = $${paramCount}`)
      values.push(company_id)
      paramCount++
    }

    if (location_type) {
      conditions.push(`location_type = $${paramCount}`)
      values.push(location_type)
      paramCount++
    }

    if (city) {
      conditions.push(`city ILIKE $${paramCount}`)
      values.push(`%${city}%`)
      paramCount++
    }

    if (state) {
      conditions.push(`state ILIKE $${paramCount}`)
      values.push(`%${state}%`)
      paramCount++
    }

    if (country) {
      conditions.push(`country ILIKE $${paramCount}`)
      values.push(`%${country}%`)
      paramCount++
    }

    const whereClause = conditions.join(' AND ')

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM locations WHERE ${whereClause}`,
      values
    )
    const totalCount = parseInt(countResult.rows[0].count, 10)

    // Get paginated results
    const offset = (page - 1) * limit
    const locationsResult = await query<Location>(
      `SELECT * FROM locations
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    )

    const locations = locationsResult.rows

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return successResponse(
      {
        locations,
        pagination: {
          page,
          limit,
          total_count: totalCount,
          total_pages: totalPages,
          has_next: hasNext,
          has_prev: hasPrev,
        },
      },
      'Locations retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching locations:', error)
    return errorResponse('Failed to fetch locations', error, 500)
  }
}

/**
 * POST /api/locations
 * Create a new location
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = safeValidate(CreateLocationSchema, body)
    if (!validation.success) {
      return errorResponse('Validation failed', validation.errors.errors, 400)
    }

    const locationData = validation.data

    // If company_id is provided, verify it exists
    if (locationData.company_id) {
      const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [
        locationData.company_id,
      ])
      if (companyCheck.rows.length === 0) {
        return errorResponse('Company not found', undefined, 404)
      }
    }

    // Insert location into database
    const result = await query<Location>(
      `INSERT INTO locations (
        location_name, company_id, address, city, state, zip, country,
        location_type, timezone, contact_phone, access_instructions, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        locationData.location_name,
        locationData.company_id || null,
        locationData.address || null,
        locationData.city || null,
        locationData.state || null,
        locationData.zip || null,
        locationData.country || null,
        locationData.location_type || null,
        locationData.timezone || null,
        locationData.contact_phone || null,
        locationData.access_instructions || null,
        locationData.notes || null,
      ]
    )

    return successResponse(result.rows[0], 'Location created successfully', 201)
  } catch (error) {
    console.error('Error creating location:', error)
    return errorResponse('Failed to create location', error, 500)
  }
}
