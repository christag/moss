/**
 * Expiring Warranties API Route
 * Returns devices with warranties expiring within specified days
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { Device } from '@/types'

interface ExpiringWarranty extends Device {
  days_until_expiration: number
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

    // Query devices with warranties expiring within specified days
    const result = await query<ExpiringWarranty>(
      `SELECT
        d.*,
        d.hostname as device_name,
        (d.warranty_expiration - CURRENT_DATE) as days_until_expiration
      FROM devices d
      WHERE d.warranty_expiration IS NOT NULL
        AND d.warranty_expiration > CURRENT_DATE
        AND d.warranty_expiration <= CURRENT_DATE + INTERVAL '1 day' * $1
      ORDER BY d.warranty_expiration ASC
      LIMIT $2`,
      [days, limit]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('Error fetching expiring warranties:', error)
    return NextResponse.json({ error: 'Failed to fetch expiring warranties' }, { status: 500 })
  }
}
