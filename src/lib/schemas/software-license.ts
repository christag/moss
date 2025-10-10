/**
 * Validation schemas for Software Licenses
 */
import { z } from 'zod'

export const LicenseTypeSchema = z.enum([
  'perpetual',
  'subscription',
  'free',
  'volume',
  'site',
  'concurrent',
])

export const CreateSoftwareLicenseSchema = z.object({
  software_id: z.string().uuid().optional(),
  purchased_from_id: z.string().uuid().optional(),
  license_key: z.string().optional(),
  license_type: LicenseTypeSchema.optional(),
  purchase_date: z.string().optional(),
  expiration_date: z.string().optional(),
  seat_count: z.number().int().positive().optional(),
  seats_used: z.number().int().nonnegative().optional(),
  cost: z.number().positive().optional(),
  renewal_date: z.string().optional(),
  auto_renew: z.boolean().optional(),
  notes: z.string().optional(),
})

export const UpdateSoftwareLicenseSchema = z.object({
  software_id: z.string().uuid().optional(),
  purchased_from_id: z.string().uuid().optional(),
  license_key: z.string().optional(),
  license_type: LicenseTypeSchema.optional(),
  purchase_date: z.string().optional(),
  expiration_date: z.string().optional(),
  seat_count: z.number().int().positive().optional(),
  seats_used: z.number().int().nonnegative().optional(),
  cost: z.number().positive().optional(),
  renewal_date: z.string().optional(),
  auto_renew: z.boolean().optional(),
  notes: z.string().optional(),
})

export const SoftwareLicenseQuerySchema = z.object({
  search: z.string().optional(),
  software_id: z.string().uuid().optional(),
  purchased_from_id: z.string().uuid().optional(),
  license_type: LicenseTypeSchema.optional(),
  auto_renew: z.enum(['true', 'false']).optional(),
  expiring_soon: z.enum(['true', 'false']).optional(), // expiring within 90 days
  expired: z.enum(['true', 'false']).optional(), // already expired
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sort_by: z
    .enum([
      'license_type',
      'purchase_date',
      'expiration_date',
      'renewal_date',
      'cost',
      'created_at',
      'updated_at',
    ])
    .default('expiration_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
