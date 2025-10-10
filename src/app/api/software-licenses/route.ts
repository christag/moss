/**
 * Software Licenses API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  CreateSoftwareLicenseSchema,
  SoftwareLicenseQuerySchema,
} from '@/lib/schemas/software-license'
import type { SoftwareLicense } from '@/types'

/**
 * GET /api/software-licenses
 * List software licenses with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = SoftwareLicenseQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      search,
      software_id,
      purchased_from_id,
      license_type,
      auto_renew,
      expiring_soon,
      expired,
      limit,
      offset,
      sort_by,
      sort_order,
    } = validation.data

    let sql = `SELECT * FROM software_licenses WHERE 1=1`
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Search by license_key
    if (search) {
      paramCount++
      sql += ` AND license_key ILIKE $${paramCount}`
      values.push(`%${search}%`)
    }

    // Filter by software_id
    if (software_id) {
      paramCount++
      sql += ` AND software_id = $${paramCount}`
      values.push(software_id)
    }

    // Filter by purchased_from_id
    if (purchased_from_id) {
      paramCount++
      sql += ` AND purchased_from_id = $${paramCount}`
      values.push(purchased_from_id)
    }

    // Filter by license_type
    if (license_type) {
      paramCount++
      sql += ` AND license_type = $${paramCount}`
      values.push(license_type)
    }

    // Filter by auto_renew
    if (auto_renew === 'true') {
      sql += ` AND auto_renew = true`
    } else if (auto_renew === 'false') {
      sql += ` AND auto_renew = false`
    }

    // Filter by expiring_soon (within 90 days)
    if (expiring_soon === 'true') {
      sql += ` AND expiration_date IS NOT NULL AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`
    }

    // Filter by expired
    if (expired === 'true') {
      sql += ` AND expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE`
    } else if (expired === 'false') {
      sql += ` AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)`
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Pagination
    sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    values.push(limit, offset)

    const result = await query<SoftwareLicense>(sql, values)
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error: unknown) {
    console.error('GET /api/software-licenses error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/software-licenses
 * Create a new software license
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = CreateSoftwareLicenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      software_id,
      purchased_from_id,
      license_key,
      license_type,
      purchase_date,
      expiration_date,
      seat_count,
      seats_used,
      cost,
      renewal_date,
      auto_renew,
      notes,
    } = validation.data

    const sql = `
      INSERT INTO software_licenses (
        software_id, purchased_from_id, license_key, license_type, purchase_date,
        expiration_date, seat_count, seats_used, cost, renewal_date, auto_renew, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const values = [
      software_id || null,
      purchased_from_id || null,
      license_key || null,
      license_type || null,
      purchase_date || null,
      expiration_date || null,
      seat_count || null,
      seats_used || null,
      cost || null,
      renewal_date || null,
      auto_renew || false,
      notes || null,
    ]

    const result = await query<SoftwareLicense>(sql, values)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/software-licenses error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
