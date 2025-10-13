/**
 * Contracts API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import { CreateContractSchema, ContractQuerySchema } from '@/lib/schemas/contract'
import type { Contract } from '@/types'

/**
 * GET /api/contracts
 * List contracts with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = ContractQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid query parameters',
        },
        { status: 400 }
      )
    }

    const { search, company_id, contract_type, auto_renew, limit, offset, sort_by, sort_order } =
      validation.data

    let sql = `SELECT * FROM contracts WHERE 1=1`
    const values: Array<string | number | boolean | null> = []
    let paramCount = 0

    // Search by contract name or contract number
    if (search) {
      paramCount++
      sql += ` AND (contract_name ILIKE $${paramCount} OR contract_number ILIKE $${paramCount})`
      values.push(`%${search}%`)
    }

    // Filter by company_id
    if (company_id) {
      paramCount++
      sql += ` AND company_id = $${paramCount}`
      values.push(company_id)
    }

    // Filter by contract_type
    if (contract_type) {
      paramCount++
      sql += ` AND contract_type = $${paramCount}`
      values.push(contract_type)
    }

    // Filter by auto_renew
    if (auto_renew) {
      paramCount++
      sql += ` AND auto_renew = $${paramCount}`
      values.push(auto_renew === 'true')
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Pagination
    sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    values.push(limit, offset)

    const result = await query<Contract>(sql, values)
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error: unknown) {
    console.error('GET /api/contracts error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts
 * Create a new contract
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = CreateContractSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const {
      company_id,
      contract_name,
      contract_number,
      contract_type,
      start_date,
      end_date,
      cost,
      billing_frequency,
      auto_renew,
      renewal_notice_days,
      terms,
      notes,
    } = validation.data

    const sql = `
      INSERT INTO contracts (
        company_id, contract_name, contract_number, contract_type,
        start_date, end_date, cost, billing_frequency,
        auto_renew, renewal_notice_days, terms, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const values = [
      company_id || null,
      contract_name,
      contract_number || null,
      contract_type || null,
      start_date || null,
      end_date || null,
      cost || null,
      billing_frequency || null,
      auto_renew !== undefined ? auto_renew : false,
      renewal_notice_days || null,
      terms || null,
      notes || null,
    ]

    const result = await query<Contract>(sql, values)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/contracts error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
