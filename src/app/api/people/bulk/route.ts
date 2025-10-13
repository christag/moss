/**
 * POST /api/people/bulk
 * Bulk create people (up to 100 per request)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db'
import { bulkInsert } from '@/lib/bulk/bulkInsert'
import { CreateManyPeopleSchema, PERSON_COLUMNS } from '@/lib/schemas/person'
import { cache } from '@/lib/cache'
import type { Person } from '@/types'

/**
 * Error response helper
 */
function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

/**
 * Success response helper
 */
function successResponse(data: unknown, message: string = 'Success', status: number = 201) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    // Parse request body
    const body = await request.json()

    // Validate with Zod
    const validated = CreateManyPeopleSchema.parse(body)

    // Start transaction
    await client.query('BEGIN')

    // Bulk insert people
    const people = await bulkInsert<Person>(
      'people',
      PERSON_COLUMNS as unknown as string[],
      validated,
      client
    )

    // Commit transaction
    await client.query('COMMIT')

    // Invalidate cache
    cache.invalidatePattern('people:list:*')

    return successResponse(
      {
        created: people.length,
        items: people,
      },
      `Successfully created ${people.length} ${people.length === 1 ? 'person' : 'people'}`,
      201
    )
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK')

    console.error('Error bulk creating people:', error)

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'errors' in error) {
      return errorResponse(`Validation failed: ${JSON.stringify(error)}`, 400)
    }

    // Handle database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; detail?: string }
      if (dbError.code === '23505') {
        return errorResponse('Duplicate entry detected', 409)
      }
      if (dbError.code === '23503') {
        return errorResponse('Foreign key constraint violation', 400)
      }
    }

    return errorResponse(`Failed to create people: ${error}`, 500)
  } finally {
    client.release()
  }
}
