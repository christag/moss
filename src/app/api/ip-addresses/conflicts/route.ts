/**
 * IP Address Conflicts Detection API
 *
 * GET /api/ip-addresses/conflicts
 * Detects and returns various types of IP address conflicts:
 * - Duplicate IPs (same IP assigned to multiple IOs)
 * - Out-of-range IPs (IP not within its network's subnet)
 * - DHCP conflicts (static IPs within DHCP range)
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { isIPInNetwork, parseCIDRString } from '@/lib/cidr-utils'

interface DuplicateIPConflict {
  type: 'duplicate'
  ip_address: string
  conflict_count: number
  assignments: Array<{
    ip_id: string
    io_id: string
    device_id: string | null
    device_name: string | null
    network_id: string
    network_name: string
  }>
}

interface OutOfRangeConflict {
  type: 'out_of_range'
  ip_id: string
  ip_address: string
  network_id: string
  network_name: string
  network_address: string
  device_id: string | null
  device_name: string | null
}

interface DHCPConflict {
  type: 'dhcp'
  ip_id: string
  ip_address: string
  network_id: string
  network_name: string
  dhcp_range_start: string
  dhcp_range_end: string
  device_id: string | null
  device_name: string | null
  assignment_type: string
}

type IPConflict = DuplicateIPConflict | OutOfRangeConflict | DHCPConflict

interface ConflictsResponse {
  success: boolean
  data: {
    conflicts: IPConflict[]
    summary: {
      total_conflicts: number
      duplicate_count: number
      out_of_range_count: number
      dhcp_conflict_count: number
    }
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ConflictsResponse | { success: false; message: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const conflictType = searchParams.get('type') // 'duplicate', 'out_of_range', 'dhcp', or null (all)
    const networkId = searchParams.get('network_id') // Optional filter by network

    const conflicts: IPConflict[] = []

    // 1. Detect duplicate IP addresses (same IP on multiple IOs)
    if (!conflictType || conflictType === 'duplicate') {
      const duplicateQuery = `
        SELECT
          ip.ip_address,
          COUNT(DISTINCT ip.id) as conflict_count,
          json_agg(
            json_build_object(
              'ip_id', ip.id,
              'io_id', ip.io_id,
              'device_id', d.id,
              'device_name', d.hostname,
              'network_id', ip.network_id,
              'network_name', n.network_name
            )
          ) as assignments
        FROM ip_addresses ip
        LEFT JOIN ios io ON ip.io_id = io.id
        LEFT JOIN devices d ON io.device_id = d.id
        LEFT JOIN networks n ON ip.network_id = n.id
        ${networkId ? 'WHERE ip.network_id = $1' : ''}
        GROUP BY ip.ip_address
        HAVING COUNT(DISTINCT ip.id) > 1
        ORDER BY conflict_count DESC, ip.ip_address
      `

      const duplicateResult = await query<{
        ip_address: string
        conflict_count: number
        assignments: Array<{
          ip_id: string
          io_id: string
          device_id: string | null
          device_name: string | null
          network_id: string
          network_name: string
        }>
      }>(duplicateQuery, networkId ? [networkId] : [])

      duplicateResult.rows.forEach((row) => {
        conflicts.push({
          type: 'duplicate',
          ip_address: row.ip_address,
          conflict_count: Number(row.conflict_count),
          assignments: row.assignments,
        })
      })
    }

    // 2. Detect out-of-range IPs (IP not within network's CIDR range)
    if (!conflictType || conflictType === 'out_of_range') {
      // Fetch all IP addresses with their network CIDR notation
      const outOfRangeQuery = `
        SELECT
          ip.id as ip_id,
          ip.ip_address,
          ip.network_id,
          n.network_name,
          n.network_address,
          d.id as device_id,
          d.hostname as device_name
        FROM ip_addresses ip
        JOIN networks n ON ip.network_id = n.id
        LEFT JOIN ios io ON ip.io_id = io.id
        LEFT JOIN devices d ON io.device_id = d.id
        WHERE n.network_address IS NOT NULL
        ${networkId ? 'AND ip.network_id = $1' : ''}
        ORDER BY ip.ip_address
      `

      const outOfRangeResult = await query<{
        ip_id: string
        ip_address: string
        network_id: string
        network_name: string
        network_address: string
        device_id: string | null
        device_name: string | null
      }>(outOfRangeQuery, networkId ? [networkId] : [])

      // Check each IP against its network's CIDR range
      outOfRangeResult.rows.forEach((row) => {
        const parsed = parseCIDRString(row.network_address)
        if (!parsed) return // Skip if CIDR notation is invalid

        const isInRange = isIPInNetwork(row.ip_address, parsed.ip, parsed.cidr)
        if (!isInRange) {
          conflicts.push({
            type: 'out_of_range',
            ip_id: row.ip_id,
            ip_address: row.ip_address,
            network_id: row.network_id,
            network_name: row.network_name,
            network_address: row.network_address,
            device_id: row.device_id,
            device_name: row.device_name,
          })
        }
      })
    }

    // 3. Detect DHCP conflicts (static IPs within DHCP range)
    if (!conflictType || conflictType === 'dhcp') {
      const dhcpConflictQuery = `
        SELECT
          ip.id as ip_id,
          ip.ip_address,
          ip.type as assignment_type,
          ip.network_id,
          n.network_name,
          n.dhcp_range_start,
          n.dhcp_range_end,
          d.id as device_id,
          d.hostname as device_name
        FROM ip_addresses ip
        JOIN networks n ON ip.network_id = n.id
        LEFT JOIN ios io ON ip.io_id = io.id
        LEFT JOIN devices d ON io.device_id = d.id
        WHERE n.dhcp_enabled = true
          AND n.dhcp_range_start IS NOT NULL
          AND n.dhcp_range_end IS NOT NULL
          AND ip.type != 'dhcp'
          AND ip.ip_address >= n.dhcp_range_start
          AND ip.ip_address <= n.dhcp_range_end
          ${networkId ? 'AND ip.network_id = $1' : ''}
        ORDER BY ip.ip_address
      `

      const dhcpConflictResult = await query<{
        ip_id: string
        ip_address: string
        assignment_type: string
        network_id: string
        network_name: string
        dhcp_range_start: string
        dhcp_range_end: string
        device_id: string | null
        device_name: string | null
      }>(dhcpConflictQuery, networkId ? [networkId] : [])

      dhcpConflictResult.rows.forEach((row) => {
        conflicts.push({
          type: 'dhcp',
          ip_id: row.ip_id,
          ip_address: row.ip_address,
          network_id: row.network_id,
          network_name: row.network_name,
          dhcp_range_start: row.dhcp_range_start,
          dhcp_range_end: row.dhcp_range_end,
          device_id: row.device_id,
          device_name: row.device_name,
          assignment_type: row.assignment_type,
        })
      })
    }

    // Calculate summary statistics
    const summary = {
      total_conflicts: conflicts.length,
      duplicate_count: conflicts.filter((c) => c.type === 'duplicate').length,
      out_of_range_count: conflicts.filter((c) => c.type === 'out_of_range').length,
      dhcp_conflict_count: conflicts.filter((c) => c.type === 'dhcp').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        conflicts,
        summary,
      },
    })
  } catch (error) {
    console.error('Error detecting IP conflicts:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to detect IP conflicts',
      },
      { status: 500 }
    )
  }
}
