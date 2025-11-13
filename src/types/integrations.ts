/**
 * TypeScript types for external integration APIs (Okta, Jamf, etc.)
 */

// =============================================================================
// Common Integration Types
// =============================================================================

export interface IntegrationConfig {
  id: string
  integration_type:
    | 'okta'
    | 'jamf'
    | 'azure_ad'
    | 'intune'
    | 'aws'
    | 'gcp'
    | 'idp'
    | 'mdm'
    | 'rmm'
    | 'cloud_provider'
    | 'ticketing'
    | 'monitoring'
    | 'backup'
    | 'other'
  name: string
  is_enabled: boolean
  environment: 'development' | 'staging' | 'production'
  tenant_subdomain?: string
  is_sandbox: boolean
  config: Record<string, unknown>
  credentials_encrypted: string
  access_scope?: Record<string, unknown>
  sync_schedule?: string
  sync_settings?: Record<string, unknown>
  auto_sync_enabled: boolean
  last_sync_at?: string
  last_sync_status?: 'success' | 'failed' | 'in_progress' | 'never'
  last_sync_error?: string
  created_at: string
  updated_at: string
}

export interface IntegrationSyncResult {
  success: boolean
  items_processed: number
  items_created: number
  items_updated: number
  items_skipped: number
  items_failed: number
  errors: Array<{
    item_id?: string
    error: string
    details?: unknown
  }>
  duration_ms: number
}

export interface IntegrationCredentials {
  // Okta credentials
  okta_api_token?: string
  okta_client_id?: string
  okta_client_secret?: string

  // Jamf credentials
  jamf_client_id?: string
  jamf_client_secret?: string
  jamf_username?: string // Legacy basic auth
  jamf_password?: string // Legacy basic auth
}

// =============================================================================
// Okta API Types
// =============================================================================

export interface OktaConfig {
  domain: string // e.g., "dev-123456.okta.com"
  api_version?: string // Default: "v1"
  timeout_ms?: number // Default: 30000
  auth_method: 'api_token' | 'oauth'
}

export interface OktaSyncSettings {
  sync_groups: boolean
  sync_group_members: boolean
  sync_user_metadata: boolean
  sync_app_assignments: boolean
  group_filter?: string | null
  user_match_strategy: 'email' | 'username' | 'employee_id'
  create_missing_users: boolean
  custom_field_mappings: Record<string, string>
}

export interface OktaGroup {
  id: string
  created: string
  lastUpdated: string
  lastMembershipUpdated?: string
  objectClass: string[]
  type: 'OKTA_GROUP' | 'APP_GROUP' | 'BUILT_IN'
  profile: {
    name: string
    description?: string
  }
  _links?: {
    logo?: Array<{ name: string; href: string; type: string }>
    users?: { href: string }
    apps?: { href: string }
  }
}

export interface OktaUser {
  id: string
  status:
    | 'ACTIVE'
    | 'PROVISIONED'
    | 'DEPROVISIONED'
    | 'SUSPENDED'
    | 'STAGED'
    | 'RECOVERY'
    | 'PASSWORD_EXPIRED'
    | 'LOCKED_OUT'
  created: string
  activated?: string
  statusChanged?: string
  lastLogin?: string
  lastUpdated: string
  passwordChanged?: string
  profile: {
    login: string
    email: string
    firstName: string
    lastName: string
    middleName?: string
    honorificPrefix?: string
    honorificSuffix?: string
    title?: string
    displayName?: string
    nickName?: string
    profileUrl?: string
    secondEmail?: string
    mobilePhone?: string
    primaryPhone?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    countryCode?: string
    postalAddress?: string
    preferredLanguage?: string
    locale?: string
    timezone?: string
    userType?: string
    employeeNumber?: string
    costCenter?: string
    organization?: string
    division?: string
    department?: string
    managerId?: string
    manager?: string
  }
  credentials?: {
    password?: unknown
    recovery_question?: unknown
    provider?: unknown
  }
  _links?: Record<string, unknown>
}

export interface OktaTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number // seconds
  scope: string
}

export interface OktaErrorResponse {
  errorCode: string
  errorSummary: string
  errorLink: string
  errorId: string
  errorCauses?: Array<{
    errorSummary: string
  }>
}

// =============================================================================
// SCIM Types (Okta → M.O.S.S.)
// =============================================================================

export interface SCIMUser {
  schemas: string[]
  id?: string
  externalId?: string
  userName: string
  name: {
    formatted?: string
    familyName: string
    givenName: string
    middleName?: string
    honorificPrefix?: string
    honorificSuffix?: string
  }
  displayName?: string
  nickName?: string
  profileUrl?: string
  title?: string
  userType?: string
  preferredLanguage?: string
  locale?: string
  timezone?: string
  active: boolean
  password?: string
  emails: Array<{
    value: string
    type?: 'work' | 'home' | 'other'
    primary?: boolean
  }>
  phoneNumbers?: Array<{
    value: string
    type?: 'work' | 'home' | 'mobile' | 'fax' | 'pager' | 'other'
    primary?: boolean
  }>
  addresses?: Array<{
    formatted?: string
    streetAddress?: string
    locality?: string
    region?: string
    postalCode?: string
    country?: string
    type?: 'work' | 'home' | 'other'
    primary?: boolean
  }>
  groups?: Array<{
    value: string
    $ref?: string
    display?: string
    type?: string
  }>
  meta?: {
    resourceType: 'User'
    created?: string
    lastModified?: string
    location?: string
    version?: string
  }
}

export interface SCIMPatchOp {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp']
  Operations: Array<{
    op: 'add' | 'remove' | 'replace'
    path?: string
    value?: unknown
  }>
}

export interface SCIMListResponse<T> {
  schemas: string[]
  totalResults: number
  startIndex: number
  itemsPerPage: number
  Resources: T[]
}

export interface SCIMError {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:Error']
  status: string
  scimType?: string
  detail?: string
}

// =============================================================================
// Jamf Pro API Types
// =============================================================================

export interface JamfConfig {
  base_url: string // e.g., "https://yourcompany.jamfcloud.com"
  api_version?: string // Default: "v1"
  timeout_ms?: number // Default: 30000
}

export interface JamfSyncSettings {
  sync_computers: boolean
  sync_computer_groups: boolean
  sync_users: boolean
  sync_sections: Array<
    'GENERAL' | 'HARDWARE' | 'SOFTWARE' | 'USER_AND_LOCATION' | 'GROUP_MEMBERSHIPS' | 'SECURITY'
  >
  smart_group_filter?: string | null
  create_missing_locations: boolean
  update_existing_devices: boolean
}

export interface JamfTokenResponse {
  access_token: string
  expires_in: number // seconds (typically 1200 = 20 minutes)
  token_type: 'Bearer'
}

export interface JamfComputerGroup {
  id: string
  name: string
  isSmart: boolean
  site?: {
    id: string
    name: string
  }
}

export interface JamfComputerGroupDetail {
  id: number
  name: string
  is_smart: boolean
  site: {
    id: number
    name: string
  }
  criteria?: Array<{
    name: string
    priority: number
    and_or: 'and' | 'or'
    search_type: string
    value: string
    opening_paren: boolean
    closing_paren: boolean
  }>
  computers: Array<{
    id: number
    name: string
    mac_address: string
    alt_mac_address?: string
    serial_number: string
  }>
}

export interface JamfComputerInventory {
  id: string
  udid: string
  general?: {
    name: string
    assetTag?: string
    barcode1?: string
    barcode2?: string
    lastIpAddress?: string
    lastReportedIp?: string
    jamfBinaryVersion?: string
    platform: 'Mac' | 'iOS' | 'iPadOS' | 'tvOS' | 'Android'
    mdmCapable?: boolean
    reportDate?: string
    remoteManagement?: {
      managed: boolean
      managementUsername?: string
    }
    supervised?: boolean
    enrollmentMethod?: string
  }
  hardware?: {
    make: string
    model: string
    modelIdentifier?: string
    serialNumber: string
    processorType?: string
    processorArchitecture?: 'arm64' | 'x86_64'
    processorSpeedMhz?: number
    processorCores?: number
    totalRamMegabytes?: number
    batteryCapacityPercent?: number
    macAddress: string
    altMacAddress?: string
    extensionAttributes?: Array<{
      id: string
      name: string
      type: string
      value: string
    }>
  }
  userAndLocation?: {
    username?: string
    realname?: string
    email?: string
    position?: string
    phone?: string
    departmentId?: string
    buildingId?: string
    room?: string
  }
  operatingSystem?: {
    name: string
    version: string
    build: string
    supplementalBuildVersion?: string
    rapidSecurityResponse?: string
  }
  security?: {
    activationLockEnabled?: boolean
    recoveryLockEnabled?: boolean
    firewallEnabled?: boolean
    secureBootLevel?: string
    externalBootLevel?: string
    xprotectVersion?: string
    gatekeeperStatus?: string
    sipStatus?: string
    bootstrapTokenAllowed?: boolean
  }
  groupMemberships?: Array<{
    groupId: string
    groupName: string
    smartGroup: boolean
  }>
}

export interface JamfComputerInventoryList {
  totalCount: number
  results: JamfComputerInventory[]
}

export interface JamfUser {
  id: number
  name: string
  full_name?: string
  email?: string
  phone_number?: string
  position?: string
  enabled?: boolean
  ldap_server?: {
    id: number
    name: string
  }
  extension_attributes?: Array<{
    id: number
    name: string
    type: string
    value: string
  }>
  sites?: Array<{
    id: number
    name: string
  }>
  links?: {
    computers?: string
    peripherals?: string
    mobile_devices?: string
    vpp_assignments?: string
  }
}

export interface JamfErrorResponse {
  httpStatus: number
  errors: Array<{
    code: string
    description: string
    id?: string
    field?: string
  }>
}

// =============================================================================
// Integration Object Mapping Types
// =============================================================================

export interface IntegrationObjectMapping {
  id: string
  integration_config_id: string
  external_id: string
  external_type: 'computer' | 'user' | 'group' | 'device' | 'person'
  internal_id: string
  internal_type: 'device' | 'person' | 'group' | 'company' | 'location'
  last_synced_at: string
  sync_status: 'synced' | 'conflict' | 'deleted_external' | 'deleted_internal'
  external_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =============================================================================
// API Client Options
// =============================================================================

export interface APIClientOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export interface PaginationOptions {
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
}
