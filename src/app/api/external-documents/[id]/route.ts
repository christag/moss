/**
 * External Documents API - Single Record Operations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import { UpdateExternalDocumentSchema } from '@/lib/schemas/external-document'
import type { ExternalDocument } from '@/types'

/**
 * GET /api/external-documents/:id
 * Get a single external document by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = `SELECT * FROM external_documents WHERE id = $1`
    const result = await query<ExternalDocument>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'External document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`GET /api/external-documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/external-documents/:id
 * Update an external document
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = UpdateExternalDocumentSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const updates = validation.data
    const fields: string[] = []
    const values: Array<string | number | null> = []
    let paramCount = 0

    if (updates.title !== undefined) {
      fields.push(`title = $${++paramCount}`)
      values.push(updates.title)
    }
    if (updates.document_type !== undefined) {
      fields.push(`document_type = $${++paramCount}`)
      values.push(updates.document_type)
    }
    if (updates.url !== undefined) {
      fields.push(`url = $${++paramCount}`)
      values.push(updates.url)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${++paramCount}`)
      values.push(updates.description)
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${++paramCount}`)
      values.push(updates.notes)
    }
    if (updates.created_date !== undefined) {
      fields.push(`created_date = $${++paramCount}`)
      values.push(updates.created_date)
    }
    if (updates.updated_date !== undefined) {
      fields.push(`updated_date = $${++paramCount}`)
      values.push(updates.updated_date)
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const sql = `
      UPDATE external_documents
      SET ${fields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `

    const result = await query<ExternalDocument>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'External document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`PATCH /api/external-documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/external-documents/:id
 * Delete an external document
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for dependencies in junction tables
    const depsCheckSql = `
      SELECT
        (SELECT COUNT(*) FROM external_document_devices WHERE external_document_id = $1) as devices_count,
        (SELECT COUNT(*) FROM external_document_installed_applications WHERE external_document_id = $1) as applications_count,
        (SELECT COUNT(*) FROM external_document_saas_services WHERE external_document_id = $1) as saas_services_count,
        (SELECT COUNT(*) FROM external_document_people WHERE external_document_id = $1) as people_count,
        (SELECT COUNT(*) FROM external_document_companies WHERE external_document_id = $1) as companies_count,
        (SELECT COUNT(*) FROM external_document_networks WHERE external_document_id = $1) as networks_count,
        (SELECT COUNT(*) FROM external_document_rooms WHERE external_document_id = $1) as rooms_count
    `
    const depsResult = await query<{
      devices_count: string
      applications_count: string
      saas_services_count: string
      people_count: string
      companies_count: string
      networks_count: string
      rooms_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const devicesCount = parseInt(deps?.devices_count || '0')
    const applicationsCount = parseInt(deps?.applications_count || '0')
    const saasCount = parseInt(deps?.saas_services_count || '0')
    const peopleCount = parseInt(deps?.people_count || '0')
    const companiesCount = parseInt(deps?.companies_count || '0')
    const networksCount = parseInt(deps?.networks_count || '0')
    const roomsCount = parseInt(deps?.rooms_count || '0')
    const totalDeps =
      devicesCount +
      applicationsCount +
      saasCount +
      peopleCount +
      companiesCount +
      networksCount +
      roomsCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete external document: ${devicesCount} device(s), ${applicationsCount} application(s), ${saasCount} SaaS service(s), ${peopleCount} people, ${companiesCount} company(ies), ${networksCount} network(s), and ${roomsCount} room(s) are linked to this external document`,
        },
        { status: 400 }
      )
    }

    // Delete the external document
    const sql = `DELETE FROM external_documents WHERE id = $1 RETURNING *`
    const result = await query<ExternalDocument>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'External document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`DELETE /api/external-documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
