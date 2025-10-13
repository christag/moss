/**
 * POST /api/rooms/bulk
 * Bulk create rooms (up to 100 per request)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db'
import { bulkInsert } from '@/lib/bulk/bulkInsert'
import { CreateManyRoomsSchema, ROOM_COLUMNS } from '@/lib/schemas/room'
import { cache } from '@/lib/cache'
import type { Room } from '@/types'

function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function successResponse(data: unknown, message: string = 'Success', status: number = 201) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const body = await request.json()
    const validated = CreateManyRoomsSchema.parse(body)

    await client.query('BEGIN')
    const rooms = await bulkInsert<Room>(
      'rooms',
      ROOM_COLUMNS as unknown as string[],
      validated,
      client
    )
    await client.query('COMMIT')

    cache.invalidatePattern('rooms:list:*')

    return successResponse(
      { created: rooms.length, items: rooms },
      `Successfully created ${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'}`,
      201
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error bulk creating rooms:', error)

    if (error && typeof error === 'object' && 'errors' in error) {
      return errorResponse(`Validation failed: ${JSON.stringify(error)}`, 400)
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; detail?: string }
      if (dbError.code === '23505') return errorResponse('Duplicate entry detected', 409)
      if (dbError.code === '23503') return errorResponse('Foreign key constraint violation', 400)
    }

    return errorResponse(`Failed to create rooms: ${error}`, 500)
  } finally {
    client.release()
  }
}
