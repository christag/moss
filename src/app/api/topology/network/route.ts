/**
 * Network Topology API Route
 * Handles fetching network topology data for visualization
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { TopologyFilterSchema } from '@/lib/schemas/topology'
import { auth } from '@/lib/auth'
import type { TopologyGraph } from '@/lib/schemas/topology'

/**
 * GET /api/topology/network
 * Fetch network topology graph data with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = TopologyFilterSchema.parse(params)

    const { location_id, device_id, network_id } = validatedParams

    // Build dynamic WHERE clause for filters
    const filterConditions: string[] = []
    const filterValues: (string | null)[] = []
    let paramIndex = 1

    if (location_id) {
      filterConditions.push(`d.location_id = $${paramIndex}`)
      filterValues.push(location_id)
      paramIndex++
    }

    if (network_id) {
      filterConditions.push(`ios.native_network_id = $${paramIndex}`)
      filterValues.push(network_id)
      paramIndex++
    }

    // If device_id is specified, we need to handle depth filtering differently
    // For now, we'll implement basic filtering and can add depth logic later
    if (device_id) {
      filterConditions.push(
        `(d.id = $${paramIndex} OR d.id IN (
          SELECT DISTINCT d2.id FROM devices d2
          INNER JOIN ios io2 ON d2.id = io2.device_id
          WHERE io2.connected_to_io_id IN (
            SELECT id FROM ios WHERE device_id = $${paramIndex}
          )
        ))`
      )
      filterValues.push(device_id)
      paramIndex++
    }

    const filterClause =
      filterConditions.length > 0 ? `AND (${filterConditions.join(' AND ')})` : ''

    // Query to build topology graph
    const topologyQuery = `
      WITH connected_ios AS (
        SELECT
          ios.id,
          ios.device_id,
          ios.interface_name,
          ios.interface_type,
          ios.speed,
          ios.trunk_mode,
          ios.native_network_id,
          ios.connected_to_io_id,
          d.hostname,
          d.device_type,
          d.location_id,
          d.status as device_status,
          l.location_name,
          n.network_name
        FROM ios
        INNER JOIN devices d ON ios.device_id = d.id
        LEFT JOIN locations l ON d.location_id = l.id
        LEFT JOIN networks n ON ios.native_network_id = n.id
        WHERE ios.connected_to_io_id IS NOT NULL
          ${filterClause}
      ),
      -- Get all unique devices involved in connections
      device_nodes AS (
        SELECT DISTINCT
          d.id,
          COALESCE(d.hostname, 'Unknown Device') as label,
          d.device_type,
          d.location_id,
          l.location_name,
          d.status,
          COUNT(DISTINCT ios.id) as io_count,
          COUNT(DISTINCT ios.connected_to_io_id) as connection_count
        FROM devices d
        LEFT JOIN locations l ON d.location_id = l.id
        LEFT JOIN ios ON d.id = ios.device_id
        WHERE d.id IN (
          SELECT DISTINCT device_id FROM connected_ios
          UNION
          SELECT DISTINCT (SELECT device_id FROM ios WHERE id = connected_to_io_id)
          FROM connected_ios
          WHERE connected_to_io_id IS NOT NULL
        )
        GROUP BY d.id, d.hostname, d.device_type, d.location_id, l.location_name, d.status
      ),
      -- Build edges from IO connections
      connection_edges AS (
        SELECT
          io1.id as edge_id,
          io1.device_id as source,
          io2.device_id as target,
          io1.interface_name || ' <-> ' || io2.interface_name as label,
          io1.interface_type,
          io1.speed,
          io1.id as source_io_id,
          io2.id as target_io_id,
          io1.trunk_mode,
          io1.native_network_id,
          n.network_name
        FROM ios io1
        INNER JOIN ios io2 ON io1.connected_to_io_id = io2.id
        LEFT JOIN networks n ON io1.native_network_id = n.id
        WHERE io1.connected_to_io_id IS NOT NULL
          AND io1.device_id IN (SELECT id FROM device_nodes)
          AND io2.device_id IN (SELECT id FROM device_nodes)
      )
      SELECT
        json_build_object(
          'nodes', (SELECT COALESCE(json_agg(row_to_json(device_nodes.*)), '[]'::json) FROM device_nodes),
          'edges', (SELECT COALESCE(json_agg(row_to_json(connection_edges.*)), '[]'::json) FROM connection_edges),
          'metadata', json_build_object(
            'total_devices', (SELECT COUNT(*) FROM device_nodes),
            'total_connections', (SELECT COUNT(*) FROM connection_edges),
            'location_id', $${paramIndex}::uuid,
            'generated_at', NOW()
          )
        ) as topology_data
    `

    filterValues.push(location_id || null)

    const result = await query<{ topology_data: TopologyGraph }>(topologyQuery, filterValues)

    if (!result.rows[0]?.topology_data) {
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          edges: [],
          metadata: {
            total_devices: 0,
            total_connections: 0,
            location_id: location_id || null,
            generated_at: new Date().toISOString(),
          },
        },
        message: 'No topology data found',
      })
    }

    const topologyData = result.rows[0].topology_data

    return NextResponse.json({
      success: true,
      data: topologyData,
      message: `Retrieved topology with ${topologyData.nodes.length} devices and ${topologyData.edges.length} connections`,
    })
  } catch (error) {
    console.error('Error fetching network topology:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch network topology',
      },
      { status: 500 }
    )
  }
}
