/**
 * External Documents API - List and Create
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import {
  CreateExternalDocumentSchema,
  ExternalDocumentQuerySchema,
} from '@/lib/schemas/external-document'
import type { ExternalDocument } from '@/types'

/**
 * GET /api/external-documents
 * List external documents with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = ExternalDocumentQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { search, document_type, limit, offset, sort_by, sort_order } = validation.data

    let sql = `SELECT * FROM external_documents WHERE 1=1`
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Search by title or description
    if (search) {
      paramCount++
      sql += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      values.push(`%${search}%`)
    }

    // Filter by document_type
    if (document_type) {
      paramCount++
      sql += ` AND document_type = $${paramCount}`
      values.push(document_type)
    }

    // Sorting
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Pagination
    sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    values.push(limit, offset)

    const result = await query<ExternalDocument>(sql, values)
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error: unknown) {
    console.error('GET /api/external-documents error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/external-documents
 * Create a new external document
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validation = CreateExternalDocumentSchema.safeParse(parseResult.data)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { title, document_type, url, description, notes, created_date, updated_date } =
      validation.data

    const sql = `
      INSERT INTO external_documents (
        title, document_type, url, description, notes,
        created_date, updated_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const values = [
      title,
      document_type || null,
      url || null,
      description || null,
      notes || null,
      created_date || null,
      updated_date || null,
    ]

    const result = await query<ExternalDocument>(sql, values)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/external-documents error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
