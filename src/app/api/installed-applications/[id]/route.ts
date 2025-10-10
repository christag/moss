/**
 * Installed Applications API - Single Record Operations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateInstalledApplicationSchema } from '@/lib/schemas/installed-application'
import type { InstalledApplication } from '@/types'

/**
 * GET /api/installed-applications/:id
 * Get a single installed application by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = `SELECT * FROM installed_applications WHERE id = $1`
    const result = await query<InstalledApplication>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Installed application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`GET /api/installed-applications/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/installed-applications/:id
 * Update an installed application
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = UpdateInstalledApplicationSchema.safeParse(body)

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

    if (updates.software_id !== undefined) {
      fields.push(`software_id = $${++paramCount}`)
      values.push(updates.software_id)
    }
    if (updates.application_name !== undefined) {
      fields.push(`application_name = $${++paramCount}`)
      values.push(updates.application_name)
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${++paramCount}`)
      values.push(updates.version)
    }
    if (updates.install_method !== undefined) {
      fields.push(`install_method = $${++paramCount}`)
      values.push(updates.install_method)
    }
    if (updates.deployment_platform !== undefined) {
      fields.push(`deployment_platform = $${++paramCount}`)
      values.push(updates.deployment_platform)
    }
    if (updates.package_id !== undefined) {
      fields.push(`package_id = $${++paramCount}`)
      values.push(updates.package_id)
    }
    if (updates.deployment_status !== undefined) {
      fields.push(`deployment_status = $${++paramCount}`)
      values.push(updates.deployment_status)
    }
    if (updates.install_date !== undefined) {
      fields.push(`install_date = $${++paramCount}`)
      values.push(updates.install_date)
    }
    if (updates.auto_update_enabled !== undefined) {
      fields.push(`auto_update_enabled = $${++paramCount}`)
      values.push(updates.auto_update_enabled)
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
      UPDATE installed_applications
      SET ${fields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `

    const result = await query<InstalledApplication>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Installed application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`PATCH /api/installed-applications/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/installed-applications/:id
 * Delete an installed application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies in installed_application_devices
    const depsCheckSql = `
      SELECT COUNT(*) as device_count
      FROM installed_application_devices
      WHERE application_id = $1
    `
    const depsResult = await query<{ device_count: string }>(depsCheckSql, [id])
    const deviceCount = parseInt(depsResult.rows[0]?.device_count || '0')

    if (deviceCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete installed application: ${deviceCount} device(s) have this application installed`,
        },
        { status: 400 }
      )
    }

    // Delete the installed application
    const sql = `DELETE FROM installed_applications WHERE id = $1 RETURNING *`
    const result = await query<InstalledApplication>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Installed application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`DELETE /api/installed-applications/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
