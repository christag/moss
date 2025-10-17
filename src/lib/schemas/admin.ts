/**
 * Zod Schemas for Admin Settings
 * Validation schemas for system settings, integrations, custom fields, and audit logs
 */

import { z } from 'zod'

// ============================================================================
// SYSTEM SETTINGS SCHEMAS
// ============================================================================

export const SystemSettingCategorySchema = z.enum([
  'branding',
  'authentication',
  'storage',
  'notifications',
  'general',
])

export const SystemSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.unknown(), // JSONB can be any type
  category: SystemSettingCategorySchema,
  description: z.string().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const UpdateSystemSettingSchema = z.object({
  value: z.unknown(),
  updated_by: z.string().uuid().optional(),
})

// ============================================================================
// BRANDING SCHEMAS
// ============================================================================

export const BrandingSettingsSchema = z.object({
  site_name: z.string().min(1).max(255),
  logo_url: z.string().url().optional().nullable(),
  favicon_url: z.string().url().optional().nullable(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Hex color
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const AuthBackendSchema = z.enum(['local', 'ldap', 'saml'])

export const AuthenticationSettingsSchema = z.object({
  backend: AuthBackendSchema,
  mfa_required: z.boolean(),
  session_timeout: z.number().int().positive(), // seconds
  password_min_length: z.number().int().min(6).max(128),
  password_require_uppercase: z.boolean(),
  password_require_lowercase: z.boolean(),
  password_require_numbers: z.boolean(),
  password_require_special: z.boolean(),
  saml: z
    .object({
      enabled: z.boolean(),
      idp_entity_id: z.string().optional().nullable(),
      idp_sso_url: z.string().url().optional().nullable(),
      idp_certificate: z.string().optional().nullable(),
    })
    .optional(),
})

// ============================================================================
// STORAGE SCHEMAS
// ============================================================================

export const StorageBackendSchema = z.enum(['local', 'nfs', 'smb', 's3'])

export const StorageSettingsSchema = z.object({
  backend: StorageBackendSchema,
  local: z
    .object({
      path: z.string().min(1),
    })
    .optional(),
  s3: z
    .object({
      endpoint: z.string().url().optional().nullable(),
      bucket: z.string().min(1).optional().nullable(),
      region: z.string().min(1),
      access_key: z.string().optional().nullable(),
      secret_key: z.string().optional().nullable(),
    })
    .optional(),
  nfs: z
    .object({
      server: z.string().min(1).optional().nullable(),
      path: z.string().min(1).optional().nullable(),
    })
    .optional(),
  smb: z
    .object({
      server: z.string().min(1).optional().nullable(),
      share: z.string().min(1).optional().nullable(),
      username: z.string().optional().nullable(),
      password: z.string().optional().nullable(),
    })
    .optional(),
})

// ============================================================================
// INTEGRATION SCHEMAS
// ============================================================================

export const IntegrationTypeSchema = z.enum([
  'idp',
  'mdm',
  'rmm',
  'cloud_provider',
  'ticketing',
  'monitoring',
  'backup',
  'other',
])

export const SyncFrequencySchema = z.enum(['manual', 'hourly', 'daily', 'weekly'])

export const SyncStatusSchema = z.enum(['success', 'failed', 'in_progress', 'never_run'])

export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  integration_type: IntegrationTypeSchema,
  name: z.string().min(1).max(255),
  provider: z.string().min(1).max(100),
  config: z.record(z.unknown()), // JSONB object
  sync_enabled: z.boolean(),
  sync_frequency: SyncFrequencySchema.optional().nullable(),
  last_sync_at: z.date().optional().nullable(),
  last_sync_status: SyncStatusSchema.optional().nullable(),
  is_active: z.boolean(),
  notes: z.string().optional().nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const CreateIntegrationSchema = z.object({
  integration_type: IntegrationTypeSchema,
  name: z.string().min(1).max(255),
  provider: z.string().min(1).max(100),
  config: z.record(z.unknown()),
  sync_enabled: z.boolean().default(false),
  sync_frequency: SyncFrequencySchema.default('manual'),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
})

export const UpdateIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  provider: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
  sync_enabled: z.boolean().optional(),
  sync_frequency: SyncFrequencySchema.optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export const IntegrationSyncLogSchema = z.object({
  id: z.string().uuid(),
  integration_id: z.string().uuid(),
  sync_started_at: z.date(),
  sync_completed_at: z.date().optional().nullable(),
  status: z.enum(['success', 'failed', 'in_progress']),
  records_processed: z.number().int().nonnegative(),
  records_created: z.number().int().nonnegative(),
  records_updated: z.number().int().nonnegative(),
  records_failed: z.number().int().nonnegative(),
  error_message: z.string().optional().nullable(),
  details: z.record(z.unknown()).optional().nullable(),
  created_at: z.date().optional(),
})

// ============================================================================
// CUSTOM FIELD SCHEMAS
// ============================================================================

export const CustomFieldTypeSchema = z.enum([
  'text',
  'number',
  'select',
  'multi_select',
  'date',
  'boolean',
  'textarea',
  'url',
  'email',
])

export const CustomFieldObjectTypeSchema = z.enum([
  'device',
  'person',
  'location',
  'room',
  'network',
  'software',
  'saas_service',
  'software_license',
  'document',
  'contract',
  'company',
])

export const CustomFieldSchema = z.object({
  id: z.string().uuid(),
  object_type: CustomFieldObjectTypeSchema,
  field_name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9_]*$/, 'Field name must be snake_case'),
  field_label: z.string().min(1).max(255),
  field_type: CustomFieldTypeSchema,
  field_options: z
    .object({
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      ),
    })
    .optional()
    .nullable(),
  is_required: z.boolean(),
  display_order: z.number().int().nonnegative(),
  is_active: z.boolean(),
  help_text: z.string().optional().nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const CreateCustomFieldSchema = z.object({
  object_type: CustomFieldObjectTypeSchema,
  field_name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9_]*$/, 'Field name must be snake_case'),
  field_label: z.string().min(1).max(255),
  field_type: CustomFieldTypeSchema,
  field_options: z
    .object({
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      ),
    })
    .optional(),
  is_required: z.boolean().default(false),
  display_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
  help_text: z.string().optional(),
})

export const UpdateCustomFieldSchema = z.object({
  field_label: z.string().min(1).max(255).optional(),
  field_options: z
    .object({
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      ),
    })
    .optional()
    .nullable(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  help_text: z.string().optional().nullable(),
})

// ============================================================================
// ADMIN AUDIT LOG SCHEMAS
// ============================================================================

export const AdminAuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  action: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  target_type: z.string().max(50).optional().nullable(),
  target_id: z.string().uuid().optional().nullable(),
  details: z.record(z.unknown()), // JSONB object
  ip_address: z.string().max(50).optional().nullable(),
  user_agent: z.string().optional().nullable(),
  created_at: z.date().optional(),
})

export const CreateAuditLogSchema = z.object({
  user_id: z.string().uuid().optional(),
  action: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  target_type: z.string().max(50).optional(),
  target_id: z.string().uuid().optional(),
  details: z.record(z.unknown()),
  ip_address: z.string().max(50).optional(),
  user_agent: z.string().optional(),
})

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Test Integration Connection
 */
export const TestIntegrationSchema = z.object({
  integration_type: IntegrationTypeSchema,
  provider: z.string().min(1),
  config: z.record(z.unknown()),
})

/**
 * Trigger Integration Sync
 */
export const TriggerSyncSchema = z.object({
  integration_id: z.string().uuid(),
})

/**
 * Update Dropdown Options (for built-in fields)
 */
export const UpdateDropdownOptionsSchema = z.object({
  object_type: z.string().min(1),
  field_name: z.string().min(1),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    })
  ),
})

/**
 * CSV Import Request
 */
export const CSVImportRequestSchema = z.object({
  object_type: z.string().min(1),
  file_url: z.string().url(),
  field_mapping: z.record(z.string()), // Map CSV columns to object fields
  skip_first_row: z.boolean().default(true),
})

/**
 * CSV Export Request
 */
export const CSVExportRequestSchema = z.object({
  object_type: z.string().min(1),
  fields: z.array(z.string()).optional(), // Optional field selection
  filters: z.record(z.unknown()).optional(), // Optional filters
})

// ============================================================================
// DROPDOWN FIELD OPTIONS SCHEMAS
// ============================================================================

/**
 * Create Dropdown Option Schema
 */
export const CreateDropdownOptionSchema = z.object({
  object_type: z.string().min(1).max(50),
  field_name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_][a-z0-9_]*$/, 'Field name must be snake_case'),
  option_value: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Option value must be lowercase alphanumeric with underscores'),
  option_label: z.string().min(1).max(255),
  display_order: z.number().int().nonnegative().default(0),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color')
    .optional()
    .nullable(),
  description: z.string().max(500).optional().nullable(),
})

/**
 * Update Dropdown Option Schema
 */
export const UpdateDropdownOptionSchema = z.object({
  option_label: z.string().min(1).max(255).optional(),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color')
    .optional()
    .nullable(),
  description: z.string().max(500).optional().nullable(),
})

/**
 * Reorder Dropdown Options Schema
 */
export const ReorderDropdownOptionsSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        display_order: z.number().int().nonnegative(),
      })
    )
    .min(1),
})

/**
 * Query Dropdown Options Schema
 */
export const QueryDropdownOptionsSchema = z.object({
  object_type: z
    .string()
    .min(1)
    .max(50)
    .nullish()
    .transform((val) => (val === null ? undefined : val)),
  field_name: z
    .string()
    .min(1)
    .max(50)
    .nullish()
    .transform((val) => (val === null ? undefined : val)),
  is_active: z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null || val === undefined) return undefined
      return val === 'true' || val === '1'
    }),
  include_usage_count: z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null || val === undefined) return true
      return val === 'true' || val === '1'
    }),
  page: z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null || val === undefined) return 1
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 ? 1 : num
    }),
  limit: z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null || val === undefined) return 100
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 ? 100 : Math.min(num, 500)
    }),
})

/**
 * Archive Dropdown Option Request Schema
 * Requires confirmation if usage_count > 0
 */
export const ArchiveDropdownOptionSchema = z.object({
  confirm: z.boolean().optional(), // Must be true if usage_count > 0
})

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type SystemSetting = z.infer<typeof SystemSettingSchema>
export type UpdateSystemSetting = z.infer<typeof UpdateSystemSettingSchema>
export type BrandingSettings = z.infer<typeof BrandingSettingsSchema>
export type AuthenticationSettings = z.infer<typeof AuthenticationSettingsSchema>
export type StorageSettings = z.infer<typeof StorageSettingsSchema>
export type Integration = z.infer<typeof IntegrationSchema>
export type CreateIntegration = z.infer<typeof CreateIntegrationSchema>
export type UpdateIntegration = z.infer<typeof UpdateIntegrationSchema>
export type IntegrationSyncLog = z.infer<typeof IntegrationSyncLogSchema>
export type CustomField = z.infer<typeof CustomFieldSchema>
export type CreateCustomField = z.infer<typeof CreateCustomFieldSchema>
export type UpdateCustomField = z.infer<typeof UpdateCustomFieldSchema>
export type AdminAuditLog = z.infer<typeof AdminAuditLogSchema>
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>
export type TestIntegration = z.infer<typeof TestIntegrationSchema>
export type TriggerSync = z.infer<typeof TriggerSyncSchema>
export type UpdateDropdownOptions = z.infer<typeof UpdateDropdownOptionsSchema>
export type CSVImportRequest = z.infer<typeof CSVImportRequestSchema>
export type CSVExportRequest = z.infer<typeof CSVExportRequestSchema>
