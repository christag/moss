/**
 * Validation schemas for External Documents
 */
import { z } from 'zod'

export const ExternalDocumentTypeSchema = z.enum([
  'password_vault',
  'ssl_certificate',
  'domain_registrar',
  'ticket',
  'runbook',
  'diagram',
  'wiki_page',
  'contract',
  'invoice',
  'other',
])

export const CreateExternalDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  document_type: ExternalDocumentTypeSchema.nullable().optional(),
  url: z.string().url().nullable().optional().or(z.literal('')),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_date: z.string().nullable().optional(),
  updated_date: z.string().nullable().optional(),
})

export const UpdateExternalDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  document_type: ExternalDocumentTypeSchema.optional(),
  url: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  notes: z.string().optional(),
  created_date: z.string().optional(),
  updated_date: z.string().optional(),
})

export const ExternalDocumentQuerySchema = z.object({
  search: z.string().optional(),
  document_type: ExternalDocumentTypeSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sort_by: z
    .enum([
      'title',
      'document_type',
      'url',
      'created_date',
      'updated_date',
      'created_at',
      'updated_at',
    ])
    .default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})
