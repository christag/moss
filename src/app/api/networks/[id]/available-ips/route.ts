/**
 * Available IPs API
 *
 * GET /api/networks/[id]/available-ips
 * Returns list of available IPs in a network, excluding allocated, reserved, and DHCP pool
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateIPsInSubnet, parseCIDRString } from '@/lib/cidr-utils'
import type { Network, IPAddress } from '@/types'

interface AvailableIPsResponse {
  success: boolean
  data: {
    network: Network
    available_ips: Array<{
      ip_address: string
      is_gateway: boolean
      is_broadcast: boolean
    }>
    next_available: string | null
    total_available: number
    subnet_info: {
      network_address: string
      cidr_notation: number
      total_hosts: number
      usable_hosts: number
      utilization_percent: number
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AvailableIPsResponse | { success: false; message: string }>> {
  try {
    const networkId = params.id
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

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
        {
          success: false,
          message:
            'Invalid network address format. Must be in CIDR notation (e.g., 192.168.1.0/24)',
        },
        { status: 400 }
      )
    }

    // Only support /24 or smaller subnets
    if (parsed.cidr < 24) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subnet too large. Only /24 to /32 subnets are supported.',
        },
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
      'SELECT ip_address FROM ip_addresses WHERE network_id = $1',
      [networkId]
    )

    const allocatedSet = new Set(allocatedIPsResult.rows.map((row) => row.ip_address))

    // Determine DHCP range
    const dhcpRange =
      network.dhcp_enabled && network.dhcp_range_start && network.dhcp_range_end
        ? { start: network.dhcp_range_start, end: network.dhcp_range_end }
        : null

    // Helper to check if IP is in DHCP range
    const isIPInDHCPRange = (ip: string): boolean => {
      if (!dhcpRange) return false
      return ip >= dhcpRange.start && ip <= dhcpRange.end
    }

    // Calculate subnet info
    const totalHosts = allIPs.length
    const usableHosts = totalHosts - 2 // Exclude network and broadcast
    const allocatedCount = allocatedSet.size
    const utilizationPercent = usableHosts > 0 ? (allocatedCount / usableHosts) * 100 : 0

    // Get gateway (first usable IP) and broadcast (last IP)
    const gatewayIP = allIPs[0]
    const broadcastIP = allIPs[allIPs.length - 1]

    // Filter available IPs (exclude allocated, DHCP range, gateway, broadcast)
    const availableIPs = allIPs
      .filter((ip) => {
        // Exclude allocated IPs
        if (allocatedSet.has(ip)) return false
        // Exclude DHCP range
        if (isIPInDHCPRange(ip)) return false
        // Exclude gateway and broadcast
        if (ip === gatewayIP || ip === broadcastIP) return false
        return true
      })
      .slice(0, limit)
      .map((ip) => ({
        ip_address: ip,
        is_gateway: ip === gatewayIP,
        is_broadcast: ip === broadcastIP,
      }))

    // Find next available IP (first in the list)
    const nextAvailable = availableIPs.length > 0 ? availableIPs[0].ip_address : null

    return NextResponse.json({
      success: true,
      data: {
        network,
        available_ips: availableIPs,
        next_available: nextAvailable,
        total_available: availableIPs.length,
        subnet_info: {
          network_address: network.network_address,
          cidr_notation: parsed.cidr,
          total_hosts: totalHosts,
          usable_hosts: usableHosts,
          utilization_percent: Math.round(utilizationPercent * 10) / 10,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching available IPs:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch available IPs',
      },
      { status: 500 }
    )
  }
}
