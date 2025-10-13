/**
 * Software Licenses API - Single Record Operations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateSoftwareLicenseSchema } from '@/lib/schemas/software-license'
import type { SoftwareLicense } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/software-licenses/:id
 * Get a single software license by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = `SELECT * FROM software_licenses WHERE id = $1`
    const result = await query<SoftwareLicense>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Software license not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`GET /api/software-licenses/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/software-licenses/:id
 * Update a software license
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validation = UpdateSoftwareLicenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const updates = validation.data
    const fields: string[] = []
    const values: Array<string | number | boolean | null> = []
    let paramCount = 0

    if (updates.software_id !== undefined) {
      fields.push(`software_id = $${++paramCount}`)
      values.push(updates.software_id)
    }
    if (updates.purchased_from_id !== undefined) {
      fields.push(`purchased_from_id = $${++paramCount}`)
      values.push(updates.purchased_from_id)
    }
    if (updates.license_key !== undefined) {
      fields.push(`license_key = $${++paramCount}`)
      values.push(updates.license_key)
    }
    if (updates.license_type !== undefined) {
      fields.push(`license_type = $${++paramCount}`)
      values.push(updates.license_type)
    }
    if (updates.purchase_date !== undefined) {
      fields.push(`purchase_date = $${++paramCount}`)
      values.push(updates.purchase_date)
    }
    if (updates.expiration_date !== undefined) {
      fields.push(`expiration_date = $${++paramCount}`)
      values.push(updates.expiration_date)
    }
    if (updates.seat_count !== undefined) {
      fields.push(`seat_count = $${++paramCount}`)
      values.push(updates.seat_count)
    }
    if (updates.seats_used !== undefined) {
      fields.push(`seats_used = $${++paramCount}`)
      values.push(updates.seats_used)
    }
    if (updates.cost !== undefined) {
      fields.push(`cost = $${++paramCount}`)
      values.push(updates.cost)
    }
    if (updates.renewal_date !== undefined) {
      fields.push(`renewal_date = $${++paramCount}`)
      values.push(updates.renewal_date)
    }
    if (updates.auto_renew !== undefined) {
      fields.push(`auto_renew = $${++paramCount}`)
      values.push(updates.auto_renew)
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
      UPDATE software_licenses
      SET ${fields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `

    const result = await query<SoftwareLicense>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Software license not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`PATCH /api/software-licenses/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/software-licenses/:id
 * Delete a software license
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies in license_saas_services, license_people, license_installed_applications
    const depsCheckSql = `
      SELECT
        (SELECT COUNT(*) FROM license_saas_services WHERE license_id = $1) as saas_services_count,
        (SELECT COUNT(*) FROM license_people WHERE license_id = $1) as people_count,
        (SELECT COUNT(*) FROM license_installed_applications WHERE license_id = $1) as applications_count
    `
    const depsResult = await query<{
      saas_services_count: string
      people_count: string
      applications_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const saasCount = parseInt(deps?.saas_services_count || '0')
    const peopleCount = parseInt(deps?.people_count || '0')
    const appCount = parseInt(deps?.applications_count || '0')
    const totalDeps = saasCount + peopleCount + appCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete software license: ${saasCount} SaaS service(s), ${peopleCount} person/people, and ${appCount} installed application(s) are using this license`,
        },
        { status: 400 }
      )
    }

    // Delete the software license
    const sql = `DELETE FROM software_licenses WHERE id = $1 RETURNING *`
    const result = await query<SoftwareLicense>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Software license not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`DELETE /api/software-licenses/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
