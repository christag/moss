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
    // Calculate seat utilization from person and group assignments
    const result = await query<ExpiringLicense>(
      `SELECT
        sl.*,
        (sl.expiration_date - CURRENT_DATE) as days_until_expiration,
        COALESCE(
          (SELECT COUNT(DISTINCT person_id) FROM person_software_licenses WHERE license_id = sl.id) +
          (SELECT COUNT(DISTINCT group_id) FROM group_software_licenses WHERE license_id = sl.id),
          0
        ) as seats_used,
        CASE
          WHEN sl.total_seats IS NOT NULL AND sl.total_seats > 0
          THEN ROUND(
            (
              COALESCE(
                (SELECT COUNT(DISTINCT person_id) FROM person_software_licenses WHERE license_id = sl.id) +
                (SELECT COUNT(DISTINCT group_id) FROM group_software_licenses WHERE license_id = sl.id),
                0
              )::numeric / sl.total_seats::numeric
            ) * 100,
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
