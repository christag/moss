/**
 * Expiring Contracts API Route
 * Returns contracts expiring within specified days
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { Contract } from '@/types'

interface ExpiringContract extends Contract {
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

    // Query contracts with end dates approaching
    const result = await query<ExpiringContract>(
      `SELECT
        c.*,
        (c.end_date - CURRENT_DATE) as days_until_expiration
      FROM contracts c
      WHERE c.end_date IS NOT NULL
        AND c.end_date > CURRENT_DATE
        AND c.end_date <= CURRENT_DATE + INTERVAL '1 day' * $1
      ORDER BY c.end_date ASC
      LIMIT $2`,
      [days, limit]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('Error fetching expiring contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch expiring contracts' }, { status: 500 })
  }
}
