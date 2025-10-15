/**
 * Expiring Licenses API Route
 * Returns software licenses expiring within specified days with seat utilization
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { SoftwareLicense } from '@/types'

interface ExpiringLicense extends SoftwareLicense {
  days_until_expiration: number
  seats_used: number
  utilization_percentage: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Query licenses with expiration dates approaching
    // Calculate seat utilization from person assignments
    const result = await query<ExpiringLicense>(
      `SELECT
        sl.*,
        (sl.expiration_date - CURRENT_DATE) as days_until_expiration,
        COALESCE(sl.seats_used, 0) as seats_used,
        CASE
          WHEN sl.seat_count IS NOT NULL AND sl.seat_count > 0
          THEN ROUND(
            (COALESCE(sl.seats_used, 0)::numeric / sl.seat_count::numeric) * 100,
            2
          )
          ELSE 0
        END as utilization_percentage
      FROM software_licenses sl
      WHERE sl.expiration_date IS NOT NULL
        AND sl.expiration_date > CURRENT_DATE
        AND sl.expiration_date <= CURRENT_DATE + INTERVAL '1 day' * $1
      ORDER BY sl.expiration_date ASC
      LIMIT $2`,
      [days, limit]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('Error fetching expiring licenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expiring licenses' }, { status: 500 })
  }
}
