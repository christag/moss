/**
 * MCP Resources - Network Topology
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getPool } from '@/lib/db'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerTopologyResources(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('resources/read', async (request) => {
    if (request.params.uri !== 'resource://moss/network/topology') return

    requireScope(authContext, 'mcp:resources')

    const pool = getPool()

    // Get all IO connections for topology visualization
    const result = await pool.query(`
      SELECT
        io1.id as source_id,
        io1.io_name as source_name,
        d1.device_name as source_device,
        io2.id as target_id,
        io2.io_name as target_name,
        d2.device_name as target_device,
        io1.interface_type,
        io1.speed
      FROM ios io1
      JOIN devices d1 ON io1.device_id = d1.id
      LEFT JOIN ios io2 ON io1.connected_to_io_id = io2.id
      LEFT JOIN devices d2 ON io2.device_id = d2.id
      WHERE io1.connected_to_io_id IS NOT NULL
      LIMIT 200
    `)

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              connections: result.rows,
              total: result.rows.length,
            },
            null,
            2
          ),
        },
      ],
    }
  })
}
