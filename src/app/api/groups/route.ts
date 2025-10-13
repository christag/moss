/**
 * Groups API Routes
 * Handles listing and creating groups
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateGroupSchema, GroupQuerySchema } from '@/lib/schemas/group'
import type { Group } from '@/types'
import { parseRequestBody } from '@/lib/api'

/**
 * GET /api/groups
 * List groups with optional filtering, searching, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validated = GroupQuerySchema.parse(params)
    const { search, group_type, limit, offset, sort_by, sort_order } = validated

    // Build WHERE clauses
    const conditions: string[] = []
    const values: Array<string | number> = []
    let paramCount = 0

    if (search) {
      paramCount++
      conditions.push(`(group_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`)
      values.push(`%${search}%`)
    }

    if (group_type) {
      paramCount++
      conditions.push(`group_type = $${paramCount}`)
      values.push(group_type)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`

    // Add pagination
    paramCount++
    const limitClause = `LIMIT $${paramCount}`
    values.push(limit)

    paramCount++
    const offsetClause = `OFFSET $${paramCount}`
    values.push(offset)

    // Execute query
    const sql = `
      SELECT * FROM groups
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `

    const result = await query<Group>(sql, values)

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) as total FROM groups ${whereClause}`
    const countResult = await query<{ total: string }>(countSql, values.slice(0, paramCount - 2))
    const total = parseInt(countResult.rows[0]?.total || '0')

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + result.rows.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch groups' }, { status: 500 })
  }
}

/**
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with JSON error handling

    const parseResult = await parseRequestBody(request)

    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = CreateGroupSchema.parse(body)

    // Build INSERT query
    const fields: string[] = []
    const placeholders: string[] = []
    const values: Array<string | number | null> = []
    let paramCount = 0

    // Required fields
    paramCount++
    fields.push('group_name')
    placeholders.push(`$${paramCount}`)
    values.push(validated.group_name)

    paramCount++
    fields.push('group_type')
    placeholders.push(`$${paramCount}`)
    values.push(validated.group_type)

    // Optional fields
    if (validated.description !== undefined) {
      paramCount++
      fields.push('description')
      placeholders.push(`$${paramCount}`)
      values.push(validated.description)
    }

    if (validated.group_id_external !== undefined) {
      paramCount++
      fields.push('group_id_external')
      placeholders.push(`$${paramCount}`)
      values.push(validated.group_id_external)
    }

    if (validated.created_date !== undefined) {
      paramCount++
      fields.push('created_date')
      placeholders.push(`$${paramCount}`)
      values.push(validated.created_date)
    }

    if (validated.notes !== undefined) {
      paramCount++
      fields.push('notes')
      placeholders.push(`$${paramCount}`)
      values.push(validated.notes)
    }

    // Execute INSERT
    const sql = `
      INSERT INTO groups (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const result = await query<Group>(sql, values)

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Failed to create group' }, { status: 500 })
  }
}
