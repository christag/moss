/**
 * Saved Filters Zod Validation Schemas
 */
import { z } from 'zod'

// Object types that support saved filters
export const savedFilterObjectTypeSchema = z.enum([
  'devices',
  'networks',
  'ios',
  'ip_addresses',
  'people',
  'companies',
  'locations',
  'rooms',
  'groups',
  'software',
  'saas_services',
  'installed_applications',
  'software_licenses',
  'documents',
  'external_documents',
  'contracts',
])

// Filter configuration schema (flexible JSONB structure)
export const filterConfigSchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.string()).optional(), // { column_name: filter_value, ... }
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
})

// Full saved filter schema
export const savedFilterSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  filter_name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  object_type: savedFilterObjectTypeSchema,
  filter_config: filterConfigSchema,
  is_public: z.boolean().default(false),
  is_default: z.boolean().default(false),
  last_used_at: z.string().datetime().nullable().optional(),
  use_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Create saved filter schema (for POST requests)
export const createSavedFilterSchema = z.object({
  filter_name: z.string().min(1, 'Filter name is required').max(255, 'Filter name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  object_type: savedFilterObjectTypeSchema,
  filter_config: filterConfigSchema,
  is_public: z.boolean().default(false),
  is_default: z.boolean().default(false),
})

// Update saved filter schema (for PATCH requests)
export const updateSavedFilterSchema = z.object({
  filter_name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  filter_config: filterConfigSchema.optional(),
  is_public: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

// Query schema for listing saved filters
export const savedFilterQuerySchema = z.object({
  object_type: savedFilterObjectTypeSchema.optional(),
  is_public: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search filter names/descriptions
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z
    .enum(['filter_name', 'created_at', 'last_used_at', 'use_count'])
    .default('filter_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// Apply filter schema (for recording usage)
export const applyFilterSchema = z.object({
  filter_id: z.string().uuid(),
})

// Public saved filter schema (includes creator info)
export const publicSavedFilterSchema = savedFilterSchema.extend({
  created_by_email: z.string(),
  created_by_full_name: z.string().nullable(),
})

// Type exports
export type SavedFilterObjectType = z.infer<typeof savedFilterObjectTypeSchema>
export type FilterConfig = z.infer<typeof filterConfigSchema>
export type SavedFilter = z.infer<typeof savedFilterSchema>
export type CreateSavedFilter = z.infer<typeof createSavedFilterSchema>
export type UpdateSavedFilter = z.infer<typeof updateSavedFilterSchema>
export type SavedFilterQuery = z.infer<typeof savedFilterQuerySchema>
export type PublicSavedFilter = z.infer<typeof publicSavedFilterSchema>
