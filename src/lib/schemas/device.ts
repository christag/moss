/**
 * Zod validation schemas for Device model
 */
import { z } from 'zod'

/**
 * Device type enum schema (matches database CHECK constraint)
 */
export const DeviceTypeSchema = z.enum([
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
])

/**
 * Device status enum schema (matches database CHECK constraint)
 */
export const DeviceStatusSchema = z.enum(['active', 'retired', 'repair', 'storage'])

/**
 * Schema for creating a new device
 */
export const CreateDeviceSchema = z.object({
  parent_device_id: z.string().uuid().optional(),
  assigned_to_id: z.string().uuid().optional(),
  last_used_by_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  hostname: z.string().max(255).optional(),
  device_type: DeviceTypeSchema,
  serial_number: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  purchase_date: z.string().date().optional(),
  warranty_expiration: z.string().date().optional(),
  install_date: z.string().date().optional(),
  status: DeviceStatusSchema.default('active'),
  asset_tag: z.string().max(100).optional(),
  operating_system: z.string().max(100).optional(),
  os_version: z.string().max(100).optional(),
  last_audit_date: z.string().date().optional(),
  notes: z.string().optional(),
})

/**
 * Schema for updating a device
 */
export const UpdateDeviceSchema = z.object({
  parent_device_id: z.string().uuid().nullable().optional(),
  assigned_to_id: z.string().uuid().nullable().optional(),
  last_used_by_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  hostname: z.string().max(255).nullable().optional(),
  device_type: DeviceTypeSchema.optional(),
  serial_number: z.string().max(255).nullable().optional(),
  model: z.string().max(255).nullable().optional(),
  manufacturer: z.string().max(255).nullable().optional(),
  purchase_date: z.string().date().nullable().optional(),
  warranty_expiration: z.string().date().nullable().optional(),
  install_date: z.string().date().nullable().optional(),
  status: DeviceStatusSchema.optional(),
  asset_tag: z.string().max(100).nullable().optional(),
  operating_system: z.string().max(100).nullable().optional(),
  os_version: z.string().max(100).nullable().optional(),
  last_audit_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Query parameters schema for device list endpoint
 */
export const DeviceQuerySchema = z.object({
  search: z.string().optional(),
  device_type: DeviceTypeSchema.optional(),
  status: DeviceStatusSchema.optional(),
  location_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  assigned_to_id: z.string().uuid().optional(),
  manufacturer: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort_by: z
    .enum([
      'hostname',
      'device_type',
      'manufacturer',
      'model',
      'serial_number',
      'asset_tag',
      'status',
      'purchase_date',
      'warranty_expiration',
      'created_at',
      'updated_at',
    ])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})
