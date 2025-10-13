import { z } from 'zod'

/**
 * UUID validation schema
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format')

/**
 * Location type validation schema (matches database CHECK constraint)
 */
export const LocationTypeSchema = z.enum([
  'office',
  'datacenter',
  'colo',
  'remote',
  'warehouse',
  'studio',
  'broadcast_facility',
])

/**
 * Create Location validation schema
 */
export const CreateLocationSchema = z.object({
  location_name: z.string().min(1, 'Location name is required').max(255, 'Location name too long'),
  company_id: UUIDSchema.nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().max(100, 'City name too long').nullable().optional(),
  state: z.string().max(100, 'State too long').nullable().optional(),
  zip: z.string().max(20, 'ZIP code too long').nullable().optional(),
  country: z.string().max(100, 'Country name too long').nullable().optional(),
  location_type: LocationTypeSchema.nullable().optional(),
  timezone: z.string().max(50, 'Timezone too long').nullable().optional(),
  contact_phone: z.string().max(50, 'Contact phone too long').nullable().optional(),
  access_instructions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Update Location validation schema
 * All fields optional for PATCH requests
 */
export const UpdateLocationSchema = z.object({
  location_name: z
    .string()
    .min(1, 'Location name is required')
    .max(255, 'Location name too long')
    .optional(),
  company_id: UUIDSchema.nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().max(100, 'City name too long').nullable().optional(),
  state: z.string().max(100, 'State too long').nullable().optional(),
  zip: z.string().max(20, 'ZIP code too long').nullable().optional(),
  country: z.string().max(100, 'Country name too long').nullable().optional(),
  location_type: LocationTypeSchema.nullable().optional(),
  timezone: z.string().max(50, 'Timezone too long').nullable().optional(),
  contact_phone: z.string().max(50, 'Contact phone too long').nullable().optional(),
  access_instructions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Location list query parameters schema
 */
export const LocationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort_by: z
    .enum([
      'location_name',
      'city',
      'state',
      'country',
      'location_type',
      'created_at',
      'updated_at',
    ])
    .default('location_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  company_id: UUIDSchema.optional(),
  location_type: LocationTypeSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
})

/**
 * Schema for bulk creating multiple locations (1-100 records)
 */
export const CreateManyLocationsSchema = z
  .array(CreateLocationSchema)
  .min(1, 'At least one location is required')
  .max(100, 'Maximum 100 locations per batch')

/**
 * Column names for locations table (for bulk insert operations)
 */
export const LOCATION_COLUMNS = [
  'location_name',
  'company_id',
  'address',
  'city',
  'state',
  'zip',
  'country',
  'location_type',
  'timezone',
  'contact_phone',
  'access_instructions',
  'notes',
] as const
