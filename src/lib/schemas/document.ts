/**
 * Validation schemas for Documents
 */
import { z } from 'zod'

export const DocumentTypeSchema = z.enum([
  'policy',
  'procedure',
  'diagram',
  'runbook',
  'architecture',
  'sop',
  'network_diagram',
  'rack_diagram',
  'other',
])

export const DocumentStatusSchema = z.enum(['draft', 'published', 'archived'])

export const CreateDocumentSchema = z.object({
  author_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255),
  document_type: DocumentTypeSchema.nullable().optional(),
  content: z.string().nullable().optional(),
  version: z.string().max(50).nullable().optional(),
  status: DocumentStatusSchema.nullable().optional(),
  created_date: z.string().nullable().optional(),
  updated_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const UpdateDocumentSchema = z.object({
  author_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  document_type: DocumentTypeSchema.optional(),
  content: z.string().optional(),
  version: z.string().max(50).optional(),
  status: DocumentStatusSchema.optional(),
  created_date: z.string().optional(),
  updated_date: z.string().optional(),
  notes: z.string().optional(),
})

export const DocumentQuerySchema = z.object({
  search: z.string().optional(),
  author_id: z.string().uuid().optional(),
  document_type: DocumentTypeSchema.optional(),
  status: DocumentStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sort_by: z
    .enum([
      'title',
      'document_type',
      'status',
      'version',
      'created_date',
      'updated_date',
      'created_at',
      'updated_at',
    ])
    .default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})
