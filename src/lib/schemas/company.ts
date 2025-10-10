/**
 * Zod validation schemas for Company API
 */
import { z } from 'zod'

// Company type enum (matches database CHECK constraint)
export const CompanyTypeSchema = z.enum([
  'own_organization',
  'vendor',
  'manufacturer',
  'service_provider',
  'partner',
  'customer',
  'other',
])

// Create Company schema
export const CreateCompanySchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  company_type: CompanyTypeSchema,
  website: z.string().url('Invalid URL').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  account_number: z.string().max(100).optional(),
  support_url: z.string().url('Invalid URL').max(255).optional().or(z.literal('')),
  support_phone: z.string().max(50).optional(),
  support_email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  tax_id: z.string().max(100).optional(),
  notes: z.string().optional(),
})

// Update Company schema (all fields optional)
export const UpdateCompanySchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  company_type: CompanyTypeSchema.optional(),
  website: z.string().url('Invalid URL').max(255).optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  account_number: z.string().max(100).optional().nullable(),
  support_url: z.string().url('Invalid URL').max(255).optional().nullable().or(z.literal('')),
  support_phone: z.string().max(50).optional().nullable(),
  support_email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
  tax_id: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Query parameters schema for listing companies
export const ListCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  company_type: CompanyTypeSchema.optional(),
  search: z.string().optional(),
  sort_by: z.enum(['company_name', 'company_type', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
})

// UUID validation schema
export const UUIDSchema = z.string().uuid('Invalid UUID format')

// Types inferred from schemas
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>
export type ListCompaniesQuery = z.infer<typeof ListCompaniesQuerySchema>
