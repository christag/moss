/**
 * Network IP Utilization API
 *
 * GET /api/networks/[id]/ip-utilization
 * Returns subnet information and IP allocation status for visualization
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { calculateCIDR, parseCIDRString, generateIPsInSubnet } from '@/lib/cidr-utils'
import type { Network, IPAddress } from '@/types'

interface IPAllocation {
  ip_address: string
  status: 'allocated' | 'reserved' | 'dhcp' | 'available'
  io_id?: string
  device_id?: string
  device_name?: string
  dns_name?: string
  type?: string
  assignment_date?: string
}

interface SubnetInfo {
  network_address: string
  broadcast_address: string
  cidr_notation: number
  subnet_mask: string
  first_usable_ip: string
  last_usable_ip: string
  total_hosts: number
  usable_hosts: number
  allocated_count: number
  reserved_count: number
  dhcp_count: number
  available_count: number
  utilization_percent: number
}

interface IPUtilizationResponse {
  success: boolean
  data: {
    network: Network
    subnet_info: SubnetInfo
    ip_allocations: IPAllocation[]
    dhcp_range: {
      start: string
      end: string
    } | null
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<IPUtilizationResponse | { success: false; message: string }>> {
  try {
    const { id } = await params
    const networkId = id

    // Fetch network details
    const networkResult = await query<Network>('SELECT * FROM networks WHERE id = $1', [networkId])

    if (networkResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Network not found' }, { status: 404 })
    }

    const network = networkResult.rows[0]

    // Check if network has a valid CIDR notation
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

    // Safety check - only support /24 or smaller subnets for full visualization
    if (parsed.cidr < 24) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subnet too large for visualization. Only /24 to /32 subnets are supported.',
        },
        { status: 400 }
      )
    }

    // Calculate subnet information
    const calculation = calculateCIDR(parsed.ip, parsed.cidr)

    // Fetch all IP addresses assigned to this network
    const ipResult = await query<
      IPAddress & { device_id: string | null; device_name: string | null }
    >(
      `
      SELECT
        ip.id,
        ip.ip_address,
        ip.type,
        ip.dns_name,
        ip.io_id,
        ip.assignment_date,
        d.id as device_id,
        d.hostname as device_name
      FROM ip_addresses ip
      LEFT JOIN ios io ON ip.io_id = io.id
      LEFT JOIN devices d ON io.device_id = d.id
      WHERE ip.network_id = $1
      ORDER BY ip.ip_address
      `,
      [networkId]
    )

    // Generate all IPs in the subnet
    let allIPs: string[]
    try {
      allIPs = generateIPsInSubnet(calculation.networkAddress, parsed.cidr)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      return NextResponse.json(
        { success: false, message: 'Unable to generate IP list for this subnet size' },
        { status: 400 }
      )
    }

    // Create a map of allocated IPs for quick lookup
    const allocatedIPMap = new Map<
      string,
      IPAddress & { device_id: string | null; device_name: string | null }
    >()
    ipResult.rows.forEach((ip) => {
      allocatedIPMap.set(ip.ip_address, ip)
    })

    // Determine DHCP range (if enabled)
    const dhcpRange =
      network.dhcp_enabled && network.dhcp_range_start && network.dhcp_range_end
        ? { start: network.dhcp_range_start, end: network.dhcp_range_end }
        : null

    // Helper function to check if IP is in DHCP range
    const isIPInDHCPRange = (ip: string): boolean => {
      if (!dhcpRange) return false

      // Simple string comparison works for IPs in same subnet
      return ip >= dhcpRange.start && ip <= dhcpRange.end
    }

    // Build IP allocation list with status
    const ipAllocations: IPAllocation[] = allIPs.map((ip) => {
      const allocated = allocatedIPMap.get(ip)

      if (allocated) {
        return {
          ip_address: ip,
          status: 'allocated',
          io_id: allocated.io_id || undefined,
          device_id: allocated.device_id || undefined,
          device_name: allocated.device_name || undefined,
          dns_name: allocated.dns_name || undefined,
          type: allocated.type || undefined,
          assignment_date: allocated.assignment_date
            ? new Date(allocated.assignment_date).toISOString()
            : undefined,
        }
      }

      // Check if it's a reserved IP (first usable = gateway, last usable = reserved)
      if (ip === calculation.firstUsableIP || ip === calculation.lastUsableIP) {
        return {
          ip_address: ip,
          status: 'reserved',
        }
      }

      // Check if it's in DHCP range
      if (isIPInDHCPRange(ip)) {
        return {
          ip_address: ip,
          status: 'dhcp',
        }
      }

      return {
        ip_address: ip,
        status: 'available',
      }
    })

    // Calculate utilization statistics
    const allocated_count = ipAllocations.filter((ip) => ip.status === 'allocated').length
    const reserved_count = ipAllocations.filter((ip) => ip.status === 'reserved').length
    const dhcp_count = ipAllocations.filter((ip) => ip.status === 'dhcp').length
    const available_count = ipAllocations.filter((ip) => ip.status === 'available').length

    const utilization_percent =
      calculation.usableHosts > 0 ? (allocated_count / calculation.usableHosts) * 100 : 0

    const subnetInfo: SubnetInfo = {
      network_address: calculation.networkAddress,
      broadcast_address: calculation.broadcastAddress,
      cidr_notation: calculation.cidrNotation,
      subnet_mask: calculation.subnetMask,
      first_usable_ip: calculation.firstUsableIP,
      last_usable_ip: calculation.lastUsableIP,
      total_hosts: calculation.totalHosts,
      usable_hosts: calculation.usableHosts,
      allocated_count,
      reserved_count,
      dhcp_count,
      available_count,
      utilization_percent: Math.round(utilization_percent * 10) / 10, // Round to 1 decimal
    }

    return NextResponse.json({
      success: true,
      data: {
        network,
        subnet_info: subnetInfo,
        ip_allocations: ipAllocations,
        dhcp_range: dhcpRange,
      },
    })
  } catch (error) {
    console.error('Error fetching IP utilization:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch IP utilization',
      },
      { status: 500 }
    )
  }
}
