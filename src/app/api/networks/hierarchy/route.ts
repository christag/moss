/**
 * Network Hierarchy API
 *
 * GET /api/networks/hierarchy
 * Returns network hierarchy tree with utilization data
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Network } from '@/types'

interface NetworkWithUtilization extends Network {
  utilization_percent: number
  allocated_count: number
  total_hosts: number
  children?: NetworkWithUtilization[]
}

interface HierarchyResponse {
  success: boolean
  data: {
    root_networks: NetworkWithUtilization[]
    total_count: number
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<HierarchyResponse | { success: false; message: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get('location_id')

    // Fetch all networks with their utilization
    let networksQuery = `
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
    `

    const params: (string | number)[] = []
    if (locationId) {
      networksQuery += ' WHERE n.location_id = $1'
      params.push(locationId)
    }

    networksQuery += `
      GROUP BY n.id
      ORDER BY n.network_name
    `

    const result = await query<NetworkWithUtilization>(networksQuery, params)
    const networks = result.rows

    // Calculate utilization percentage
    networks.forEach((network) => {
      const usableHosts = network.total_hosts > 2 ? network.total_hosts - 2 : network.total_hosts
      network.utilization_percent =
        usableHosts > 0 ? Math.round((network.allocated_count / usableHosts) * 100 * 10) / 10 : 0
    })

    // Build hierarchy tree
    const networkMap = new Map<string, NetworkWithUtilization>()
    const rootNetworks: NetworkWithUtilization[] = []

    // First pass: create map
    networks.forEach((network) => {
      network.children = []
      networkMap.set(network.id, network)
    })

    // Second pass: build tree
    networks.forEach((network) => {
      if (network.parent_network_id && networkMap.has(network.parent_network_id)) {
        const parent = networkMap.get(network.parent_network_id)!
        parent.children!.push(network)
      } else {
        rootNetworks.push(network)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        root_networks: rootNetworks,
        total_count: networks.length,
      },
    })
  } catch (error) {
    console.error('Error fetching network hierarchy:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch network hierarchy',
      },
      { status: 500 }
    )
  }
}
