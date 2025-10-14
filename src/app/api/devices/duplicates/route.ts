/**
 * Device Duplicates List API
 * GET /api/devices/duplicates - List all devices with potential duplicates
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api'
import { findAllDevicesWithDuplicates } from '@/lib/deviceMatching'

export async function GET(_request: NextRequest) {
  try {
    const devicesWithDuplicates = await findAllDevicesWithDuplicates()

    return successResponse(
      {
        total_count: devicesWithDuplicates.length,
        devices: devicesWithDuplicates,
      },
      `Found ${devicesWithDuplicates.length} devices with potential duplicates`
    )
  } catch (error) {
    console.error('[API] Error finding devices with duplicates:', error)
    return errorResponse('Failed to find devices with duplicates', error, 500)
  }
}
