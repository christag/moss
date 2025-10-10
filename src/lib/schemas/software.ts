/**
 * Software Zod Validation Schemas
 */
import { z } from 'zod'

export const SoftwareCategorySchema = z.enum([
  'productivity',
  'security',
  'development',
  'communication',
  'infrastructure',
  'collaboration',
  'broadcast',
  'media',
  'other',
])

export const CreateSoftwareSchema = z.object({
  company_id: z.string().uuid().optional(),
  product_name: z.string().min(1).max(255),
  description: z.string().optional(),
  website: z.string().max(255).optional(),
  software_category: SoftwareCategorySchema.optional(),
  notes: z.string().optional(),
})

export const UpdateSoftwareSchema = z.object({
  company_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  website: z.string().max(255).nullable().optional(),
  software_category: SoftwareCategorySchema.nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const SoftwareQuerySchema = z.object({
  search: z.string().optional(),
  software_category: SoftwareCategorySchema.optional(),
  company_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['product_name', 'software_category', 'created_at']).default('product_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
