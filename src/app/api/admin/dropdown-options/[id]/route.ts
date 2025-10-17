/**
 * API Route: /api/admin/dropdown-options/[id]
 * Manage individual dropdown field options (update, archive)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { UpdateDropdownOptionSchema } from '@/lib/schemas/admin'
import { query } from '@/lib/db'
import type { DropdownFieldOption } from '@/types'

/**
 * GET /api/admin/dropdown-options/[id]
 * Get a single dropdown option by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = await params
    const result = await query<DropdownFieldOption>(
      `SELECT * FROM dropdown_field_options WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dropdown option not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching dropdown option:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dropdown option',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/dropdown-options/[id]
 * Update a dropdown option
 *
 * Body:
 * - option_label: Updated display label (optional)
 * - display_order: Updated sort order (optional)
 * - is_active: Active status (optional)
 * - color: Hex color (optional)
 * - description: Help text (optional)
 *
 * Note: option_value and field identification cannot be changed
 * Note: is_system options cannot be archived (is_active=false)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = await params

    // Check if option exists
    const existingResult = await query<DropdownFieldOption>(
      `SELECT * FROM dropdown_field_options WHERE id = $1`,
      [id]
    )

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dropdown option not found' },
        { status: 404 }
      )
    }

    const existing = existingResult.rows[0]

    // Parse and validate request body
    const body = await request.json()
    const validation = UpdateDropdownOptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Prevent archiving system options
    if (data.is_active === false && existing.is_system) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot archive system options',
          field: 'is_active',
        },
        { status: 403 }
      )
    }

    // Build UPDATE query dynamically
    const updates: string[] = []
    const queryParams: unknown[] = []
    let paramCount = 1

    if (data.option_label !== undefined) {
      updates.push(`option_label = $${paramCount}`)
      queryParams.push(data.option_label)
      paramCount++
    }

    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount}`)
      queryParams.push(data.display_order)
      paramCount++
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`)
      queryParams.push(data.is_active)
      paramCount++
    }

    if (data.color !== undefined) {
      updates.push(`color = $${paramCount}`)
      queryParams.push(data.color)
      paramCount++
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount}`)
      queryParams.push(data.description)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add ID parameter
    queryParams.push(id)

    const updateQuery = `
      UPDATE dropdown_field_options
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query<DropdownFieldOption>(updateQuery, queryParams)

    return NextResponse.json({
      success: true,
      message: 'Dropdown option updated successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating dropdown option:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update dropdown option',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/dropdown-options/[id]
 * Archive (soft delete) a dropdown option
 *
 * Query params:
 * - confirm: Must be "true" if usage_count > 0
 *
 * Note: System options (is_system=true) cannot be deleted
 * Note: Options with usage_count > 0 require confirmation
 * Note: This is a soft delete (sets is_active=false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    await requireRole('admin')

    const { id } = await params

    // Check if option exists
    const existingResult = await query<DropdownFieldOption>(
      `SELECT * FROM dropdown_field_options WHERE id = $1`,
      [id]
    )

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dropdown option not found' },
        { status: 404 }
      )
    }

    const existing = existingResult.rows[0]

    // Prevent deleting system options
    if (existing.is_system) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete system options',
        },
        { status: 403 }
      )
    }

    // Refresh usage count before archiving
    const refreshQuery = `
      SELECT calculate_dropdown_usage_count($1, $2, $3) as current_usage
    `
    const usageResult = await query<{ current_usage: string }>(refreshQuery, [
      existing.object_type,
      existing.field_name,
      existing.option_value,
    ])
    const currentUsage = parseInt(usageResult.rows[0].current_usage)

    // Update usage count in table
    await query(`UPDATE dropdown_field_options SET usage_count = $1 WHERE id = $2`, [
      currentUsage,
      id,
    ])

    // Check if confirmation is required
    const searchParams = request.nextUrl.searchParams
    const confirm = searchParams.get('confirm') === 'true'

    if (currentUsage > 0 && !confirm) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot archive option: ${currentUsage} record(s) are using this value`,
          usage_count: currentUsage,
          requires_confirmation: true,
        },
        { status: 409 }
      )
    }

    // Archive the option (soft delete)
    const archiveQuery = `
      UPDATE dropdown_field_options
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await query<DropdownFieldOption>(archiveQuery, [id])

    return NextResponse.json({
      success: true,
      message:
        currentUsage > 0
          ? `Option archived. ${currentUsage} existing record(s) will retain this value.`
          : 'Option archived successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error archiving dropdown option:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to archive dropdown option',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
