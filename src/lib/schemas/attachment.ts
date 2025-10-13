/**
 * Zod Schemas for File Attachment Validation
 */

import { z } from 'zod'

/**
 * Allowed MIME types for file uploads
 * Matches the system settings default
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Text
  'text/plain',
  'text/csv',
  'text/html',
  'application/json',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
] as const

/**
 * Object types that can have attachments
 */
export const AttachmentObjectTypeSchema = z.enum([
  'device',
  'person',
  'location',
  'room',
  'network',
  'document',
  'contract',
  'company',
  'software',
  'saas_service',
])

/**
 * Attachment status
 */
export const AttachmentStatusSchema = z.enum(['active', 'quarantined', 'deleted'])

/**
 * File metadata schema (flexible JSONB)
 */
export const FileMetadataSchema = z
  .object({
    // Image metadata
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),

    // Video metadata
    duration: z.number().optional(),
    codec: z.string().optional(),
    resolution: z.string().optional(),

    // Document metadata
    pageCount: z.number().optional(),
    author: z.string().optional(),
    title: z.string().optional(),

    // EXIF data
    exif: z
      .object({
        make: z.string().optional(),
        model: z.string().optional(),
        dateTaken: z.string().optional(),
        location: z
          .object({
            latitude: z.number(),
            longitude: z.number(),
          })
          .optional(),
      })
      .optional(),

    // Thumbnail
    thumbnailPath: z.string().optional(),
  })
  .catchall(z.unknown()) // Allow any additional fields

/**
 * Upload request validation schema
 */
export const UploadRequestSchema = z.object({
  object_type: AttachmentObjectTypeSchema,
  object_id: z.string().uuid('Invalid object ID format'),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters'),
  file_size: z.number().int().positive('File size must be a positive number'),
  mime_type: z
    .string()
    .min(1, 'MIME type is required')
    .refine(
      (type): type is (typeof ALLOWED_MIME_TYPES)[number] =>
        ALLOWED_MIME_TYPES.includes(type as (typeof ALLOWED_MIME_TYPES)[number]),
      'This file type is not allowed'
    ),
})

/**
 * Attachment list query schema
 */
export const AttachmentListQuerySchema = z.object({
  object_type: AttachmentObjectTypeSchema.optional(),
  object_id: z.string().uuid().optional(),
  mime_type: z.string().optional(),
  status: AttachmentStatusSchema.optional(),
  uploaded_by: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['uploaded_at', 'filename', 'file_size']).default('uploaded_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * File attachment database schema
 */
export const FileAttachmentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  original_filename: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.string(),
  storage_path: z.string(),
  storage_backend: z.enum(['local', 's3', 'nfs', 'smb']),
  metadata: FileMetadataSchema.nullable(),
  uploaded_by: z.string().uuid(),
  uploaded_at: z.date(),
  download_count: z.number().int().min(0),
  status: AttachmentStatusSchema,
  created_at: z.date(),
  updated_at: z.date(),
})

/**
 * Create attachment record (without auto-generated fields)
 */
export const CreateAttachmentSchema = z.object({
  filename: z.string().max(255),
  original_filename: z.string().max(255),
  file_size: z.number().int().positive(),
  mime_type: z.string().max(100),
  storage_path: z.string(),
  storage_backend: z.enum(['local', 's3', 'nfs', 'smb']),
  metadata: FileMetadataSchema.nullable().optional(),
  uploaded_by: z.string().uuid(),
})

/**
 * Link attachment to object (junction table)
 */
export const LinkAttachmentSchema = z.object({
  attachment_id: z.string().uuid(),
  object_type: AttachmentObjectTypeSchema,
  object_id: z.string().uuid(),
  attached_by: z.string().uuid(),
})

/**
 * Helper function to validate file size against system settings
 */
export function validateFileSize(fileSizeBytes: number, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return fileSizeBytes <= maxSizeBytes
}

/**
 * Helper function to validate MIME type against allowed types
 * Can be customized per system settings
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: readonly string[] = ALLOWED_MIME_TYPES
): boolean {
  return allowedTypes.includes(mimeType)
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/html': 'html',
    'application/json': 'json',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
  }

  return mimeToExtension[mimeType] || 'bin'
}
