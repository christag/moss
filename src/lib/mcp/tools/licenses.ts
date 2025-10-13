/**
 * MCP Tools for License Management
 */

import { z } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getPool } from '@/lib/db'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerLicenseTools(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'search_licenses') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      search: z.string().optional(),
      expiring_within_days: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(100).default(20),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    let query = `
      SELECT
        sl.id, sl.license_name, sl.license_type, sl.seats_purchased,
        sl.seats_assigned, sl.expiration_date, sl.license_key,
        s.software_name
      FROM software_licenses sl
      LEFT JOIN software s ON sl.software_id = s.id
      WHERE 1=1
    `
    const params: string[] = []
    let paramCount = 0

    if (args.search) {
      paramCount++
      query += ` AND (sl.license_name ILIKE $${paramCount} OR s.software_name ILIKE $${paramCount})`
      params.push(`%${args.search}%`)
    }

    if (args.expiring_within_days !== undefined) {
      paramCount++
      query += ` AND sl.expiration_date <= CURRENT_DATE + INTERVAL '${args.expiring_within_days} days'`
    }

    query += ` ORDER BY sl.expiration_date LIMIT ${args.limit}`

    const result = await pool.query(query, params)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: result.rows.length,
              licenses: result.rows,
            },
            null,
            2
          ),
        },
      ],
    }
  })

  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'get_warranty_status') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      expiring_within_days: z.number().int().min(0).default(90),
      limit: z.number().int().min(1).max(100).default(20),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    const query = `
      SELECT
        d.id, d.device_name, d.serial_number, d.warranty_expiration,
        d.device_type, l.location_name
      FROM devices d
      LEFT JOIN locations l ON d.location_id = l.id
      WHERE d.warranty_expiration IS NOT NULL
        AND d.warranty_expiration <= CURRENT_DATE + INTERVAL '${args.expiring_within_days} days'
      ORDER BY d.warranty_expiration
      LIMIT ${args.limit}
    `

    const result = await pool.query(query)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: result.rows.length,
              devices: result.rows,
            },
            null,
            2
          ),
        },
      ],
    }
  })
}
