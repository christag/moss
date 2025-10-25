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
 * Supports two input formats:
 * 1. full_name: "John Doe" (current format)
 * 2. first_name: "John", last_name: "Doe" (legacy format, converted to full_name)
 */
export const CreatePersonSchema = z
  .object({
    full_name: z.string().min(1).max(255).optional(),
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email too long')
      .nullable()
      .optional()
      .or(z.literal('')),
    username: z.string().max(100, 'Username too long').nullable().optional(),
    phone: z.string().max(50, 'Phone number too long').nullable().optional(),
    mobile: z.string().max(50, 'Mobile number too long').nullable().optional(),
    person_type: z.preprocess((val) => (val === '' ? null : val), PersonTypeSchema),
    company_id: UUIDSchema.nullable().optional(),
    employee_id: z.string().max(100, 'Employee ID too long').nullable().optional(),
    job_title: z.string().max(255, 'Job title too long').nullable().optional(),
    department: z.string().max(255, 'Department too long').nullable().optional(),
    location_id: UUIDSchema.nullable().optional(),
    manager_id: UUIDSchema.nullable().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
      .nullable()
      .optional(),
    status: z.preprocess(
      (val) => (val === '' ? null : val),
      PersonStatusSchema.optional().default('active')
    ),
    preferred_contact_method: z
      .string()
      .max(50, 'Preferred contact method too long')
      .nullable()
      .optional(),
    notes: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Must provide either full_name OR both first_name and last_name
      const hasFullName = data.full_name && data.full_name.trim().length > 0
      const hasFirstAndLast =
        data.first_name &&
        data.first_name.trim().length > 0 &&
        data.last_name &&
        data.last_name.trim().length > 0
      return hasFullName || hasFirstAndLast
    },
    {
      message: 'Either full_name or both first_name and last_name are required',
      path: ['full_name'], // Error will be associated with full_name field
    }
  )

/**
 * Schema for updating an existing person
 * Supports two input formats:
 * 1. full_name: "John Doe" (current format)
 * 2. first_name: "John", last_name: "Doe" (legacy format, converted to full_name)
 */
export const UpdatePersonSchema = z
  .object({
    full_name: z.string().min(1).max(255).optional(),
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
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
    person_type: z.preprocess((val) => (val === '' ? null : val), PersonTypeSchema.optional()),
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
    status: z.preprocess((val) => (val === '' ? null : val), PersonStatusSchema.optional()),
    preferred_contact_method: z
      .string()
      .max(50, 'Preferred contact method too long')
      .optional()
      .nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // If any name field is provided, validate it properly
      // Allow updates without name fields (updating other fields only)
      const hasFullName = data.full_name && data.full_name.trim().length > 0
      const hasFirstName = data.first_name && data.first_name.trim().length > 0
      const hasLastName = data.last_name && data.last_name.trim().length > 0
      const hasAnyNameField = hasFullName || hasFirstName || hasLastName

      // If providing name fields, must provide either full_name OR both first+last
      if (hasAnyNameField) {
        return hasFullName || (hasFirstName && hasLastName)
      }

      // No name fields provided is OK (updating other fields)
      return true
    },
    {
      message: 'When updating name, provide either full_name or both first_name and last_name',
      path: ['full_name'],
    }
  )

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

/**
 * Schema for bulk creating multiple people (1-100 records)
 */
export const CreateManyPeopleSchema = z
  .array(CreatePersonSchema)
  .min(1, 'At least one person is required')
  .max(100, 'Maximum 100 people per batch')

/**
 * Column names for people table (for bulk insert operations)
 */
export const PERSON_COLUMNS = [
  'full_name',
  'email',
  'username',
  'phone',
  'mobile',
  'person_type',
  'company_id',
  'employee_id',
  'job_title',
  'department',
  'location_id',
  'manager_id',
  'start_date',
  'status',
  'preferred_contact_method',
  'notes',
] as const

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>
export type ListPeopleQuery = z.infer<typeof ListPeopleQuerySchema>
