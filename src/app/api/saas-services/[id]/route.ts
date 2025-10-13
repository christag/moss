/**
 * SaaS Services API - Get, Update, Delete single SaaS service
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateSaaSServiceSchema } from '@/lib/schemas/saas-service'
import type { SaaSService } from '@/types'
import { parseRequestBody } from '@/lib/api'

// GET /api/saas-services/[id] - Get single SaaS service
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = 'SELECT * FROM saas_services WHERE id = $1'
    const result = await query<SaaSService>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'SaaS service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching SaaS service:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch SaaS service',
      },
      { status: 400 }
    )
  }
}

// PATCH /api/saas-services/[id] - Update SaaS service
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = UpdateSaaSServiceSchema.parse(body)

    const updates: string[] = []
    const values: (string | number | boolean | null)[] = []
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
      UPDATE saas_services
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<SaaSService>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'SaaS service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'SaaS service updated successfully',
    })
  } catch (error) {
    console.error('Error updating SaaS service:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update SaaS service',
      },
      { status: 400 }
    )
  }
}

// DELETE /api/saas-services/[id] - Delete SaaS service
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies
    const depsCheckSql = `
      SELECT
        (SELECT COUNT(*) FROM saas_service_integrations WHERE service_id = $1 OR integrated_service_id = $1) as integrations_count,
        (SELECT COUNT(*) FROM person_saas_services WHERE service_id = $1) as person_services_count,
        (SELECT COUNT(*) FROM group_saas_services WHERE service_id = $1) as group_services_count,
        (SELECT COUNT(*) FROM license_saas_services WHERE service_id = $1) as license_services_count
    `
    const depsResult = await query<{
      integrations_count: string
      person_services_count: string
      group_services_count: string
      license_services_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const integrationsCount = parseInt(deps?.integrations_count || '0')
    const personCount = parseInt(deps?.person_services_count || '0')
    const groupCount = parseInt(deps?.group_services_count || '0')
    const licenseCount = parseInt(deps?.license_services_count || '0')
    const totalDeps = integrationsCount + personCount + groupCount + licenseCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete SaaS service: ${integrationsCount} integration(s), ${personCount} person assignment(s), ${groupCount} group assignment(s), and ${licenseCount} license(s) are using this service`,
        },
        { status: 400 }
      )
    }

    const sql = 'DELETE FROM saas_services WHERE id = $1 RETURNING id'
    const result = await query<{ id: string }>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'SaaS service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'SaaS service deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting SaaS service:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete SaaS service',
      },
      { status: 400 }
    )
  }
}
