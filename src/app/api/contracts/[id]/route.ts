/**
 * Contracts API - Single Record Operations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import { UpdateContractSchema } from '@/lib/schemas/contract'
import type { Contract } from '@/types'

/**
 * GET /api/contracts/:id
 * Get a single contract by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = `SELECT * FROM contracts WHERE id = $1`
    const result = await query<Contract>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`GET /api/contracts/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/contracts/:id
 * Update a contract
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = UpdateContractSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const updates = validation.data
    const fields: string[] = []
    const values: Array<string | number | boolean | null> = []
    let paramCount = 0

    if (updates.company_id !== undefined) {
      fields.push(`company_id = $${++paramCount}`)
      values.push(updates.company_id)
    }
    if (updates.contract_name !== undefined) {
      fields.push(`contract_name = $${++paramCount}`)
      values.push(updates.contract_name)
    }
    if (updates.contract_number !== undefined) {
      fields.push(`contract_number = $${++paramCount}`)
      values.push(updates.contract_number)
    }
    if (updates.contract_type !== undefined) {
      fields.push(`contract_type = $${++paramCount}`)
      values.push(updates.contract_type)
    }
    if (updates.start_date !== undefined) {
      fields.push(`start_date = $${++paramCount}`)
      values.push(updates.start_date)
    }
    if (updates.end_date !== undefined) {
      fields.push(`end_date = $${++paramCount}`)
      values.push(updates.end_date)
    }
    if (updates.cost !== undefined) {
      fields.push(`cost = $${++paramCount}`)
      values.push(updates.cost)
    }
    if (updates.billing_frequency !== undefined) {
      fields.push(`billing_frequency = $${++paramCount}`)
      values.push(updates.billing_frequency)
    }
    if (updates.auto_renew !== undefined) {
      fields.push(`auto_renew = $${++paramCount}`)
      values.push(updates.auto_renew)
    }
    if (updates.renewal_notice_days !== undefined) {
      fields.push(`renewal_notice_days = $${++paramCount}`)
      values.push(updates.renewal_notice_days)
    }
    if (updates.terms !== undefined) {
      fields.push(`terms = $${++paramCount}`)
      values.push(updates.terms)
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${++paramCount}`)
      values.push(updates.notes)
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const sql = `
      UPDATE contracts
      SET ${fields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `

    const result = await query<Contract>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`PATCH /api/contracts/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contracts/:id
 * Delete a contract
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies in junction tables
    const depsCheckSql = `
      SELECT
        (SELECT COUNT(*) FROM contract_software WHERE contract_id = $1) as software_count,
        (SELECT COUNT(*) FROM contract_saas_services WHERE contract_id = $1) as saas_services_count,
        (SELECT COUNT(*) FROM contract_devices WHERE contract_id = $1) as devices_count
    `
    const depsResult = await query<{
      software_count: string
      saas_services_count: string
      devices_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const softwareCount = parseInt(deps?.software_count || '0')
    const saasCount = parseInt(deps?.saas_services_count || '0')
    const devicesCount = parseInt(deps?.devices_count || '0')
    const totalDeps = softwareCount + saasCount + devicesCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete contract: ${softwareCount} software item(s), ${saasCount} SaaS service(s), and ${devicesCount} device(s) are linked to this contract`,
        },
        { status: 400 }
      )
    }

    // Delete the contract
    const sql = `DELETE FROM contracts WHERE id = $1 RETURNING *`
    const result = await query<Contract>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`DELETE /api/contracts/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
