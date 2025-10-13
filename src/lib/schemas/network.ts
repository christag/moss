/**
 * Zod validation schemas for Network model
 */
import { z } from 'zod'

/**
 * Network type enum schema (matches database CHECK constraint)
 */
export const NetworkTypeSchema = z.enum([
  'lan',
  'wan',
  'dmz',
  'guest',
  'management',
  'storage',
  'production',
  'broadcast',
])

/**
 * Schema for creating a new network
 */
export const CreateNetworkSchema = z.object({
  location_id: z.string().uuid().nullable().optional(),
  network_name: z.string().min(1).max(255),
  network_address: z.string().max(50).nullable().optional(),
  vlan_id: z.number().int().min(1).max(4094).nullable().optional(),
  network_type: NetworkTypeSchema.nullable().optional(),
  gateway: z.string().max(50).nullable().optional(),
  dns_servers: z.string().nullable().optional(),
  dhcp_enabled: z.boolean().default(false),
  dhcp_range_start: z.string().max(50).nullable().optional(),
  dhcp_range_end: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schema for updating a network
 */
export const UpdateNetworkSchema = z.object({
  location_id: z.string().uuid().nullable().optional(),
  network_name: z.string().min(1).max(255).optional(),
  network_address: z.string().max(50).nullable().optional(),
  vlan_id: z.number().int().min(1).max(4094).nullable().optional(),
  network_type: NetworkTypeSchema.nullable().optional(),
  gateway: z.string().max(50).nullable().optional(),
  dns_servers: z.string().nullable().optional(),
  dhcp_enabled: z.boolean().optional(),
  dhcp_range_start: z.string().max(50).nullable().optional(),
  dhcp_range_end: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Query parameters schema for network list endpoint
 */
export const NetworkQuerySchema = z
  .object({
    search: z.string().optional(),
    network_type: NetworkTypeSchema.optional(),
    location_id: z.string().uuid().optional(),
    dhcp_enabled: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sort_by: z
      .enum([
        'network_name',
        'network_address',
        'vlan_id',
        'network_type',
        'created_at',
        'updated_at',
      ])
      .default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  })
  .transform((data) => ({
    ...data,
    offset: (data.page - 1) * data.limit,
  }))

/**
 * Schema for bulk creating multiple networks (1-100 records)
 */
export const CreateManyNetworksSchema = z
  .array(CreateNetworkSchema)
  .min(1, 'At least one network is required')
  .max(100, 'Maximum 100 networks per batch')

/**
 * Column names for networks table (for bulk insert operations)
 */
export const NETWORK_COLUMNS = [
  'location_id',
  'network_name',
  'network_address',
  'vlan_id',
  'network_type',
  'gateway',
  'dns_servers',
  'dhcp_enabled',
  'dhcp_range_start',
  'dhcp_range_end',
  'description',
  'notes',
] as const
