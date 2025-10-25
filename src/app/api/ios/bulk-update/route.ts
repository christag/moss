/**
 * Bulk Update IOs API Endpoint
 *
 * PATCH /api/ios/bulk-update
 * Updates multiple IOs in a single transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { z } from 'zod'

// Validation schema for bulk update (supports two formats)
// Format 1: Array of updates with ids: { updates: [{ id, field1, field2 }] }
// Format 2: Ids + shared updates: { ids: [...], updates: { field1, field2 } }
const BulkUpdateIOSchemaArray = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      // Allow partial updates of any IO fields
      interface_name: z.string().optional(),
      interface_type: z.string().optional(),
      speed: z.string().optional(),
      duplex_mode: z.string().optional(),
      status: z.string().optional(),
      vlan_id: z.number().nullable().optional(),
      native_network_id: z.string().uuid().nullable().optional(),
      trunk_mode: z.enum(['access', 'trunk', 'hybrid']).nullable().optional(),
      is_enabled: z.boolean().optional(),
      description: z.string().nullable().optional(),
      mac_address: z.string().nullable().optional(),
      ip_address: z.string().nullable().optional(),
      subnet_mask: z.string().nullable().optional(),
      gateway: z.string().nullable().optional(),
      connected_to_io_id: z.string().uuid().nullable().optional(),
      cable_type: z.string().nullable().optional(),
      connector_type: z.string().nullable().optional(),
      power_draw_watts: z.number().nullable().optional(),
      poe_capable: z.boolean().optional(),
      poe_enabled: z.boolean().optional(),
    })
  ),
})

const BulkUpdateIOSchemaSimple = z.object({
  ids: z.array(z.string().uuid()),
  updates: z.record(z.any()), // Flexible updates object
})

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()

    // Try to parse as simple format first, then array format
    let updates: Array<{ id: string; [key: string]: unknown }>
    try {
      const simpleData = BulkUpdateIOSchemaSimple.parse(body)
      // Convert simple format to array format
      updates = simpleData.ids.map((id) => ({ id, ...simpleData.updates }))
    } catch {
      // Try array format
      const arrayData = BulkUpdateIOSchemaArray.parse(body)
      updates = arrayData.updates
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 })
    }

    // Begin transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const updatedIds: string[] = []
      const errors: Array<{ id: string; error: string }> = []

      // Process each update
      for (const update of updates) {
        try {
          const { id, ...fields } = update

          // Build dynamic UPDATE query
          const fieldEntries = Object.entries(fields).filter(([_, value]) => value !== undefined)

          if (fieldEntries.length === 0) {
            continue // Skip if no fields to update
          }

          const setClause = fieldEntries.map(([key], index) => `${key} = $${index + 2}`).join(', ')

          const values = [id, ...fieldEntries.map(([_, value]) => value)]

          const query = `
            UPDATE ios
            SET ${setClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
          `

          const result = await client.query(query, values)

          if (result.rowCount === 0) {
            errors.push({ id, error: 'IO not found' })
          } else {
            updatedIds.push(id)
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          errors.push({ id: update.id, error: errorMessage })
        }
      }

      // Commit transaction if at least some updates succeeded
      if (updatedIds.length > 0) {
        await client.query('COMMIT')

        return NextResponse.json({
          success: true,
          data: {
            updated_count: updatedIds.length,
            updated_ids: updatedIds,
            errors: errors.length > 0 ? errors : undefined,
          },
        })
      } else {
        await client.query('ROLLBACK')
        return NextResponse.json(
          {
            success: false,
            error: 'No IOs were updated',
            details: errors,
          },
          { status: 400 }
        )
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Bulk update IOs error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update IOs',
      },
      { status: 500 }
    )
  }
}
