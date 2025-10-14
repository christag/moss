// @ts-nocheck
/**
 * MCP Tools for Device Management
 */

import { z } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getPool } from '@/lib/db'
import { requireScope, hasScope } from '../auth'
import type { MCPAuthContext } from '../auth'

/**
 * Register device-related tools with MCP server
 */
export async function registerDeviceTools(server: Server, authContext: MCPAuthContext) {
  // Tool: search_devices
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'search_devices') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      search: z.string().optional(),
      device_type: z.string().optional(),
      status: z.enum(['active', 'inactive', 'retired', 'maintenance']).optional(),
      location_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    let query = `
      SELECT d.id, d.device_name, d.device_type, d.serial_number, d.status,
             d.ip_address, d.hostname, l.location_name, c.company_name
      FROM devices d
      LEFT JOIN locations l ON d.location_id = l.id
      LEFT JOIN companies c ON l.company_id = c.id
      WHERE 1=1
    `
    const params: string[] = []
    let paramCount = 0

    if (args.search) {
      paramCount++
      query += ` AND (d.device_name ILIKE $${paramCount} OR d.serial_number ILIKE $${paramCount} OR d.hostname ILIKE $${paramCount})`
      params.push(`%${args.search}%`)
    }

    if (args.device_type) {
      paramCount++
      query += ` AND d.device_type = $${paramCount}`
      params.push(args.device_type)
    }

    if (args.status) {
      paramCount++
      query += ` AND d.status = $${paramCount}`
      params.push(args.status)
    }

    if (args.location_id) {
      paramCount++
      query += ` AND d.location_id = $${paramCount}`
      params.push(args.location_id)
    }

    query += ` ORDER BY d.device_name LIMIT ${args.limit}`

    const result = await pool.query(query, params)

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

  // Tool: get_device_details
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name !== 'get_device_details') return

    requireScope(authContext, 'mcp:tools')

    const schema = z.object({
      device_id: z.string().uuid(),
    })

    const args = schema.parse(request.params.arguments)
    const pool = getPool()

    // Get device with all relationships
    const deviceQuery = `
      SELECT d.*,
             l.location_name, l.id as location_id,
             r.room_name, r.id as room_id,
             p.full_name as assigned_to_name, p.id as assigned_to_id,
             parent.device_name as parent_device_name, parent.id as parent_device_id
      FROM devices d
      LEFT JOIN locations l ON d.location_id = l.id
      LEFT JOIN rooms r ON d.room_id = r.id
      LEFT JOIN people p ON d.assigned_to_id = p.id
      LEFT JOIN devices parent ON d.parent_device_id = parent.id
      WHERE d.id = $1
    `

    const deviceResult = await pool.query(deviceQuery, [args.device_id])

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found')
    }

    const device = deviceResult.rows[0]

    // Get IOs
    const iosResult = await pool.query(
      `SELECT id, io_name, interface_type, status, mac_address, speed
       FROM ios WHERE device_id = $1 ORDER BY io_name`,
      [args.device_id]
    )

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              device,
              interfaces: iosResult.rows,
            },
            null,
            2
          ),
        },
      ],
    }
  })

  // Tool: create_device (requires write scope)
  if (hasScope(authContext, 'mcp:write')) {
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name !== 'create_device') return

      requireScope(authContext, 'mcp:write')

      const schema = z.object({
        device_name: z.string().min(1),
        device_type: z.string(),
        serial_number: z.string().optional(),
        location_id: z.string().uuid(),
        status: z.enum(['active', 'inactive', 'retired', 'maintenance']).default('active'),
        notes: z.string().optional(),
      })

      const args = schema.parse(request.params.arguments)
      const pool = getPool()

      const result = await pool.query(
        `INSERT INTO devices (device_name, device_type, serial_number, location_id, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, device_name, device_type, status`,
        [
          args.device_name,
          args.device_type,
          args.serial_number,
          args.location_id,
          args.status,
          args.notes,
        ]
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Device created successfully',
                device: result.rows[0],
              },
              null,
              2
            ),
          },
        ],
      }
    })
  }

  // Register tool metadata
  server.setRequestHandler('tools/list', async () => {
    const tools: Array<{
      name: string
      description: string
      inputSchema: Record<string, unknown>
    }> = [
      {
        name: 'search_devices',
        description: 'Search for devices in the inventory with filters',
        inputSchema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Search by device name, serial number, or hostname',
            },
            device_type: {
              type: 'string',
              description: 'Filter by device type (e.g., server, switch, router)',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'retired', 'maintenance'],
              description: 'Filter by device status',
            },
            location_id: {
              type: 'string',
              format: 'uuid',
              description: 'Filter by location UUID',
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Maximum number of results to return',
            },
          },
        },
      },
      {
        name: 'get_device_details',
        description:
          'Get detailed information about a specific device including interfaces and relationships',
        inputSchema: {
          type: 'object',
          properties: {
            device_id: {
              type: 'string',
              format: 'uuid',
              description: 'Device UUID',
            },
          },
          required: ['device_id'],
        },
      },
    ]

    if (hasScope(authContext, 'mcp:write')) {
      tools.push({
        name: 'create_device',
        description: 'Create a new device in the inventory',
        inputSchema: {
          type: 'object',
          properties: {
            device_name: {
              type: 'string',
              description: 'Name of the device',
            },
            device_type: {
              type: 'string',
              description: 'Type of device (e.g., server, switch, router)',
            },
            serial_number: {
              type: 'string',
              description: 'Device serial number',
            },
            location_id: {
              type: 'string',
              format: 'uuid',
              description: 'Location UUID where device is located',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'retired', 'maintenance'],
              default: 'active',
              description: 'Device status',
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the device',
            },
          },
          required: ['device_name', 'device_type', 'location_id'],
        },
      })
    }

    return { tools }
  })
}
