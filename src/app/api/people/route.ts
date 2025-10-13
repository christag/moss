/**
 * API Route: /api/people
 * Handles GET (list) and POST (create) operations for people
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreatePersonSchema, ListPeopleQuerySchema } from '@/lib/schemas/person'
import type { Person } from '@/types'
import { parseRequestBody } from '@/lib/api'
import { cache, generateListCacheKey } from '@/lib/cache'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'

/**
 * GET /api/people
 * List people with optional filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validation = ListPeopleQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      page,
      limit,
      company_id,
      location_id,
      person_type,
      department,
      status,
      manager_id,
      search,
      sort_by,
      sort_order,
    } = validation.data

    // Generate cache key
    const cacheKey = generateListCacheKey('people', validation.data)

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        message: 'People retrieved successfully (cached)',
        data: cached,
      })
    }

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (company_id) {
      conditions.push(`company_id = $${paramCount}`)
      values.push(company_id)
      paramCount++
    }

    if (location_id) {
      conditions.push(`location_id = $${paramCount}`)
      values.push(location_id)
      paramCount++
    }

    if (person_type) {
      conditions.push(`person_type = $${paramCount}`)
      values.push(person_type)
      paramCount++
    }

    if (department) {
      conditions.push(`department = $${paramCount}`)
      values.push(department)
      paramCount++
    }

    if (status) {
      conditions.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    if (manager_id) {
      conditions.push(`manager_id = $${paramCount}`)
      values.push(manager_id)
      paramCount++
    }

    if (search) {
      conditions.push(
        `(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR employee_id ILIKE $${paramCount})`
      )
      values.push(`%${search}%`)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM people ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Calculate pagination
    const offset = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Get people with pagination
    const peopleResult = await query<Person>(
      `SELECT * FROM people ${whereClause} ORDER BY ${sort_by} ${sort_order} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    )

    const responseData = {
      people: peopleResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }

    // Cache for 30 seconds
    cache.set(cacheKey, responseData, 30)

    return NextResponse.json({
      success: true,
      message: 'People retrieved successfully',
      data: responseData,
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch people', error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/people
 * Create a new person
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validation = CreatePersonSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      full_name: providedFullName,
      first_name,
      last_name,
      email,
      username,
      phone,
      mobile,
      person_type,
      company_id,
      employee_id,
      job_title,
      department,
      location_id,
      manager_id,
      start_date,
      status = 'active',
      preferred_contact_method,
      notes,
    } = validation.data

    // Convert first_name + last_name to full_name if needed
    const full_name =
      providedFullName && providedFullName.trim().length > 0
        ? providedFullName
        : `${first_name?.trim()} ${last_name?.trim()}`.trim()

    // Verify foreign key references exist
    if (company_id) {
      const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [company_id])
      if (companyCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 })
      }
    }

    if (location_id) {
      const locationCheck = await query('SELECT id FROM locations WHERE id = $1', [location_id])
      if (locationCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 })
      }
    }

    if (manager_id) {
      const managerCheck = await query('SELECT id FROM people WHERE id = $1', [manager_id])
      if (managerCheck.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Manager not found' }, { status: 404 })
      }
    }

    // Check for duplicate email if provided
    if (email) {
      const emailCheck = await query('SELECT id FROM people WHERE email = $1', [email])
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate employee_id if provided
    if (employee_id) {
      const employeeIdCheck = await query('SELECT id FROM people WHERE employee_id = $1', [
        employee_id,
      ])
      if (employeeIdCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Employee ID already exists' },
          { status: 409 }
        )
      }
    }

    // Insert new person
    const result = await query<Person>(
      `INSERT INTO people (
        full_name, email, username, phone, mobile, person_type, company_id, employee_id,
        job_title, department, location_id, manager_id, start_date, status,
        preferred_contact_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        full_name,
        email || null,
        username || null,
        phone || null,
        mobile || null,
        person_type,
        company_id || null,
        employee_id || null,
        job_title || null,
        department || null,
        location_id || null,
        manager_id || null,
        start_date || null,
        status,
        preferred_contact_method || null,
        notes || null,
      ]
    )

    // Invalidate list cache
    cache.invalidatePattern('people:list:*')

    return NextResponse.json(
      {
        success: true,
        message: 'Person created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create person', error: String(error) },
      { status: 500 }
    )
  }
}
