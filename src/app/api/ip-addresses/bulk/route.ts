/**
 * IP Address Bulk Operations API
 *
 * POST /api/ip-addresses/bulk
 * Supports bulk operations on IP addresses:
 * - reserve: Mark multiple IPs as reserved
 * - release: Free up unused IP allocations
 * - update_dns: Bulk update DNS names from CSV data
 * - reassign_network: Move IPs to a different network
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

// Validation schemas for bulk operations
const BulkReserveSchema = z.object({
  operation: z.literal('reserve'),
  ip_ids: z.array(z.string()).min(1, 'At least one IP ID required'),
  notes: z.string().optional(),
})

const BulkReleaseSchema = z.object({
  operation: z.literal('release'),
  ip_ids: z.array(z.string()).min(1, 'At least one IP ID required'),
})

const BulkUpdateDNSSchema = z.object({
  operation: z.literal('update_dns'),
  updates: z
    .array(
      z.object({
        ip_id: z.string(),
        dns_name: z.string(),
      })
    )
    .min(1, 'At least one update required'),
})

const BulkReassignNetworkSchema = z.object({
  operation: z.literal('reassign_network'),
  ip_ids: z.array(z.string()).min(1, 'At least one IP ID required'),
  new_network_id: z.string(),
})

const BulkOperationSchema = z.discriminatedUnion('operation', [
  BulkReserveSchema,
  BulkReleaseSchema,
  BulkUpdateDNSSchema,
  BulkReassignNetworkSchema,
])

interface BulkOperationResponse {
  success: boolean
  data: {
    operation: string
    affected_count: number
    details: string
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<BulkOperationResponse | { success: false; message: string }>> {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = BulkOperationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: validationResult.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    const operation = validationResult.data

    let affectedCount = 0
    let details = ''

    switch (operation.operation) {
      case 'reserve': {
        // Mark IPs as reserved (type = 'reserved')
        const reserveQuery = `
          UPDATE ip_addresses
          SET
            type = 'reserved',
            notes = CASE
              WHEN $2::text IS NOT NULL THEN $2
              ELSE notes
            END,
            updated_at = NOW()
          WHERE id = ANY($1::uuid[])
          RETURNING id
        `

        const result = await query(reserveQuery, [operation.ip_ids, operation.notes || null])
        affectedCount = result.rowCount || 0
        details = `${affectedCount} IP(s) marked as reserved`
        break
      }

      case 'release': {
        // Release IPs (delete records)
        const releaseQuery = `
          DELETE FROM ip_addresses
          WHERE id = ANY($1::uuid[])
          RETURNING id
        `

        const result = await query(releaseQuery, [operation.ip_ids])
        affectedCount = result.rowCount || 0
        details = `${affectedCount} IP(s) released and removed from allocation`
        break
      }

      case 'update_dns': {
        // Bulk update DNS names using CASE statement
        if (operation.updates.length === 0) {
          return NextResponse.json(
            { success: false, message: 'No updates provided' },
            { status: 400 }
          )
        }

        // Build CASE statement for bulk update
        const caseStatements = operation.updates
          .map((_update, index) => `WHEN id = $${index * 2 + 2} THEN $${index * 2 + 3}`)
          .join(' ')

        const values = operation.updates.flatMap((update) => [update.ip_id, update.dns_name])
        const idList = operation.updates.map((u) => u.ip_id)

        const updateQuery = `
          UPDATE ip_addresses
          SET
            dns_name = CASE ${caseStatements} ELSE dns_name END,
            updated_at = NOW()
          WHERE id = ANY($1::uuid[])
          RETURNING id
        `

        const result = await query(updateQuery, [idList, ...values])
        affectedCount = result.rowCount || 0
        details = `${affectedCount} IP(s) DNS names updated`
        break
      }

      case 'reassign_network': {
        // Validate that the target network exists
        const networkCheck = await query('SELECT id FROM networks WHERE id = $1', [
          operation.new_network_id,
        ])

        if (networkCheck.rows.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Target network not found' },
            { status: 404 }
          )
        }

        // Reassign IPs to new network
        const reassignQuery = `
          UPDATE ip_addresses
          SET
            network_id = $2,
            updated_at = NOW()
          WHERE id = ANY($1::uuid[])
          RETURNING id
        `

        const result = await query(reassignQuery, [operation.ip_ids, operation.new_network_id])
        affectedCount = result.rowCount || 0
        details = `${affectedCount} IP(s) reassigned to new network`
        break
      }

      default:
        return NextResponse.json({ success: false, message: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        operation: operation.operation,
        affected_count: affectedCount,
        details,
      },
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform bulk operation',
      },
      { status: 500 }
    )
  }
}
