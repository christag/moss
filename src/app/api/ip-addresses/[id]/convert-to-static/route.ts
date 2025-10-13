/**
 * Convert DHCP IP to Static API
 *
 * POST /api/ip-addresses/[id]/convert-to-static
 * Converts a DHCP-type IP address to static type
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { IPAddress } from '@/types'

interface ConvertResponse {
  success: boolean
  message: string
  data?: IPAddress
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ConvertResponse>> {
  try {
    const { id } = await params
    const ipId = id

    // Fetch current IP address
    const ipResult = await query<IPAddress>('SELECT * FROM ip_addresses WHERE id = $1', [ipId])

    if (ipResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'IP address not found' }, { status: 404 })
    }

    const ip = ipResult.rows[0]

    // Check if IP is already static
    if (ip.type === 'static') {
      return NextResponse.json(
        { success: false, message: 'IP address is already static' },
        { status: 400 }
      )
    }

    // Check if IP is reserved
    if (ip.type === 'reserved') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot convert reserved IP to static. Assign it to a device first.',
        },
        { status: 400 }
      )
    }

    // Update IP type to static
    const updateResult = await query<IPAddress>(
      `UPDATE ip_addresses
       SET type = 'static', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [ipId]
    )

    const updatedIP = updateResult.rows[0]

    return NextResponse.json({
      success: true,
      message: `IP address ${updatedIP.ip_address} converted to static`,
      data: updatedIP,
    })
  } catch (error) {
    console.error('Error converting IP to static:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to convert IP to static',
      },
      { status: 500 }
    )
  }
}
