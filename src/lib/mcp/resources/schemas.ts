/**
 * MCP Resources - Database Schemas
 * Provides schema information as resources
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerSchemaResources(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('resources/read', async (request) => {
    if (!request.params.uri.startsWith('resource://moss/schemas/')) return

    requireScope(authContext, 'mcp:resources')

    const schemaType = request.params.uri.replace('resource://moss/schemas/', '')

    const schemas: Record<
      string,
      {
        name: string
        fields: Record<string, string>
        relationships: Record<string, string>
      }
    > = {
      device: {
        name: 'Device',
        fields: {
          id: 'UUID',
          device_name: 'string',
          device_type: 'string',
          serial_number: 'string (optional)',
          status: 'enum: active | inactive | retired | maintenance',
          location_id: 'UUID (foreign key)',
          room_id: 'UUID (foreign key, optional)',
          assigned_to_id: 'UUID (foreign key, optional)',
          warranty_expiration: 'date (optional)',
        },
        relationships: {
          location: 'locations',
          room: 'rooms',
          assigned_to: 'people',
          interfaces: 'ios (one-to-many)',
        },
      },
      person: {
        name: 'Person',
        fields: {
          id: 'UUID',
          full_name: 'string',
          email: 'string',
          person_type: 'enum: employee | contractor | vendor_contact | other',
          status: 'enum: active | inactive',
          company_id: 'UUID (foreign key)',
          location_id: 'UUID (foreign key, optional)',
        },
        relationships: {
          company: 'companies',
          location: 'locations',
          devices: 'devices (one-to-many)',
        },
      },
      network: {
        name: 'Network',
        fields: {
          id: 'UUID',
          network_name: 'string',
          network_address: 'string (CIDR notation)',
          vlan_id: 'integer (optional)',
          network_type: 'enum',
          gateway: 'string (IP address, optional)',
          dhcp_enabled: 'boolean',
        },
        relationships: {
          location: 'locations',
          ios: 'ios (many-to-many via native_network_id)',
        },
      },
    }

    const schema = schemas[schemaType]

    if (!schema) {
      throw new Error(`Schema not found: ${schemaType}`)
    }

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(schema, null, 2),
        },
      ],
    }
  })
}
