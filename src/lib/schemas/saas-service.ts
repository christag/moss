/**
 * SaaS Service Zod Validation Schemas
 */
import { z } from 'zod'

export const SaaSEnvironmentSchema = z.enum(['production', 'staging', 'dev', 'sandbox'])

export const SaaSStatusSchema = z.enum(['active', 'trial', 'inactive', 'cancelled'])

export const SaaSCriticalitySchema = z.enum(['critical', 'high', 'medium', 'low'])

export const CreateSaaSServiceSchema = z.object({
  software_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  business_owner_id: z.string().uuid().nullable().optional(),
  technical_contact_id: z.string().uuid().nullable().optional(),
  service_name: z.string().min(1).max(255),
  service_url: z.string().max(255).nullable().optional(),
  account_id: z.string().max(255).nullable().optional(),
  environment: z.preprocess(
    (val) => (val === '' ? null : val),
    SaaSEnvironmentSchema.nullable().optional()
  ),
  status: z.preprocess((val) => (val === '' ? null : val), SaaSStatusSchema.default('active')),
  subscription_start: z.string().nullable().optional(),
  subscription_end: z.string().nullable().optional(),
  seat_count: z.number().int().min(0).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  billing_frequency: z.string().max(50).nullable().optional(),
  criticality: z.preprocess(
    (val) => (val === '' ? null : val),
    SaaSCriticalitySchema.nullable().optional()
  ),
  sso_provider: z.string().max(50).nullable().optional(),
  sso_protocol: z.string().max(50).nullable().optional(),
  scim_enabled: z.boolean().default(false),
  provisioning_type: z.string().max(50).nullable().optional(),
  api_access_enabled: z.boolean().default(false),
  api_documentation_url: z.string().max(255).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const UpdateSaaSServiceSchema = z.object({
  software_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  business_owner_id: z.string().uuid().nullable().optional(),
  technical_contact_id: z.string().uuid().nullable().optional(),
  service_name: z.string().min(1).max(255).optional(),
  service_url: z.string().max(255).nullable().optional(),
  account_id: z.string().max(255).nullable().optional(),
  environment: z.preprocess(
    (val) => (val === '' ? null : val),
    SaaSEnvironmentSchema.nullable().optional()
  ),
  status: z.preprocess((val) => (val === '' ? null : val), SaaSStatusSchema.optional()),
  subscription_start: z.string().nullable().optional(),
  subscription_end: z.string().nullable().optional(),
  seat_count: z.number().int().min(0).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  billing_frequency: z.string().max(50).nullable().optional(),
  criticality: z.preprocess(
    (val) => (val === '' ? null : val),
    SaaSCriticalitySchema.nullable().optional()
  ),
  sso_provider: z.string().max(50).nullable().optional(),
  sso_protocol: z.string().max(50).nullable().optional(),
  scim_enabled: z.boolean().optional(),
  provisioning_type: z.string().max(50).nullable().optional(),
  api_access_enabled: z.boolean().optional(),
  api_documentation_url: z.string().max(255).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const SaaSServiceQuerySchema = z.object({
  search: z.string().optional(),
  environment: SaaSEnvironmentSchema.optional(),
  status: SaaSStatusSchema.optional(),
  criticality: SaaSCriticalitySchema.optional(),
  software_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  business_owner_id: z.string().uuid().optional(),
  technical_contact_id: z.string().uuid().optional(),
  sso_enabled: z.enum(['true', 'false']).optional(),
  scim_enabled: z.enum(['true', 'false']).optional(),
  api_access_enabled: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z
    .enum([
      'service_name',
      'status',
      'environment',
      'criticality',
      'subscription_end',
      'created_at',
    ])
    .default('service_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
