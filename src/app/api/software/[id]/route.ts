/**
 * Software API - Get, Update, Delete single software
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateSoftwareSchema } from '@/lib/schemas/software'
import type { Software } from '@/types'
import { parseRequestBody } from '@/lib/api'

// GET /api/software/[id] - Get single software
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = 'SELECT * FROM software WHERE id = $1'
    const result = await query<Software>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Software not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
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

// PATCH /api/software/[id] - Update software
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = UpdateSoftwareSchema.parse(body)

    const updates: string[] = []
    const values: (string | number | null)[] = []
    let paramCount = 1

    // Build dynamic update query
    Object.entries(validatedData).forEach(([key, value]) => {
      updates.push(`${key} = $${paramCount}`)
      values.push(value === undefined ? null : value)
      paramCount++
    })

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add id to values
    values.push(id)

    const sql = `
      UPDATE software
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<Software>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Software not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Software updated successfully',
    })
  } catch (error) {
    console.error('Error updating software:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update software',
      },
      { status: 400 }
    )
  }
}

// DELETE /api/software/[id] - Delete software
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies
    const depsCheckSql = `
      SELECT
        (SELECT COUNT(*) FROM saas_services WHERE software_id = $1) as saas_services_count,
        (SELECT COUNT(*) FROM software_licenses WHERE software_id = $1) as licenses_count,
        (SELECT COUNT(*) FROM installed_applications WHERE software_id = $1) as applications_count
    `
    const depsResult = await query<{
      saas_services_count: string
      licenses_count: string
      applications_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const saasCount = parseInt(deps?.saas_services_count || '0')
    const licenseCount = parseInt(deps?.licenses_count || '0')
    const appCount = parseInt(deps?.applications_count || '0')
    const totalDeps = saasCount + licenseCount + appCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete software: ${saasCount} SaaS service(s), ${licenseCount} license(s), and ${appCount} installed application(s) are using this software`,
        },
        { status: 400 }
      )
    }

    const sql = 'DELETE FROM software WHERE id = $1 RETURNING id'
    const result = await query<{ id: string }>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Software not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Software deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting software:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete software',
      },
      { status: 400 }
    )
  }
}
