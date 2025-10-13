/**
 * SaaS Services API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateSaaSServiceSchema, SaaSServiceQuerySchema } from '@/lib/schemas/saas-service'
import type { SaaSService } from '@/types'
import { parseRequestBody } from '@/lib/api'

// GET /api/saas-services - List SaaS services with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = SaaSServiceQuerySchema.parse(params)
    const {
      search,
      environment,
      status,
      criticality,
      software_id,
      company_id,
      business_owner_id,
      technical_contact_id,
      sso_enabled,
      scim_enabled,
      api_access_enabled,
      limit,
      offset,
      sort_by,
      sort_order,
    } = validatedParams

    let sql = 'SELECT * FROM saas_services WHERE 1=1'
    const values: (string | number | boolean)[] = []
    let paramCount = 1

    // Search across service_name, service_url, and account_id
    if (search) {
      sql += ` AND (service_name ILIKE $${paramCount} OR service_url ILIKE $${paramCount} OR account_id ILIKE $${paramCount})`
      values.push(`%${search}%`)
      paramCount++
    }

    // Filter by environment
    if (environment) {
      sql += ` AND environment = $${paramCount}`
      values.push(environment)
      paramCount++
    }

    // Filter by status
    if (status) {
      sql += ` AND status = $${paramCount}`
      values.push(status)
      paramCount++
    }

    // Filter by criticality
    if (criticality) {
      sql += ` AND criticality = $${paramCount}`
      values.push(criticality)
      paramCount++
    }

    // Filter by software_id
    if (software_id) {
      sql += ` AND software_id = $${paramCount}`
      values.push(software_id)
      paramCount++
    }

    // Filter by company_id
    if (company_id) {
      sql += ` AND company_id = $${paramCount}`
      values.push(company_id)
      paramCount++
    }

    // Filter by business_owner_id
    if (business_owner_id) {
      sql += ` AND business_owner_id = $${paramCount}`
      values.push(business_owner_id)
      paramCount++
    }

    // Filter by technical_contact_id
    if (technical_contact_id) {
      sql += ` AND technical_contact_id = $${paramCount}`
      values.push(technical_contact_id)
      paramCount++
    }

    // Filter by sso_enabled (has sso_provider set)
    if (sso_enabled === 'true') {
      sql += ` AND sso_provider IS NOT NULL`
    } else if (sso_enabled === 'false') {
      sql += ` AND sso_provider IS NULL`
    }

    // Filter by scim_enabled
    if (scim_enabled === 'true') {
      sql += ` AND scim_enabled = true`
    } else if (scim_enabled === 'false') {
      sql += ` AND scim_enabled = false`
    }

    // Filter by api_access_enabled
    if (api_access_enabled === 'true') {
      sql += ` AND api_access_enabled = true`
    } else if (api_access_enabled === 'false') {
      sql += ` AND api_access_enabled = false`
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order}`

    // Pagination
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limit, offset)

    const result = await query<SaaSService>(sql, values)

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
    console.error('Error fetching SaaS services:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch SaaS services',
      },
      { status: 400 }
    )
  }
}

// POST /api/saas-services - Create new SaaS service
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>
    const validatedData = CreateSaaSServiceSchema.parse(body)

    const {
      software_id,
      company_id,
      business_owner_id,
      technical_contact_id,
      service_name,
      service_url,
      account_id,
      environment,
      status,
      subscription_start,
      subscription_end,
      seat_count,
      cost,
      billing_frequency,
      criticality,
      sso_provider,
      sso_protocol,
      scim_enabled,
      provisioning_type,
      api_access_enabled,
      api_documentation_url,
      notes,
    } = validatedData

    const sql = `
      INSERT INTO saas_services (
        software_id, company_id, business_owner_id, technical_contact_id,
        service_name, service_url, account_id, environment, status,
        subscription_start, subscription_end, seat_count, cost, billing_frequency,
        criticality, sso_provider, sso_protocol, scim_enabled, provisioning_type,
        api_access_enabled, api_documentation_url, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `

    const values = [
      software_id || null,
      company_id || null,
      business_owner_id || null,
      technical_contact_id || null,
      service_name,
      service_url || null,
      account_id || null,
      environment || null,
      status || 'active',
      subscription_start || null,
      subscription_end || null,
      seat_count || null,
      cost || null,
      billing_frequency || null,
      criticality || null,
      sso_provider || null,
      sso_protocol || null,
      scim_enabled ?? false,
      provisioning_type || null,
      api_access_enabled ?? false,
      api_documentation_url || null,
      notes || null,
    ]

    const result = await query<SaaSService>(sql, values)

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'SaaS service created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating SaaS service:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create SaaS service',
      },
      { status: 400 }
    )
  }
}
