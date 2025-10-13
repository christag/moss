/**
 * Validation schemas for Contracts
 */
import { z } from 'zod'

export const ContractTypeSchema = z.enum([
  'support',
  'license',
  'service',
  'lease',
  'maintenance',
  'consulting',
])

export const CreateContractSchema = z.object({
  company_id: z.string().uuid().nullable().optional(),
  contract_name: z.string().min(1).max(255),
  contract_number: z.string().max(100).nullable().optional(),
  contract_type: ContractTypeSchema.nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  billing_frequency: z.string().max(50).nullable().optional(),
  auto_renew: z.boolean().nullable().optional(),
  renewal_notice_days: z.number().int().positive().nullable().optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const UpdateContractSchema = z.object({
  company_id: z.string().uuid().optional(),
  contract_name: z.string().min(1).max(255).optional(),
  contract_number: z.string().max(100).optional(),
  contract_type: ContractTypeSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  billing_frequency: z.string().max(50).optional(),
  auto_renew: z.boolean().optional(),
  renewal_notice_days: z.number().int().positive().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
})

export const ContractQuerySchema = z.object({
  search: z.string().optional(),
  company_id: z.string().uuid().optional(),
  contract_type: ContractTypeSchema.optional(),
  auto_renew: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sort_by: z
    .enum([
      'contract_name',
      'contract_number',
      'contract_type',
      'start_date',
      'end_date',
      'cost',
      'auto_renew',
      'created_at',
      'updated_at',
    ])
    .default('contract_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
