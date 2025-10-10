/**
 * Zod validation schemas for Person model
 */
import { z } from 'zod'

// UUID schema for validation
export const UUIDSchema = z
  .string()
  .uuid('Invalid UUID format')
  .refine((val) => val.length > 0, 'UUID is required')

// PersonType enum (matches database CHECK constraint)
export const PersonTypeSchema = z.enum([
  'employee',
  'contractor',
  'vendor_contact',
  'partner',
  'customer',
  'other',
])

// PersonStatus enum (matches database CHECK constraint)
export const PersonStatusSchema = z.enum(['active', 'inactive', 'terminated'])

/**
 * Schema for creating a new person
 */
export const CreatePersonSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Full name too long'),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
    .or(z.literal('')),
  username: z.string().max(100, 'Username too long').optional(),
  phone: z.string().max(50, 'Phone number too long').optional(),
  mobile: z.string().max(50, 'Mobile number too long').optional(),
  person_type: PersonTypeSchema,
  company_id: UUIDSchema.optional(),
  employee_id: z.string().max(100, 'Employee ID too long').optional(),
  job_title: z.string().max(255, 'Job title too long').optional(),
  department: z.string().max(255, 'Department too long').optional(),
  location_id: UUIDSchema.optional(),
  manager_id: UUIDSchema.optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .optional(),
  status: PersonStatusSchema.optional().default('active'),
  preferred_contact_method: z.string().max(50, 'Preferred contact method too long').optional(),
  notes: z.string().optional(),
})

/**
 * Schema for updating an existing person
 */
export const UpdatePersonSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Full name too long').optional(),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
    .nullable()
    .or(z.literal('')),
  username: z.string().max(100, 'Username too long').optional().nullable(),
  phone: z.string().max(50, 'Phone number too long').optional().nullable(),
  mobile: z.string().max(50, 'Mobile number too long').optional().nullable(),
  person_type: PersonTypeSchema.optional(),
  company_id: UUIDSchema.optional().nullable(),
  employee_id: z.string().max(100, 'Employee ID too long').optional().nullable(),
  job_title: z.string().max(255, 'Job title too long').optional().nullable(),
  department: z.string().max(255, 'Department too long').optional().nullable(),
  location_id: UUIDSchema.optional().nullable(),
  manager_id: UUIDSchema.optional().nullable(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .optional()
    .nullable(),
  status: PersonStatusSchema.optional(),
  preferred_contact_method: z
    .string()
    .max(50, 'Preferred contact method too long')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for query parameters in GET /api/people
 */
export const ListPeopleQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1).max(200, 'Limit cannot exceed 200').optional().default(50),
  company_id: UUIDSchema.optional(),
  location_id: UUIDSchema.optional(),
  person_type: PersonTypeSchema.optional(),
  department: z.string().optional(),
  status: PersonStatusSchema.optional(),
  manager_id: UUIDSchema.optional(),
  search: z.string().optional(),
  sort_by: z
    .enum([
      'full_name',
      'email',
      'person_type',
      'department',
      'job_title',
      'status',
      'created_at',
      'updated_at',
    ])
    .optional()
    .default('full_name'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
})

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>
export type ListPeopleQuery = z.infer<typeof ListPeopleQuerySchema>
