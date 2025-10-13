/**
 * Documents API - Single Record Operations
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import { UpdateDocumentSchema } from '@/lib/schemas/document'
import type { Document } from '@/types'

/**
 * GET /api/documents/:id
 * Get a single document by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sql = `SELECT * FROM documents WHERE id = $1`
    const result = await query<Document>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`GET /api/documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/documents/:id
 * Update a document
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = UpdateDocumentSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const updates = validation.data
    const fields: string[] = []
    const values: Array<string | number | null> = []
    let paramCount = 0

    if (updates.author_id !== undefined) {
      fields.push(`author_id = $${++paramCount}`)
      values.push(updates.author_id)
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${++paramCount}`)
      values.push(updates.title)
    }
    if (updates.document_type !== undefined) {
      fields.push(`document_type = $${++paramCount}`)
      values.push(updates.document_type)
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${++paramCount}`)
      values.push(updates.content)
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${++paramCount}`)
      values.push(updates.version)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${++paramCount}`)
      values.push(updates.status)
    }
    if (updates.created_date !== undefined) {
      fields.push(`created_date = $${++paramCount}`)
      values.push(updates.created_date)
    }
    if (updates.updated_date !== undefined) {
      fields.push(`updated_date = $${++paramCount}`)
      values.push(updates.updated_date)
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
      UPDATE documents
      SET ${fields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `

    const result = await query<Document>(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`PATCH /api/documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/:id
 * Delete a document
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
        (SELECT COUNT(*) FROM document_devices WHERE document_id = $1) as devices_count,
        (SELECT COUNT(*) FROM document_saas_services WHERE document_id = $1) as saas_services_count,
        (SELECT COUNT(*) FROM document_networks WHERE document_id = $1) as networks_count,
        (SELECT COUNT(*) FROM document_locations WHERE document_id = $1) as locations_count,
        (SELECT COUNT(*) FROM document_rooms WHERE document_id = $1) as rooms_count
    `
    const depsResult = await query<{
      devices_count: string
      saas_services_count: string
      networks_count: string
      locations_count: string
      rooms_count: string
    }>(depsCheckSql, [id])

    const deps = depsResult.rows[0]
    const devicesCount = parseInt(deps?.devices_count || '0')
    const saasCount = parseInt(deps?.saas_services_count || '0')
    const networksCount = parseInt(deps?.networks_count || '0')
    const locationsCount = parseInt(deps?.locations_count || '0')
    const roomsCount = parseInt(deps?.rooms_count || '0')
    const totalDeps = devicesCount + saasCount + networksCount + locationsCount + roomsCount

    if (totalDeps > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete document: ${devicesCount} device(s), ${saasCount} SaaS service(s), ${networksCount} network(s), ${locationsCount} location(s), and ${roomsCount} room(s) are linked to this document`,
        },
        { status: 400 }
      )
    }

    // Delete the document
    const sql = `DELETE FROM documents WHERE id = $1 RETURNING *`
    const result = await query<Document>(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    console.error(`DELETE /api/documents/${await (await params).id} error:`, error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
