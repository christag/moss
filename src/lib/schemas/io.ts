/**
 * Zod validation schemas for IO (Interface/Port) model
 */
import { z } from 'zod'

export const InterfaceTypeSchema = z.enum([
  'ethernet',
  'wifi',
  'virtual',
  'fiber_optic',
  'sdi',
  'hdmi',
  'xlr',
  'usb',
  'thunderbolt',
  'displayport',
  'coax',
  'serial',
  'patch_panel_port',
  'power_input',
  'power_output',
  'other',
])

export const MediaTypeSchema = z.enum([
  'single_mode_fiber',
  'multi_mode_fiber',
  'cat5e',
  'cat6',
  'cat6a',
  'coax',
  'wireless',
  'ac_power',
  'dc_power',
  'poe',
  'other',
])

export const IOStatusSchema = z.enum(['active', 'inactive', 'monitoring', 'reserved'])

export const DuplexSchema = z.enum(['full', 'half', 'auto', 'n/a'])

export const TrunkModeSchema = z.enum(['access', 'trunk', 'hybrid', 'n/a'])

export const CreateIOSchema = z.object({
  device_id: z.string().uuid().nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  native_network_id: z.string().uuid().nullable().optional(),
  connected_to_io_id: z.string().uuid().nullable().optional(),
  interface_name: z.string().min(1).max(255),
  interface_type: InterfaceTypeSchema,
  media_type: MediaTypeSchema.nullable().optional(),
  status: IOStatusSchema.default('active'),
  speed: z.string().max(50).nullable().optional(),
  duplex: DuplexSchema.nullable().optional(),
  trunk_mode: TrunkModeSchema.nullable().optional(),
  port_number: z.string().max(50).nullable().optional(),
  mac_address: z.string().max(17).nullable().optional(),
  voltage: z.string().max(20).nullable().optional(),
  amperage: z.string().max(20).nullable().optional(),
  wattage: z.string().max(20).nullable().optional(),
  power_connector_type: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const UpdateIOSchema = z.object({
  device_id: z.string().uuid().nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  native_network_id: z.string().uuid().nullable().optional(),
  connected_to_io_id: z.string().uuid().nullable().optional(),
  interface_name: z.string().min(1).max(255).optional(),
  interface_type: InterfaceTypeSchema.optional(),
  media_type: MediaTypeSchema.nullable().optional(),
  status: IOStatusSchema.optional(),
  speed: z.string().max(50).nullable().optional(),
  duplex: DuplexSchema.nullable().optional(),
  trunk_mode: TrunkModeSchema.nullable().optional(),
  port_number: z.string().max(50).nullable().optional(),
  mac_address: z.string().max(17).nullable().optional(),
  voltage: z.string().max(20).nullable().optional(),
  amperage: z.string().max(20).nullable().optional(),
  wattage: z.string().max(20).nullable().optional(),
  power_connector_type: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const IOQuerySchema = z
  .object({
    search: z.string().optional(),
    interface_type: InterfaceTypeSchema.optional(),
    media_type: MediaTypeSchema.optional(),
    status: IOStatusSchema.optional(),
    device_id: z.string().uuid().optional(),
    room_id: z.string().uuid().optional(),
    native_network_id: z.string().uuid().optional(),
    connected_to_io_id: z.string().uuid().optional(),
    trunk_mode: TrunkModeSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sort_by: z
      .enum([
        'interface_name',
        'interface_type',
        'status',
        'port_number',
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

export type InterfaceType = z.infer<typeof InterfaceTypeSchema>
export type MediaType = z.infer<typeof MediaTypeSchema>
export type IOStatus = z.infer<typeof IOStatusSchema>
export type Duplex = z.infer<typeof DuplexSchema>
export type TrunkMode = z.infer<typeof TrunkModeSchema>
export type CreateIOInput = z.infer<typeof CreateIOSchema>
export type UpdateIOInput = z.infer<typeof UpdateIOSchema>
export type IOQuery = z.infer<typeof IOQuerySchema>
