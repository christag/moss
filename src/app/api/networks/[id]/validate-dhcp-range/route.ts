/**
 * DHCP Range Validation API
 *
 * POST /api/networks/[id]/validate-dhcp-range
 * Validates that a DHCP range is within the network's subnet and doesn't overlap with static IPs
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseCIDRString, isIPInNetwork } from '@/lib/cidr-utils'
import type { Network, IPAddress } from '@/types'
import { z } from 'zod'

const DHCPRangeSchema = z.object({
  dhcp_range_start: z.string().min(7),
  dhcp_range_end: z.string().min(7),
})

interface ValidationResponse {
  success: boolean
  valid: boolean
  errors?: string[]
  warnings?: string[]
  conflicts?: Array<{
    ip_address: string
    type: string
    device_name?: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ValidationResponse>> {
  try {
    const networkId = params.id
    const body = await request.json()

    // Validate input
    const validation = DHCPRangeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: validation.error.errors.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    const { dhcp_range_start, dhcp_range_end } = validation.data

    // Fetch network details
    const networkResult = await query<Network>('SELECT * FROM networks WHERE id = $1', [networkId])

    if (networkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, valid: false, errors: ['Network not found'] },
        { status: 404 }
      )
    }

    const network = networkResult.rows[0]

    const errors: string[] = []
    const warnings: string[] = []

    // Validate network has CIDR notation
    if (!network.network_address) {
      errors.push('Network does not have a network address defined')
      return NextResponse.json({ success: true, valid: false, errors })
    }

    // Parse CIDR notation
    const parsed = parseCIDRString(network.network_address)
    if (!parsed) {
      errors.push('Invalid network address format')
      return NextResponse.json({ success: true, valid: false, errors })
    }

    // Validate start IP is within subnet
    if (!isIPInNetwork(dhcp_range_start, parsed.ip, parsed.cidr)) {
      errors.push(`Start IP ${dhcp_range_start} is not within subnet ${network.network_address}`)
    }

    // Validate end IP is within subnet
    if (!isIPInNetwork(dhcp_range_end, parsed.ip, parsed.cidr)) {
      errors.push(`End IP ${dhcp_range_end} is not within subnet ${network.network_address}`)
    }

    // Validate start < end
    if (dhcp_range_start >= dhcp_range_end) {
      errors.push('Start IP must be less than end IP')
    }

    // Check for conflicts with existing static IPs
    const conflictQuery = `
      SELECT ip.ip_address, ip.type, d.device_name
      FROM ip_addresses ip
      LEFT JOIN ios io ON ip.io_id = io.id
      LEFT JOIN devices d ON io.device_id = d.id
      WHERE ip.network_id = $1
        AND ip.type != 'dhcp'
        AND ip.ip_address >= $2
        AND ip.ip_address <= $3
      ORDER BY ip.ip_address
    `

    const conflictResult = await query<IPAddress & { device_name?: string }>(conflictQuery, [
      networkId,
      dhcp_range_start,
      dhcp_range_end,
    ])

    const conflicts = conflictResult.rows

    if (conflicts.length > 0) {
      warnings.push(
        `${conflicts.length} existing static/reserved IP(s) are within this DHCP range and may cause conflicts`
      )
    }

    // If there are errors, return invalid
    if (errors.length > 0) {
      return NextResponse.json({
        success: true,
        valid: false,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      })
    }

    // Valid range
    return NextResponse.json({
      success: true,
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    })
  } catch (error) {
    console.error('Error validating DHCP range:', error)
    return NextResponse.json(
      {
        success: false,
        valid: false,
        errors: [error instanceof Error ? error.message : 'Failed to validate DHCP range'],
      },
      { status: 500 }
    )
  }
}
