/**
 * Object Type Registry
 * Defines metadata for all importable/exportable object types
 */

import { CreateDeviceSchema } from '@/lib/schemas/device'
import { CreatePersonSchema } from '@/lib/schemas/person'
import { CreateLocationSchema } from '@/lib/schemas/location'
import { CreateRoomSchema } from '@/lib/schemas/room'
import { CreateCompanySchema } from '@/lib/schemas/company'
import { CreateNetworkSchema } from '@/lib/schemas/network'

/**
 * Field definition for object type registry
 */
export interface ObjectFieldDef {
  /** Database field name */
  name: string
  /** Human-readable label */
  label: string
  /** Field data type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'enum'
  /** Whether field is required */
  required: boolean
  /** For enum types, the allowed values */
  enumValues?: string[]
  /** Example value for documentation */
  example?: string
  /** Description of the field */
  description?: string
}

/**
 * Object type metadata definition
 */
export interface ObjectTypeDef {
  /** Object type identifier (matches API route) */
  id: string
  /** Human-readable name (singular) */
  name: string
  /** Human-readable name (plural) */
  namePlural: string
  /** API endpoint for bulk operations */
  bulkEndpoint: string
  /** Zod schema for validation */
  schema: { parse: (data: unknown) => unknown }
  /** Field definitions */
  fields: ObjectFieldDef[]
  /** Template CSV data for download */
  templateData: Record<string, unknown>[]
}

/**
 * Registry of all importable object types
 */
export const OBJECT_TYPE_REGISTRY: Record<string, ObjectTypeDef> = {
  devices: {
    id: 'devices',
    name: 'Device',
    namePlural: 'Devices',
    bulkEndpoint: '/api/devices/bulk',
    schema: CreateDeviceSchema,
    fields: [
      {
        name: 'hostname',
        label: 'Hostname',
        type: 'string',
        required: false,
        example: 'server-01',
      },
      {
        name: 'device_type',
        label: 'Device Type',
        type: 'enum',
        required: true,
        enumValues: [
          'computer',
          'server',
          'switch',
          'router',
          'firewall',
          'printer',
          'mobile',
          'iot',
          'appliance',
          'av_equipment',
          'broadcast_equipment',
          'patch_panel',
          'ups',
          'pdu',
          'chassis',
          'module',
          'blade',
        ],
        example: 'server',
      },
      {
        name: 'manufacturer',
        label: 'Manufacturer',
        type: 'string',
        required: false,
        example: 'Dell',
      },
      { name: 'model', label: 'Model', type: 'string', required: false, example: 'PowerEdge R740' },
      {
        name: 'serial_number',
        label: 'Serial Number',
        type: 'string',
        required: false,
        example: 'SN123456',
      },
      {
        name: 'asset_tag',
        label: 'Asset Tag',
        type: 'string',
        required: false,
        example: 'ASSET-001',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        required: false,
        enumValues: ['active', 'retired', 'repair', 'storage'],
        example: 'active',
      },
      {
        name: 'operating_system',
        label: 'Operating System',
        type: 'string',
        required: false,
        example: 'Ubuntu 22.04',
      },
      {
        name: 'os_version',
        label: 'OS Version',
        type: 'string',
        required: false,
        example: '22.04',
      },
      {
        name: 'purchase_date',
        label: 'Purchase Date',
        type: 'date',
        required: false,
        example: '2023-01-15',
      },
      {
        name: 'warranty_expiration',
        label: 'Warranty Expiration',
        type: 'date',
        required: false,
        example: '2026-01-15',
      },
      {
        name: 'install_date',
        label: 'Install Date',
        type: 'date',
        required: false,
        example: '2023-02-01',
      },
      {
        name: 'last_audit_date',
        label: 'Last Audit Date',
        type: 'date',
        required: false,
        example: '2024-12-01',
      },
      {
        name: 'location_id',
        label: 'Location ID',
        type: 'uuid',
        required: false,
        example: '00000000-0000-0000-0001-000000000001',
      },
      { name: 'room_id', label: 'Room ID', type: 'uuid', required: false },
      { name: 'company_id', label: 'Company ID', type: 'uuid', required: false },
      { name: 'assigned_to_id', label: 'Assigned To ID', type: 'uuid', required: false },
      { name: 'parent_device_id', label: 'Parent Device ID', type: 'uuid', required: false },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        hostname: 'server-01',
        device_type: 'server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'SN123456',
        asset_tag: 'ASSET-001',
        status: 'active',
        operating_system: 'Ubuntu 22.04',
        notes: 'Production web server',
      },
      {
        hostname: 'switch-01',
        device_type: 'switch',
        manufacturer: 'Cisco',
        model: 'Catalyst 9300',
        serial_number: 'SN789012',
        status: 'active',
      },
    ],
  },

  people: {
    id: 'people',
    name: 'Person',
    namePlural: 'People',
    bulkEndpoint: '/api/people/bulk',
    schema: CreatePersonSchema,
    fields: [
      { name: 'first_name', label: 'First Name', type: 'string', required: true, example: 'John' },
      { name: 'last_name', label: 'Last Name', type: 'string', required: true, example: 'Doe' },
      {
        name: 'email',
        label: 'Email',
        type: 'string',
        required: false,
        example: 'john.doe@example.com',
      },
      { name: 'phone', label: 'Phone', type: 'string', required: false, example: '+1-555-0100' },
      {
        name: 'employee_id',
        label: 'Employee ID',
        type: 'string',
        required: false,
        example: 'EMP001',
      },
      {
        name: 'person_type',
        label: 'Person Type',
        type: 'enum',
        required: true,
        enumValues: ['employee', 'contractor', 'vendor', 'other'],
        example: 'employee',
      },
      {
        name: 'title',
        label: 'Title',
        type: 'string',
        required: false,
        example: 'Software Engineer',
      },
      {
        name: 'department',
        label: 'Department',
        type: 'string',
        required: false,
        example: 'Engineering',
      },
      {
        name: 'start_date',
        label: 'Start Date',
        type: 'date',
        required: false,
        example: '2023-01-15',
      },
      { name: 'end_date', label: 'End Date', type: 'date', required: false },
      { name: 'location_id', label: 'Location ID', type: 'uuid', required: false },
      { name: 'room_id', label: 'Room ID', type: 'uuid', required: false },
      { name: 'manager_id', label: 'Manager ID', type: 'uuid', required: false },
      { name: 'company_id', label: 'Company ID', type: 'uuid', required: false },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0100',
        employee_id: 'EMP001',
        person_type: 'employee',
        title: 'Software Engineer',
        department: 'Engineering',
        start_date: '2023-01-15',
      },
    ],
  },

  locations: {
    id: 'locations',
    name: 'Location',
    namePlural: 'Locations',
    bulkEndpoint: '/api/locations/bulk',
    schema: CreateLocationSchema,
    fields: [
      {
        name: 'location_name',
        label: 'Location Name',
        type: 'string',
        required: true,
        example: 'Headquarters',
      },
      {
        name: 'location_type',
        label: 'Location Type',
        type: 'enum',
        required: true,
        enumValues: ['office', 'datacenter', 'warehouse', 'retail', 'remote', 'other'],
        example: 'office',
      },
      {
        name: 'address',
        label: 'Address',
        type: 'string',
        required: false,
        example: '123 Main St',
      },
      { name: 'city', label: 'City', type: 'string', required: false, example: 'San Francisco' },
      {
        name: 'state_province',
        label: 'State/Province',
        type: 'string',
        required: false,
        example: 'CA',
      },
      {
        name: 'postal_code',
        label: 'Postal Code',
        type: 'string',
        required: false,
        example: '94105',
      },
      { name: 'country', label: 'Country', type: 'string', required: false, example: 'USA' },
      { name: 'latitude', label: 'Latitude', type: 'number', required: false, example: '37.7749' },
      {
        name: 'longitude',
        label: 'Longitude',
        type: 'number',
        required: false,
        example: '-122.4194',
      },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        location_name: 'Headquarters',
        location_type: 'office',
        address: '123 Main St',
        city: 'San Francisco',
        state_province: 'CA',
        postal_code: '94105',
        country: 'USA',
      },
    ],
  },

  rooms: {
    id: 'rooms',
    name: 'Room',
    namePlural: 'Rooms',
    bulkEndpoint: '/api/rooms/bulk',
    schema: CreateRoomSchema,
    fields: [
      {
        name: 'location_id',
        label: 'Location ID',
        type: 'uuid',
        required: true,
        example: '00000000-0000-0000-0001-000000000001',
      },
      {
        name: 'room_name',
        label: 'Room Name',
        type: 'string',
        required: true,
        example: 'Server Room A',
      },
      {
        name: 'room_number',
        label: 'Room Number',
        type: 'string',
        required: false,
        example: '101',
      },
      {
        name: 'room_type',
        label: 'Room Type',
        type: 'enum',
        required: true,
        enumValues: ['office', 'server_room', 'conference_room', 'storage', 'lab', 'other'],
        example: 'server_room',
      },
      { name: 'floor', label: 'Floor', type: 'string', required: false, example: '1' },
      { name: 'capacity', label: 'Capacity', type: 'number', required: false, example: '10' },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        location_id: '00000000-0000-0000-0001-000000000001',
        room_name: 'Server Room A',
        room_number: '101',
        room_type: 'server_room',
        floor: '1',
      },
    ],
  },

  companies: {
    id: 'companies',
    name: 'Company',
    namePlural: 'Companies',
    bulkEndpoint: '/api/companies/bulk',
    schema: CreateCompanySchema,
    fields: [
      {
        name: 'company_name',
        label: 'Company Name',
        type: 'string',
        required: true,
        example: 'Acme Corp',
      },
      {
        name: 'company_type',
        label: 'Company Type',
        type: 'enum',
        required: true,
        enumValues: ['customer', 'vendor', 'partner', 'internal', 'other'],
        example: 'vendor',
      },
      {
        name: 'website',
        label: 'Website',
        type: 'string',
        required: false,
        example: 'https://acme.com',
      },
      { name: 'primary_contact_id', label: 'Primary Contact ID', type: 'uuid', required: false },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        company_name: 'Acme Corp',
        company_type: 'vendor',
        website: 'https://acme.com',
      },
    ],
  },

  networks: {
    id: 'networks',
    name: 'Network',
    namePlural: 'Networks',
    bulkEndpoint: '/api/networks/bulk',
    schema: CreateNetworkSchema,
    fields: [
      {
        name: 'network_name',
        label: 'Network Name',
        type: 'string',
        required: true,
        example: 'Production VLAN',
      },
      { name: 'vlan_id', label: 'VLAN ID', type: 'number', required: false, example: '100' },
      {
        name: 'subnet',
        label: 'Subnet',
        type: 'string',
        required: false,
        example: '192.168.1.0/24',
      },
      {
        name: 'gateway',
        label: 'Gateway',
        type: 'string',
        required: false,
        example: '192.168.1.1',
      },
      {
        name: 'dns_servers',
        label: 'DNS Servers',
        type: 'string',
        required: false,
        example: '8.8.8.8,8.8.4.4',
      },
      {
        name: 'dhcp_enabled',
        label: 'DHCP Enabled',
        type: 'boolean',
        required: false,
        example: 'true',
      },
      {
        name: 'network_type',
        label: 'Network Type',
        type: 'enum',
        required: true,
        enumValues: ['lan', 'wan', 'vlan', 'vpn', 'wireless', 'other'],
        example: 'vlan',
      },
      { name: 'location_id', label: 'Location ID', type: 'uuid', required: false },
      { name: 'notes', label: 'Notes', type: 'string', required: false },
    ],
    templateData: [
      {
        network_name: 'Production VLAN',
        vlan_id: 100,
        subnet: '192.168.1.0/24',
        gateway: '192.168.1.1',
        network_type: 'vlan',
      },
    ],
  },
}

/**
 * Gets object type definition by ID
 */
export function getObjectTypeDef(objectType: string): ObjectTypeDef | undefined {
  return OBJECT_TYPE_REGISTRY[objectType]
}

/**
 * Gets all available object type IDs
 */
export function getAvailableObjectTypes(): string[] {
  return Object.keys(OBJECT_TYPE_REGISTRY)
}

/**
 * Generates a template CSV for an object type
 */
export function generateTemplateCSV(objectType: string): string {
  const def = getObjectTypeDef(objectType)
  if (!def) {
    throw new Error(`Unknown object type: ${objectType}`)
  }

  const headers = def.fields.map((f) => f.name).join(',')
  const rows = def.templateData.map((row) => {
    return def.fields
      .map((f) => {
        const value = row[f.name]
        if (value === undefined || value === null) return ''
        // Quote values containing commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return String(value)
      })
      .join(',')
  })

  return [headers, ...rows].join('\n')
}
