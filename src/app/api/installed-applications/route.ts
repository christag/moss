/**
 * Installed Applications API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  CreateInstalledApplicationSchema,
  InstalledApplicationQuerySchema,
} from '@/lib/schemas/installed-application'
import type { InstalledApplication } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/installed-applications
 * List installed applications with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = InstalledApplicationQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid query parameters',
        },
        { status: 400 }
      )
    }

    const {
      search,
      software_id,
      deployment_status,
      deployment_platform,
      auto_update_enabled,
      device_id,
      limit,
      offset,
      sort_by,
      sort_order,
    } = validation.data

    let sql = `SELECT * FROM installed_applications WHERE 1=1`
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Search by application_name, version, or package_id
    if (search) {
      paramCount++
      sql += ` AND (application_name ILIKE $${paramCount} OR version ILIKE $${paramCount} OR package_id ILIKE $${paramCount})`
      values.push(`%${search}%`)
    }

    // Filter by software_id
    if (software_id) {
      paramCount++
      sql += ` AND software_id = $${paramCount}`
      values.push(software_id)
    }

    // Filter by deployment_status
    if (deployment_status) {
      paramCount++
      sql += ` AND deployment_status = $${paramCount}`
      values.push(deployment_status)
    }

    // Filter by deployment_platform
    if (deployment_platform) {
      paramCount++
      sql += ` AND deployment_platform = $${paramCount}`
      values.push(deployment_platform)
    }

    // Filter by auto_update_enabled
    if (auto_update_enabled === 'true') {
      sql += ` AND auto_update_enabled = true`
    } else if (auto_update_enabled === 'false') {
      sql += ` AND auto_update_enabled = false`
    }

    // Filter by device_id (applications installed on a specific device)
    if (device_id) {
      sql += ` AND id IN (SELECT application_id FROM installed_application_devices WHERE device_id = $${++paramCount})`
      values.push(device_id)
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Pagination
    sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    values.push(limit, offset)

    const result = await query<InstalledApplication>(sql, values)
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error: unknown) {
    console.error('GET /api/installed-applications error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/installed-applications
 * Create a new installed application
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validation = CreateInstalledApplicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const {
      software_id,
      application_name,
      version,
      install_method,
      deployment_platform,
      package_id,
      deployment_status,
      install_date,
      auto_update_enabled,
      notes,
    } = validation.data

    const sql = `
      INSERT INTO installed_applications (
        software_id, application_name, version, install_method, deployment_platform,
        package_id, deployment_status, install_date, auto_update_enabled, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const values = [
      software_id || null,
      application_name,
      version || null,
      install_method || null,
      deployment_platform || null,
      package_id || null,
      deployment_status || null,
      install_date || null,
      auto_update_enabled || false,
      notes || null,
    ]

    const result = await query<InstalledApplication>(sql, values)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/installed-applications error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
