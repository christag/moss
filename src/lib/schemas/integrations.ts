/**
 * Zod schemas for external integrations (JAMF, Intune, AWS, Azure, etc.)
 */

import { z } from 'zod'

// =============================================================================
// Integration Configuration Schemas
// =============================================================================

export const integrationTypeSchema = z.enum([
  'jamf',
  'intune',
  'aws',
  'azure',
  'gcp',
  'okta',
  'azure_ad',
  'google_workspace',
  'jira',
  'servicenow',
  '1password',
  'bitwarden',
])

export const syncStatusSchema = z.enum(['success', 'failed', 'in_progress', 'partial', 'never'])

export const syncTypeSchema = z.enum(['manual', 'scheduled', 'webhook'])

// Generic integration config schema
export const integrationConfigSchema = z.object({
  id: z.string().uuid(),
  integration_type: integrationTypeSchema,
  name: z.string().min(1).max(255),
  is_enabled: z.boolean(),
  config: z.record(z.any()), // Flexible JSONB object
  credentials_encrypted: z.string().optional().nullable(),
  sync_schedule: z.string().optional().nullable(), // Cron expression
  auto_sync_enabled: z.boolean(),
  last_sync_at: z.string().datetime().optional().nullable(),
  last_sync_status: syncStatusSchema.optional().nullable(),
  last_sync_error: z.string().optional().nullable(),
  sync_settings: z.record(z.any()), // Flexible JSONB object
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by_user_id: z.string().uuid().optional().nullable(),
  updated_by_user_id: z.string().uuid().optional().nullable(),
})

export const createIntegrationConfigSchema = z.object({
  integration_type: integrationTypeSchema,
  name: z.string().min(1).max(255),
  is_enabled: z.boolean().default(false),
  config: z.record(z.any()),
  credentials: z.record(z.string()).optional(), // Plain credentials (will be encrypted)
  sync_schedule: z.string().optional(),
  auto_sync_enabled: z.boolean().default(false),
  sync_settings: z.record(z.any()).default({}),
})

export const updateIntegrationConfigSchema = createIntegrationConfigSchema.partial()

// =============================================================================
// Integration Sync History Schemas
// =============================================================================

export const integrationSyncHistorySchema = z.object({
  id: z.string().uuid(),
  integration_config_id: z.string().uuid(),
  sync_started_at: z.string().datetime(),
  sync_completed_at: z.string().datetime().optional().nullable(),
  status: syncStatusSchema,
  items_processed: z.number().int().default(0),
  items_created: z.number().int().default(0),
  items_updated: z.number().int().default(0),
  items_skipped: z.number().int().default(0),
  items_failed: z.number().int().default(0),
  error_message: z.string().optional().nullable(),
  error_details: z.record(z.any()).optional().nullable(),
  sync_type: syncTypeSchema,
  triggered_by_user_id: z.string().uuid().optional().nullable(),
  duration_seconds: z.number().optional().nullable(),
  created_at: z.string().datetime(),
})

// =============================================================================
// Integration Object Mappings Schemas
// =============================================================================

export const objectMappingSyncStatusSchema = z.enum([
  'synced',
  'conflict',
  'deleted_external',
  'deleted_internal',
])

export const integrationObjectMappingSchema = z.object({
  id: z.string().uuid(),
  integration_config_id: z.string().uuid(),
  external_id: z.string().max(255),
  external_type: z.string().max(50),
  internal_id: z.string().uuid(),
  internal_type: z.string().max(50),
  last_synced_at: z.string().datetime(),
  sync_status: objectMappingSyncStatusSchema,
  external_data: z.record(z.any()).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// =============================================================================
// JAMF-Specific Schemas
// =============================================================================

// JAMF Configuration
export const jamfConfigSchema = z.object({
  base_url: z.string().url(),
  api_version: z.string().default('v1'),
  timeout_seconds: z.number().int().min(10).max(300).default(30),
})

// JAMF Credentials
export const jamfCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

// Alternative: API Client Credentials (Jamf Pro 10.49.0+)
export const jamfClientCredentialsSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
})

// JAMF Sync Settings
export const jamfSyncSettingsSchema = z.object({
  sync_computers: z.boolean().default(true),
  sync_users: z.boolean().default(true),
  sync_groups: z.boolean().default(true),
  sync_mobile_devices: z.boolean().default(false),
  sync_computer_sections: z
    .array(
      z.enum([
        'GENERAL',
        'DISK_ENCRYPTION',
        'PURCHASING',
        'APPLICATIONS',
        'STORAGE',
        'USER_AND_LOCATION',
        'CONFIGURATION_PROFILES',
        'PRINTERS',
        'SERVICES',
        'HARDWARE',
        'LOCAL_USER_ACCOUNTS',
        'CERTIFICATES',
        'ATTACHMENTS',
        'PLUGINS',
        'PACKAGE_RECEIPTS',
        'FONTS',
        'SECURITY',
        'OPERATING_SYSTEM',
        'LICENSED_SOFTWARE',
        'IBEACONS',
        'SOFTWARE_UPDATES',
        'EXTENSION_ATTRIBUTES',
        'CONTENT_CACHING',
        'GROUP_MEMBERSHIPS',
      ])
    )
    .default(['GENERAL', 'HARDWARE', 'SOFTWARE', 'USER_AND_LOCATION', 'GROUP_MEMBERSHIPS']),
  create_missing_locations: z.boolean().default(true),
  update_existing_devices: z.boolean().default(true),
  import_as_device_type: z.string().default('Workstation'), // Default device type
})

// JAMF API Response Schemas

// JAMF Authentication Token
export const jamfAuthTokenSchema = z.object({
  token: z.string(),
  expires: z.string().datetime(),
})

// JAMF Computer Inventory - General Section
export const jamfComputerGeneralSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  assetTag: z.string().optional(),
  barcode1: z.string().optional(),
  barcode2: z.string().optional(),
  enrolledViaAutomatedDeviceEnrollment: z.boolean().optional(),
  jamfBinaryVersion: z.string().optional(),
  lastContactTime: z.string().datetime().optional(),
  lastEnrolledDate: z.string().datetime().optional(),
  lastCloudBackupDate: z.string().datetime().optional(),
  managementId: z.string().uuid().optional(),
  mdmCapable: z
    .object({
      capable: z.boolean().optional(),
      capableUsers: z.array(z.string()).optional(),
    })
    .optional(),
  platform: z.string().optional(),
  remoteManagement: z
    .object({
      managed: z.boolean().optional(),
      managementUsername: z.string().optional(),
    })
    .optional(),
  reportDate: z.string().datetime().optional(),
  supervised: z.boolean().optional(),
  userApprovedMdm: z.boolean().optional(),
})

// JAMF Computer Inventory - Hardware Section
export const jamfComputerHardwareSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  modelIdentifier: z.string().optional(),
  serialNumber: z.string().optional(),
  processorArchitecture: z.string().optional(),
  processorType: z.string().optional(),
  processorCount: z.number().optional(),
  processorCoreCount: z.number().optional(),
  processorSpeedMhz: z.number().optional(),
  totalRamMegabytes: z.number().optional(),
  busSpeedMhz: z.number().optional(),
  cacheSizeKilobytes: z.number().optional(),
  networkAdapterType: z.string().optional(),
  macAddress: z.string().optional(),
  altMacAddress: z.string().optional(),
  batteryCapacityPercent: z.number().optional(),
  appleSilicon: z.boolean().optional(),
})

// JAMF Computer Inventory - Operating System Section
export const jamfComputerOperatingSystemSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  build: z.string().optional(),
  rapidSecurityResponse: z.string().optional(),
  activeDirectoryStatus: z.string().optional(),
  fileVault2Status: z.string().optional(),
  softwareUpdateDeviceId: z.string().optional(),
})

// JAMF Computer Inventory - User and Location Section
export const jamfComputerUserLocationSchema = z.object({
  username: z.string().optional(),
  realname: z.string().optional(),
  email: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  buildingId: z.string().optional(),
  room: z.string().optional(),
})

// JAMF Computer Inventory - Group Memberships
export const jamfComputerGroupMembershipSchema = z.object({
  groupId: z.string().optional(),
  groupName: z.string().optional(),
  smartGroup: z.boolean().optional(),
})

// JAMF Computer Inventory - Full Response
export const jamfComputerInventorySchema = z.object({
  id: z.number(),
  general: jamfComputerGeneralSchema.optional(),
  hardware: jamfComputerHardwareSchema.optional(),
  operatingSystem: jamfComputerOperatingSystemSchema.optional(),
  userAndLocation: jamfComputerUserLocationSchema.optional(),
  groupMemberships: z.array(jamfComputerGroupMembershipSchema).optional(),
  // Add other sections as needed
})

// JAMF Computer Inventory Paginated Response
export const jamfComputersInventoryResponseSchema = z.object({
  totalCount: z.number(),
  results: z.array(jamfComputerInventorySchema),
})

// JAMF Computer Group
export const jamfComputerGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  isSmart: z.boolean(),
  siteId: z.string().optional(),
})

// JAMF Computer Groups Response
export const jamfComputerGroupsResponseSchema = z.object({
  totalCount: z.number(),
  results: z.array(jamfComputerGroupSchema),
})

// JAMF User (from Classic API)
export const jamfUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  position: z.string().optional(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type IntegrationType = z.infer<typeof integrationTypeSchema>
export type SyncStatus = z.infer<typeof syncStatusSchema>
export type SyncType = z.infer<typeof syncTypeSchema>
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>
export type CreateIntegrationConfig = z.infer<typeof createIntegrationConfigSchema>
export type UpdateIntegrationConfig = z.infer<typeof updateIntegrationConfigSchema>
export type IntegrationSyncHistory = z.infer<typeof integrationSyncHistorySchema>
export type IntegrationObjectMapping = z.infer<typeof integrationObjectMappingSchema>

export type JamfConfig = z.infer<typeof jamfConfigSchema>
export type JamfCredentials = z.infer<typeof jamfCredentialsSchema>
export type JamfClientCredentials = z.infer<typeof jamfClientCredentialsSchema>
export type JamfSyncSettings = z.infer<typeof jamfSyncSettingsSchema>
export type JamfAuthToken = z.infer<typeof jamfAuthTokenSchema>
export type JamfComputerInventory = z.infer<typeof jamfComputerInventorySchema>
export type JamfComputersInventoryResponse = z.infer<typeof jamfComputersInventoryResponseSchema>
export type JamfComputerGroup = z.infer<typeof jamfComputerGroupSchema>
export type JamfComputerGroupsResponse = z.infer<typeof jamfComputerGroupsResponseSchema>
export type JamfUser = z.infer<typeof jamfUserSchema>
