/**
 * Network IOs API Routes
 * Get all IOs (interfaces/ports) associated with a specific network
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { IO } from '@/types'

/**
 * GET /api/networks/[id]/ios
 * Retrieve all IOs connected to a specific network
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Verify network exists
    const networkCheck = await query('SELECT id FROM networks WHERE id = $1', [id])

    if (networkCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network not found',
        },
        { status: 404 }
      )
    }

    // Fetch all IOs with this network as their native network
    // Also fetch IOs that have this network in their tagged networks (trunk ports)
    const result = await query<IO>(
      `
      SELECT DISTINCT i.*
      FROM ios i
      LEFT JOIN io_tagged_networks itn ON itn.io_id = i.id
      WHERE i.native_network_id = $1
         OR itn.network_id = $1
      ORDER BY i.interface_name ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'IOs retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching network IOs:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch network IOs',
      },
      { status: 500 }
    )
  }
}
