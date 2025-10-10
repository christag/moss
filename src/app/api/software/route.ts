/**
 * Software API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateSoftwareSchema, SoftwareQuerySchema } from '@/lib/schemas/software'
import type { Software } from '@/types'

// GET /api/software - List software with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = SoftwareQuerySchema.parse(params)
    const { search, software_category, company_id, limit, offset, sort_by, sort_order } =
      validatedParams

    let sql = 'SELECT * FROM software WHERE 1=1'
    const values: (string | number)[] = []
    let paramCount = 1

    // Search across product_name and description
    if (search) {
      sql += ` AND (product_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      values.push(`%${search}%`)
      paramCount++
    }

    // Filter by software_category
    if (software_category) {
      sql += ` AND software_category = $${paramCount}`
      values.push(software_category)
      paramCount++
    }

    // Filter by company_id
    if (company_id) {
      sql += ` AND company_id = $${paramCount}`
      values.push(company_id)
      paramCount++
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order}`

    // Pagination
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limit, offset)

    const result = await query<Software>(sql, values)

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: {
        limit,
        offset,
        total: result.rows.length,
      },
    })
  } catch (error) {
    console.error('Error fetching software:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch software',
      },
      { status: 400 }
    )
  }
}

// POST /api/software - Create new software
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateSoftwareSchema.parse(body)

    const { company_id, product_name, description, website, software_category, notes } =
      validatedData

    const sql = `
      INSERT INTO software (
        company_id, product_name, description, website, software_category, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const values = [
      company_id || null,
      product_name,
      description || null,
      website || null,
      software_category || null,
      notes || null,
    ]

    const result = await query<Software>(sql, values)

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'Software created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating software:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create software',
      },
      { status: 400 }
    )
  }
}
