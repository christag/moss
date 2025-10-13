/**
 * Zod validation schemas for Group model
 */
import { z } from 'zod'

/**
 * Group type enum schema (matches database CHECK constraint)
 */
export const GroupTypeSchema = z.enum([
  'active_directory',
  'okta',
  'google_workspace',
  'jamf_smart_group',
  'intune',
  'custom',
  'distribution_list',
  'security',
])

/**
 * Schema for creating a new group
 */
export const CreateGroupSchema = z.object({
  group_name: z.string().min(1).max(255),
  group_type: GroupTypeSchema,
  description: z.string().nullable().optional(),
  group_id_external: z.string().max(255).nullable().optional(),
  created_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schema for updating an existing group
 */
export const UpdateGroupSchema = z.object({
  group_name: z.string().min(1).max(255).optional(),
  group_type: GroupTypeSchema.optional(),
  description: z.string().optional().nullable(),
  group_id_external: z.string().max(255).optional().nullable(),
  created_date: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for querying groups (list endpoint filters)
 */
export const GroupQuerySchema = z.object({
  // Filters
  group_type: GroupTypeSchema.optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),

  // Sorting
  sort_by: z.enum(['group_name', 'group_type', 'created_at']).default('group_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
