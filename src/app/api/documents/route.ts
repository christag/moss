/**
 * Documents API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import { CreateDocumentSchema, DocumentQuerySchema } from '@/lib/schemas/document'
import type { Document } from '@/types'

/**
 * GET /api/documents
 * List documents with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = DocumentQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { search, author_id, document_type, status, limit, offset, sort_by, sort_order } =
      validation.data

    let sql = `SELECT * FROM documents WHERE 1=1`
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Search by title or content
    if (search) {
      paramCount++
      sql += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`
      values.push(`%${search}%`)
    }

    // Filter by author_id
    if (author_id) {
      paramCount++
      sql += ` AND author_id = $${paramCount}`
      values.push(author_id)
    }

    // Filter by document_type
    if (document_type) {
      paramCount++
      sql += ` AND document_type = $${paramCount}`
      values.push(document_type)
    }

    // Filter by status
    if (status) {
      paramCount++
      sql += ` AND status = $${paramCount}`
      values.push(status)
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Pagination
    sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    values.push(limit, offset)

    const result = await query<Document>(sql, values)
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error: unknown) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = CreateDocumentSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      author_id,
      title,
      document_type,
      content,
      version,
      status,
      created_date,
      updated_date,
      notes,
    } = validation.data

    const sql = `
      INSERT INTO documents (
        author_id, title, document_type, content, version, status,
        created_date, updated_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const values = [
      author_id || null,
      title,
      document_type || null,
      content || null,
      version || null,
      status || 'draft',
      created_date || null,
      updated_date || null,
      notes || null,
    ]

    const result = await query<Document>(sql, values)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
