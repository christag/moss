/**
 * Bulk Create IOs API Endpoint
 *
 * POST /api/ios/bulk-create
 * Creates multiple IOs in a single transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { CreateIOSchema } from '@/lib/schemas/io'
import { z } from 'zod'

// Validation schema for bulk create
const BulkCreateIOSchema = z.object({
  items: z.array(CreateIOSchema).min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = BulkCreateIOSchema.parse(body)

    if (validatedData.items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 })
    }

    // Begin transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const createdIds: string[] = []
      const errors: Array<{ index: number; name?: string; error: string }> = []

      // Process each item
      for (let i = 0; i < validatedData.items.length; i++) {
        const item = validatedData.items[i]

        try {
          // Build dynamic INSERT query
          const fields = Object.keys(item).filter(
            (key) => item[key as keyof typeof item] !== undefined
          )
          const values = fields.map((key) => item[key as keyof typeof item])

          const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
          const fieldsList = fields.join(', ')

          const query = `
            INSERT INTO ios (${fieldsList}, created_at, updated_at)
            VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `

          const result = await client.query(query, values)

          if (result.rows[0]) {
            createdIds.push(result.rows[0].id)
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          errors.push({
            index: i,
            name: item.interface_name,
            error: errorMessage,
          })

          // If any creation fails, rollback entire transaction
          throw err
        }
      }

      // Commit transaction if all creates succeeded
      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        data: {
          created_count: createdIds.length,
          created_ids: createdIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Bulk create IOs error:', error)

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
        error: error instanceof Error ? error.message : 'Failed to bulk create IOs',
      },
      { status: 500 }
    )
  }
}
