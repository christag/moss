// @ts-nocheck
/**
 * MCP Tools for Network Management
 */

import { z } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getPool } from '@/lib/db'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerNetworkTools(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'get_network_topology') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      location_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    // Get IO connectivity
    let query = `
      SELECT
        io1.id as source_io_id,
        io1.io_name as source_io_name,
        d1.device_name as source_device_name,
        d1.id as source_device_id,
        io2.id as target_io_id,
        io2.io_name as target_io_name,
        d2.device_name as target_device_name,
        d2.id as target_device_id,
        io1.interface_type,
        io1.speed
      FROM ios io1
      JOIN devices d1 ON io1.device_id = d1.id
      LEFT JOIN ios io2 ON io1.connected_to_io_id = io2.id
      LEFT JOIN devices d2 ON io2.device_id = d2.id
      WHERE io1.connected_to_io_id IS NOT NULL
    `
    const params: string[] = []

    if (args.location_id) {
      query += ` AND (d1.location_id = $1 OR d2.location_id = $1)`
      params.push(args.location_id)
    }

    query += ` LIMIT ${args.limit}`

    const result = await pool.query(query, params)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total_connections: result.rows.length,
              connections: result.rows,
            },
            null,
            2
          ),
        },
      ],
    }
  })
}
