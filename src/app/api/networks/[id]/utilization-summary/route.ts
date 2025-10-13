/**
 * Network Utilization Summary API
 *
 * GET /api/networks/[id]/utilization-summary
 * Returns breakdown of IP allocation types for a network
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateIPsInSubnet, parseCIDRString } from '@/lib/cidr-utils'
import type { Network, IPAddress } from '@/types'

interface UtilizationSummary {
  allocated: number
  dhcp_pool: number
  reserved: number
  available: number
  total_hosts: number
}

interface UtilizationSummaryResponse {
  success: boolean
  data: UtilizationSummary
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UtilizationSummaryResponse | { success: false; message: string }>> {
  try {
    const { id } = await params
    const networkId = id

    // Fetch network details
    const networkResult = await query<Network>('SELECT * FROM networks WHERE id = $1', [networkId])

    if (networkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Network not found' }, { status: 404 })
    }

    const network = networkResult.rows[0]

    // Validate network has CIDR notation
    if (!network.network_address) {
      return NextResponse.json(
        { success: false, message: 'Network does not have a network address defined' },
        { status: 400 }
      )
    }

    // Parse CIDR notation
    const parsed = parseCIDRString(network.network_address)
    if (!parsed) {
      return NextResponse.json(
        { success: false, message: 'Invalid network address format' },
        { status: 400 }
      )
    }

    // Generate all IPs in subnet
    let allIPs: string[]
    try {
      allIPs = generateIPsInSubnet(parsed.ip, parsed.cidr)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      return NextResponse.json(
        { success: false, message: 'Unable to generate IP list for this subnet size' },
        { status: 400 }
      )
    }

    // Fetch all allocated IPs in this network
    const allocatedIPsResult = await query<IPAddress>(
      'SELECT ip_address, type FROM ip_addresses WHERE network_id = $1',
      [networkId]
    )

    const allocatedIPs = allocatedIPsResult.rows

    // Count allocated and reserved IPs
    const allocatedCount = allocatedIPs.filter((ip) => ip.type !== 'reserved').length
    const reservedCount = allocatedIPs.filter((ip) => ip.type === 'reserved').length

    // Calculate DHCP pool size
    let dhcpPoolSize = 0
    if (network.dhcp_enabled && network.dhcp_range_start && network.dhcp_range_end) {
      // Simple count: iterate through all IPs and check if in DHCP range
      dhcpPoolSize = allIPs.filter((ip) => {
        return ip >= network.dhcp_range_start! && ip <= network.dhcp_range_end!
      }).length
    }

    // Calculate available IPs
    const totalHosts = allIPs.length
    const usableHosts = totalHosts - 2 // Exclude network and broadcast
    const availableCount =
      usableHosts - allocatedCount - reservedCount - (network.dhcp_enabled ? dhcpPoolSize : 0)

    return NextResponse.json({
      success: true,
      data: {
        allocated: allocatedCount,
        dhcp_pool: dhcpPoolSize,
        reserved: reservedCount,
        available: Math.max(availableCount, 0),
        total_hosts: totalHosts,
      },
    })
  } catch (error) {
    console.error('Error fetching utilization summary:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch utilization summary',
      },
      { status: 500 }
    )
  }
}
