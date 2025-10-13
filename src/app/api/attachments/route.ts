/**
 * API Route: List Attachments
 * GET /api/attachments - List attachments for an object or query
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { AttachmentListQuerySchema } from '@/lib/schemas/attachment'
import type { FileAttachment, AttachmentObjectType } from '@/types'

/**
 * GET /api/attachments
 * List attachments with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      object_type: searchParams.get('object_type'),
      object_id: searchParams.get('object_id'),
      mime_type: searchParams.get('mime_type'),
      status: searchParams.get('status'),
      uploaded_by: searchParams.get('uploaded_by'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    }

    // Validate query parameters
    const validationResult = AttachmentListQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const query = validationResult.data
    const pool = getPool()

    // Build query based on filters
    let sql = `
      SELECT
        fa.*,
        u.full_name as uploader_name,
        u.email as uploader_email
      FROM file_attachments fa
      LEFT JOIN users u ON fa.uploaded_by = u.id
    `

    const conditions: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = []
    let paramIndex = 1

    // Join with junction table if filtering by object
    if (query.object_type && query.object_id) {
      const junctionTable = getJunctionTableName(query.object_type as AttachmentObjectType)
      sql = `
        SELECT
          fa.*,
          u.full_name as uploader_name,
          u.email as uploader_email,
          jt.attached_by,
          jt.attached_at
        FROM file_attachments fa
        INNER JOIN ${junctionTable} jt ON fa.id = jt.attachment_id
        LEFT JOIN users u ON fa.uploaded_by = u.id
      `
      conditions.push(`jt.${query.object_type}_id = $${paramIndex++}`)
      values.push(query.object_id)
    }

    // Add filters
    if (query.mime_type) {
      conditions.push(`fa.mime_type = $${paramIndex++}`)
      values.push(query.mime_type)
    }

    if (query.status) {
      conditions.push(`fa.status = $${paramIndex++}`)
      values.push(query.status)
    } else {
      // Default: only show active attachments
      conditions.push(`fa.status = $${paramIndex++}`)
      values.push('active')
    }

    if (query.uploaded_by) {
      conditions.push(`fa.uploaded_by = $${paramIndex++}`)
      values.push(query.uploaded_by)
    }

    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    // Add sorting
    const sortColumn =
      query.sort_by === 'filename'
        ? 'fa.original_filename'
        : query.sort_by === 'file_size'
          ? 'fa.file_size'
          : 'fa.uploaded_at'

    sql += ` ORDER BY ${sortColumn} ${query.sort_order.toUpperCase()}`

    // Add pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    values.push(query.limit, query.offset)

    // Execute query
    const result = await pool.query(sql, values)

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM file_attachments fa`

    if (query.object_type && query.object_id) {
      const junctionTable = getJunctionTableName(query.object_type as AttachmentObjectType)
      countSql = `
        SELECT COUNT(*) as total
        FROM file_attachments fa
        INNER JOIN ${junctionTable} jt ON fa.id = jt.attachment_id
      `
    }

    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ')
    }

    const countResult = await pool.query(
      countSql,
      values.slice(0, values.length - 2) // Remove LIMIT and OFFSET values
    )

    const total = parseInt(countResult.rows[0].total, 10)

    // Format results
    const attachments: FileAttachment[] = result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      original_filename: row.original_filename,
      file_size: parseInt(row.file_size, 10),
      mime_type: row.mime_type,
      storage_path: row.storage_path,
      storage_backend: row.storage_backend,
      metadata: row.metadata,
      uploaded_by: row.uploaded_by,
      uploaded_at: new Date(row.uploaded_at),
      download_count: row.download_count,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      uploader: {
        id: row.uploaded_by,
        full_name: row.uploader_name,
        email: row.uploader_email,
      },
    }))

    return NextResponse.json({
      success: true,
      data: attachments,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get junction table name for object type
 */
function getJunctionTableName(objectType: AttachmentObjectType): string {
  return `${objectType}_attachments`
}
