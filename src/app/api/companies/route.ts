/**
 * Companies API Routes
 * POST /api/companies - Create a new company
 * GET /api/companies - List companies with pagination and filters
 */
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { safeValidate, getValidationErrors } from '@/lib/validation'
import { CreateCompanySchema, ListCompaniesQuerySchema } from '@/lib/schemas/company'
import { cache, generateListCacheKey } from '@/lib/cache'
import type { Company } from '@/types'

/**
 * POST /api/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    // Validate request body
    const validation = safeValidate(CreateCompanySchema, parseResult.data)

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

    // Invalidate list cache when creating a new company
    cache.invalidatePattern('companies:list:*')

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

    // Generate cache key for this specific query
    const cacheKey = generateListCacheKey('companies', {
      page,
      limit,
      company_type,
      search,
      sort_by,
      sort_order,
    })

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'Companies retrieved successfully (cached)')
    }

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
    const offset = ((page ?? 1) - 1) * (limit ?? 50)
    const totalPages = Math.ceil(totalCount / (limit ?? 50))

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
      [...values, limit ?? 50, offset]
    )

    const responseData = {
      companies: result.rows,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 50,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: (page ?? 1) < totalPages,
        has_prev: (page ?? 1) > 1,
      },
    }

    // Cache the response for 30 seconds (list data changes frequently)
    cache.set(cacheKey, responseData, 30)

    return successResponse(responseData, 'Companies retrieved successfully')
  } catch (error) {
    console.error('Error fetching companies:', error)
    return errorResponse('Failed to fetch companies', error, 500)
  }
}
