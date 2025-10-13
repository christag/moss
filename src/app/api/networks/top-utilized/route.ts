/**
 * Top Utilized Networks API
 *
 * GET /api/networks/top-utilized
 * Returns networks sorted by utilization percentage (highest first)
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Network } from '@/types'

interface NetworkWithUtilization extends Network {
  utilization_percent: number
  allocated_count: number
  total_hosts: number
}

interface TopUtilizedResponse {
  success: boolean
  data: NetworkWithUtilization[]
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<TopUtilizedResponse | { success: false; message: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Fetch networks with their utilization, sorted by percentage
    const networksQuery = `
      SELECT
        n.*,
        COUNT(DISTINCT ip.id) as allocated_count,
        CASE
          WHEN n.network_address IS NOT NULL THEN
            -- Calculate total hosts from CIDR
            POWER(2, 32 - CAST(SPLIT_PART(n.network_address, '/', 2) AS INTEGER))::INTEGER
          ELSE 0
        END as total_hosts
      FROM networks n
      LEFT JOIN ip_addresses ip ON ip.network_id = n.id
      WHERE n.network_address IS NOT NULL
      GROUP BY n.id
      HAVING COUNT(DISTINCT ip.id) > 0
      ORDER BY
        (COUNT(DISTINCT ip.id)::FLOAT /
         NULLIF(POWER(2, 32 - CAST(SPLIT_PART(n.network_address, '/', 2) AS INTEGER))::INTEGER - 2, 0)
        ) DESC
      LIMIT $1
    `

    const result = await query<NetworkWithUtilization>(networksQuery, [limit])
    const networks = result.rows

    // Calculate utilization percentage
    networks.forEach((network) => {
      const usableHosts = network.total_hosts > 2 ? network.total_hosts - 2 : network.total_hosts
      network.utilization_percent =
        usableHosts > 0 ? Math.round((network.allocated_count / usableHosts) * 100 * 10) / 10 : 0
    })

    return NextResponse.json({
      success: true,
      data: networks,
    })
  } catch (error) {
    console.error('Error fetching top utilized networks:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch top utilized networks',
      },
      { status: 500 }
    )
  }
}
