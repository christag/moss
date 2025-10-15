/**
 * Device Duplicates API
 * GET /api/devices/[id]/duplicates - Find potential duplicate devices
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api'
import { findPotentialDuplicates } from '@/lib/deviceMatching'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return errorResponse('Invalid device ID format', undefined, 400)
    }

    // Find potential duplicates
    const result = await findPotentialDuplicates(id)

    return successResponse(
      {
        device_id: result.device_id,
        has_matches: result.has_matches,
        match_count: result.matches.length,
        highest_confidence: result.highest_confidence,
        matches: result.matches,
      },
      'Duplicate search completed'
    )
  } catch (error) {
    console.error('[API] Error finding duplicates:', error)
    return errorResponse('Failed to find duplicates', error, 500)
  }
}
