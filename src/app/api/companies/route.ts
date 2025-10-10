/**
 * Companies API Routes
 * POST /api/companies - Create a new company
 * GET /api/companies - List companies with pagination and filters
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { safeValidate, getValidationErrors } from '@/lib/validation'
import { CreateCompanySchema, ListCompaniesQuerySchema } from '@/lib/schemas/company'
import type { Company } from '@/types'

/**
 * POST /api/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = safeValidate(CreateCompanySchema, body)

    if (!validation.success) {
      return errorResponse('Validation failed', getValidationErrors(validation.errors), 400)
    }

    const {
      company_name,
      company_type,
      website,
      phone,
      email,
      address,
      city,
      state,
      zip,
      country,
      account_number,
      support_url,
      support_phone,
      support_email,
      tax_id,
      notes,
    } = validation.data

    // Insert company into database
    const result = await query<Company>(
      `INSERT INTO companies (
        company_name, company_type, website, phone, email, address, city, state, zip, country,
        account_number, support_url, support_phone, support_email, tax_id, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        company_name,
        company_type,
        website || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        state || null,
        zip || null,
        country || null,
        account_number || null,
        support_url || null,
        support_phone || null,
        support_email || null,
        tax_id || null,
        notes || null,
      ]
    )

    const company = result.rows[0]

    return successResponse(company, 'Company created successfully', 201)
  } catch (error) {
    console.error('Error creating company:', error)
    return errorResponse('Failed to create company', error, 500)
  }
}

/**
 * GET /api/companies
 * List companies with pagination, filtering, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      company_type: searchParams.get('company_type') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') || undefined,
    }

    const validation = safeValidate(ListCompaniesQuerySchema, queryParams)

    if (!validation.success) {
      return errorResponse('Invalid query parameters', getValidationErrors(validation.errors), 400)
    }

    const { page, limit, company_type, search, sort_by, sort_order } = validation.data

    // Build WHERE clause
    const conditions: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (company_type) {
      conditions.push(`company_type = $${paramCount}`)
      values.push(company_type)
      paramCount++
    }

    if (search) {
      conditions.push(`company_name ILIKE $${paramCount}`)
      values.push(`%${search}%`)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM companies ${whereClause}`,
      values
    )
    const totalCount = parseInt(countResult.rows[0].count, 10)

    // Calculate pagination
    const offset = (page - 1) * limit
    const totalPages = Math.ceil(totalCount / limit)

    // Build ORDER BY clause
    const orderBy = sort_by || 'created_at'
    const order = sort_order || 'asc'
    const orderClause = `ORDER BY ${orderBy} ${order.toUpperCase()}`

    // Get paginated results
    const result = await query<Company>(
      `SELECT * FROM companies
       ${whereClause}
       ${orderClause}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    )

    return successResponse(
      {
        companies: result.rows,
        pagination: {
          page,
          limit,
          total_count: totalCount,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
      'Companies retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching companies:', error)
    return errorResponse('Failed to fetch companies', error, 500)
  }
}
