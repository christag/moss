/**
 * MCP Tools for People Management
 */

import { z } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getPool } from '@/lib/db'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerPeopleTools(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'search_people') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      search: z.string().optional(),
      person_type: z.enum(['employee', 'contractor', 'vendor_contact', 'other']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      limit: z.number().int().min(1).max(100).default(20),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    let query = `
      SELECT p.id, p.full_name, p.email, p.person_type, p.status,
             c.company_name, l.location_name
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE 1=1
    `
    const params: string[] = []
    let paramCount = 0

    if (args.search) {
      paramCount++
      query += ` AND (p.full_name ILIKE $${paramCount} OR p.email ILIKE $${paramCount})`
      params.push(`%${args.search}%`)
    }

    if (args.person_type) {
      paramCount++
      query += ` AND p.person_type = $${paramCount}`
      params.push(args.person_type)
    }

    if (args.status) {
      paramCount++
      query += ` AND p.status = $${paramCount}`
      params.push(args.status)
    }

    query += ` ORDER BY p.full_name LIMIT ${args.limit}`

    const result = await pool.query(query, params)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: result.rows.length,
              people: result.rows,
            },
            null,
            2
          ),
        },
      ],
    }
  })
}
