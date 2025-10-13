/**
 * POST /api/networks/bulk
 * Bulk create networks (up to 100 per request)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db'
import { bulkInsert } from '@/lib/bulk/bulkInsert'
import { CreateManyNetworksSchema, NETWORK_COLUMNS } from '@/lib/schemas/network'
import { cache } from '@/lib/cache'
import type { Network } from '@/types'

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
    const validated = CreateManyNetworksSchema.parse(body)

    await client.query('BEGIN')
    const networks = await bulkInsert<Network>(
      'networks',
      NETWORK_COLUMNS as unknown as string[],
      validated,
      client
    )
    await client.query('COMMIT')

    cache.invalidatePattern('networks:list:*')

    return successResponse(
      { created: networks.length, items: networks },
      `Successfully created ${networks.length} ${networks.length === 1 ? 'network' : 'networks'}`,
      201
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error bulk creating networks:', error)

    if (error && typeof error === 'object' && 'errors' in error) {
      return errorResponse(`Validation failed: ${JSON.stringify(error)}`, 400)
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; detail?: string }
      if (dbError.code === '23505') return errorResponse('Duplicate entry detected', 409)
      if (dbError.code === '23503') return errorResponse('Foreign key constraint violation', 400)
    }

    return errorResponse(`Failed to create networks: ${error}`, 500)
  } finally {
    client.release()
  }
}
