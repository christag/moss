/**
 * Core type definitions for M.O.S.S.
 * Database model types will be generated from the schema
 */

// Common types
export type UUID = string

export type Status = 'active' | 'inactive' | 'retired' | 'repair' | 'storage'

export type DeviceStatus = 'active' | 'retired' | 'repair' | 'storage'

export type CompanyType =
  | 'own_organization'
  | 'vendor'
  | 'manufacturer'
  | 'service_provider'
  | 'partner'
  | 'customer'
  | 'other'

export type PersonType =
  | 'employee'
  | 'contractor'
  | 'vendor_contact'
  | 'partner'
  | 'customer'
  | 'other'

export type DeviceType =
  | 'computer'
  | 'server'
  | 'switch'
  | 'router'
  | 'firewall'
  | 'printer'
  | 'mobile'
  | 'iot'
  | 'appliance'
  | 'av_equipment'
  | 'broadcast_equipment'
  | 'patch_panel'
  | 'ups'
  | 'pdu'
  | 'chassis'
  | 'module'
  | 'blade'

export type GroupType =
  | 'active_directory'
  | 'okta'
  | 'google_workspace'
  | 'jamf_smart_group'
  | 'intune'
  | 'custom'
  | 'distribution_list'
  | 'security'

// Database model types (to be expanded)
export interface Company {
  id: UUID
  company_name: string
  company_type: CompanyType
  website?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  account_number?: string | null
  support_url?: string | null
  support_phone?: string | null
  support_email?: string | null
  tax_id?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

// Input types for creating/updating companies
export interface CreateCompanyInput {
  company_name: string
  company_type: CompanyType
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  account_number?: string
  support_url?: string
  support_phone?: string
  support_email?: string
  tax_id?: string
  notes?: string
}

export interface UpdateCompanyInput {
  company_name?: string
  company_type?: CompanyType
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  account_number?: string
  support_url?: string
  support_phone?: string
  support_email?: string
  tax_id?: string
  notes?: string
}

export interface Location {
  id: UUID
  company_id?: UUID | null
  location_name: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  location_type?: string | null
  timezone?: string | null
  contact_phone?: string | null
  access_instructions?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateLocationInput {
  location_name: string
  company_id?: UUID
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  location_type?: string
  timezone?: string
  contact_phone?: string
  access_instructions?: string
  notes?: string
}

export interface UpdateLocationInput {
  location_name?: string
  company_id?: UUID
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  location_type?: string
  timezone?: string
  contact_phone?: string
  access_instructions?: string
  notes?: string
}

// Room types (matches database CHECK constraint)
export type RoomType =
  | 'office'
  | 'conference_room'
  | 'server_room'
  | 'closet'
  | 'studio'
  | 'control_room'
  | 'edit_bay'
  | 'storage'
  | 'other'

export interface Room {
  id: UUID
  location_id: UUID
  room_name: string
  room_number?: string | null
  room_type?: RoomType | null
  floor?: string | null
  capacity?: number | null
  access_requirements?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateRoomInput {
  location_id: UUID
  room_name: string
  room_number?: string
  room_type?: RoomType
  floor?: string
  capacity?: number
  access_requirements?: string
  notes?: string
}

export interface UpdateRoomInput {
  location_id?: UUID
  room_name?: string
  room_number?: string | null
  room_type?: RoomType | null
  floor?: string | null
  capacity?: number | null
  access_requirements?: string | null
  notes?: string | null
}

export type PersonStatus = 'active' | 'inactive' | 'terminated'

export interface Person {
  id: UUID
  company_id?: UUID | null
  location_id?: UUID | null
  full_name: string
  email?: string | null
  username?: string | null
  employee_id?: string | null
  person_type: PersonType
  department?: string | null
  job_title?: string | null
  phone?: string | null
  mobile?: string | null
  start_date?: Date | null
  status: PersonStatus
  manager_id?: UUID | null
  preferred_contact_method?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreatePersonInput {
  company_id?: UUID
  location_id?: UUID
  full_name: string
  email?: string
  username?: string
  employee_id?: string
  person_type: PersonType
  department?: string
  job_title?: string
  phone?: string
  mobile?: string
  start_date?: string
  status?: PersonStatus
  manager_id?: UUID
  preferred_contact_method?: string
  notes?: string
}

export interface UpdatePersonInput {
  company_id?: UUID | null
  location_id?: UUID | null
  full_name?: string
  email?: string | null
  username?: string | null
  employee_id?: string | null
  person_type?: PersonType
  department?: string | null
  job_title?: string | null
  phone?: string | null
  mobile?: string | null
  start_date?: string | null
  status?: PersonStatus
  manager_id?: UUID | null
  preferred_contact_method?: string | null
  notes?: string | null
}

export interface Device {
  id: UUID
  parent_device_id?: UUID | null
  assigned_to_id?: UUID | null
  last_used_by_id?: UUID | null
  location_id?: UUID | null
  room_id?: UUID | null
  company_id?: UUID | null
  hostname?: string | null
  device_type: DeviceType
  serial_number?: string | null
  model?: string | null
  manufacturer?: string | null
  purchase_date?: Date | null
  warranty_expiration?: Date | null
  install_date?: Date | null
  status: DeviceStatus
  asset_tag?: string | null
  operating_system?: string | null
  os_version?: string | null
  last_audit_date?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateDeviceInput {
  parent_device_id?: UUID
  assigned_to_id?: UUID
  last_used_by_id?: UUID
  location_id?: UUID
  room_id?: UUID
  company_id?: UUID
  hostname?: string
  device_type: DeviceType
  serial_number?: string
  model?: string
  manufacturer?: string
  purchase_date?: string
  warranty_expiration?: string
  install_date?: string
  status?: DeviceStatus
  asset_tag?: string
  operating_system?: string
  os_version?: string
  last_audit_date?: string
  notes?: string
}

export interface UpdateDeviceInput {
  parent_device_id?: UUID | null
  assigned_to_id?: UUID | null
  last_used_by_id?: UUID | null
  location_id?: UUID | null
  room_id?: UUID | null
  company_id?: UUID | null
  hostname?: string | null
  device_type?: DeviceType
  serial_number?: string | null
  model?: string | null
  manufacturer?: string | null
  purchase_date?: string | null
  warranty_expiration?: string | null
  install_date?: string | null
  status?: DeviceStatus
  asset_tag?: string | null
  operating_system?: string | null
  os_version?: string | null
  last_audit_date?: string | null
  notes?: string | null
}

export interface Group {
  id: UUID
  group_name: string
  group_type: GroupType
  description?: string | null
  group_id_external?: string | null
  created_date?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateGroupInput {
  group_name: string
  group_type: GroupType
  description?: string
  group_id_external?: string
  created_date?: string
  notes?: string
}

export interface UpdateGroupInput {
  group_name?: string
  group_type?: GroupType
  description?: string | null
  group_id_external?: string | null
  created_date?: string | null
  notes?: string | null
}

export type NetworkType =
  | 'lan'
  | 'wan'
  | 'dmz'
  | 'guest'
  | 'management'
  | 'storage'
  | 'production'
  | 'broadcast'

export interface Network {
  id: UUID
  location_id?: UUID | null
  parent_network_id?: UUID | null
  network_name: string
  network_address?: string | null
  vlan_id?: number | null
  network_type?: NetworkType | null
  gateway?: string | null
  dns_servers?: string | null
  dhcp_enabled: boolean
  dhcp_range_start?: string | null
  dhcp_range_end?: string | null
  description?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateNetworkInput {
  location_id?: UUID
  parent_network_id?: UUID
  network_name: string
  network_address?: string
  vlan_id?: number
  network_type?: NetworkType
  gateway?: string
  dns_servers?: string
  dhcp_enabled?: boolean
  dhcp_range_start?: string
  dhcp_range_end?: string
  description?: string
  notes?: string
}

export interface UpdateNetworkInput {
  location_id?: UUID | null
  parent_network_id?: UUID | null
  network_name?: string
  network_address?: string | null
  vlan_id?: number | null
  network_type?: NetworkType | null
  gateway?: string | null
  dns_servers?: string | null
  dhcp_enabled?: boolean
  dhcp_range_start?: string | null
  dhcp_range_end?: string | null
  description?: string | null
  notes?: string | null
}

export type InterfaceType =
  | 'ethernet'
  | 'wifi'
  | 'virtual'
  | 'fiber_optic'
  | 'sdi'
  | 'hdmi'
  | 'xlr'
  | 'usb'
  | 'thunderbolt'
  | 'displayport'
  | 'coax'
  | 'serial'
  | 'patch_panel_port'
  | 'power_input'
  | 'power_output'
  | 'other'

export type MediaType =
  | 'single_mode_fiber'
  | 'multi_mode_fiber'
  | 'cat5e'
  | 'cat6'
  | 'cat6a'
  | 'coax'
  | 'wireless'
  | 'ac_power'
  | 'dc_power'
  | 'poe'
  | 'other'

export type IOStatus = 'active' | 'inactive' | 'monitoring' | 'reserved'

export type Duplex = 'full' | 'half' | 'auto' | 'n/a'

export type TrunkMode = 'access' | 'trunk' | 'hybrid' | 'n/a'

export interface IO {
  id: UUID
  device_id?: UUID | null
  room_id?: UUID | null
  native_network_id?: UUID | null
  connected_to_io_id?: UUID | null
  interface_name: string
  interface_type: InterfaceType
  media_type?: MediaType | null
  status: IOStatus
  speed?: string | null
  duplex?: Duplex | null
  trunk_mode?: TrunkMode | null
  port_number?: string | null
  mac_address?: string | null
  voltage?: string | null
  amperage?: string | null
  wattage?: string | null
  power_connector_type?: string | null
  description?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateIOInput {
  device_id?: UUID
  room_id?: UUID
  native_network_id?: UUID
  connected_to_io_id?: UUID
  interface_name: string
  interface_type: InterfaceType
  media_type?: MediaType
  status?: IOStatus
  speed?: string
  duplex?: Duplex
  trunk_mode?: TrunkMode
  port_number?: string
  mac_address?: string
  voltage?: string
  amperage?: string
  wattage?: string
  power_connector_type?: string
  description?: string
  notes?: string
}

export interface UpdateIOInput {
  device_id?: UUID | null
  room_id?: UUID | null
  native_network_id?: UUID | null
  connected_to_io_id?: UUID | null
  interface_name?: string
  interface_type?: InterfaceType
  media_type?: MediaType | null
  status?: IOStatus
  speed?: string | null
  duplex?: Duplex | null
  trunk_mode?: TrunkMode | null
  port_number?: string | null
  mac_address?: string | null
  voltage?: string | null
  amperage?: string | null
  wattage?: string | null
  power_connector_type?: string | null
  description?: string | null
  notes?: string | null
}

// IP Addresses
export type IPVersion = 'v4' | 'v6'
export type IPAddressType = 'static' | 'dhcp' | 'reserved' | 'floating'

export interface IPAddress {
  id: UUID
  io_id?: UUID | null
  network_id?: UUID | null
  ip_address: string
  ip_version?: IPVersion | null
  type?: IPAddressType | null
  dns_name?: string | null
  assignment_date?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateIPAddressInput {
  io_id?: UUID | null
  network_id?: UUID | null
  ip_address: string
  ip_version?: IPVersion
  type?: IPAddressType
  dns_name?: string
  assignment_date?: string
  notes?: string
}

export interface UpdateIPAddressInput {
  io_id?: UUID | null
  network_id?: UUID | null
  ip_address?: string
  ip_version?: IPVersion | null
  type?: IPAddressType | null
  dns_name?: string | null
  assignment_date?: string | null
  notes?: string | null
}

// Software
export type SoftwareCategory =
  | 'productivity'
  | 'security'
  | 'development'
  | 'communication'
  | 'infrastructure'
  | 'collaboration'
  | 'broadcast'
  | 'media'
  | 'other'

export interface Software {
  id: UUID
  company_id?: UUID | null
  product_name: string
  description?: string | null
  website?: string | null
  software_category?: SoftwareCategory | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateSoftwareInput {
  company_id?: UUID
  product_name: string
  description?: string
  website?: string
  software_category?: SoftwareCategory
  notes?: string
}

export interface UpdateSoftwareInput {
  company_id?: UUID | null
  product_name?: string
  description?: string | null
  website?: string | null
  software_category?: SoftwareCategory | null
  notes?: string | null
}

// SaaS Services
export type SaaSEnvironment = 'production' | 'staging' | 'dev' | 'sandbox'
export type SaaSStatus = 'active' | 'trial' | 'inactive' | 'cancelled'
export type SaaSCriticality = 'critical' | 'high' | 'medium' | 'low'

export interface SaaSService {
  id: UUID
  software_id?: UUID | null
  company_id?: UUID | null
  business_owner_id?: UUID | null
  technical_contact_id?: UUID | null
  service_name: string
  service_url?: string | null
  account_id?: string | null
  environment?: SaaSEnvironment | null
  status: SaaSStatus
  subscription_start?: Date | null
  subscription_end?: Date | null
  seat_count?: number | null
  cost?: number | null
  billing_frequency?: string | null
  criticality?: SaaSCriticality | null
  sso_provider?: string | null
  sso_protocol?: string | null
  scim_enabled?: boolean
  provisioning_type?: string | null
  api_access_enabled?: boolean
  api_documentation_url?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface CreateSaaSServiceInput {
  software_id?: UUID
  company_id?: UUID
  business_owner_id?: UUID
  technical_contact_id?: UUID
  service_name: string
  service_url?: string
  account_id?: string
  environment?: SaaSEnvironment
  status?: SaaSStatus
  subscription_start?: string
  subscription_end?: string
  seat_count?: number
  cost?: number
  billing_frequency?: string
  criticality?: SaaSCriticality
  sso_provider?: string
  sso_protocol?: string
  scim_enabled?: boolean
  provisioning_type?: string
  api_access_enabled?: boolean
  api_documentation_url?: string
  notes?: string
}

export interface UpdateSaaSServiceInput {
  software_id?: UUID | null
  company_id?: UUID | null
  business_owner_id?: UUID | null
  technical_contact_id?: UUID | null
  service_name?: string
  service_url?: string | null
  account_id?: string | null
  environment?: SaaSEnvironment | null
  status?: SaaSStatus
  subscription_start?: string | null
  subscription_end?: string | null
  seat_count?: number | null
  cost?: number | null
  billing_frequency?: string | null
  criticality?: SaaSCriticality | null
  sso_provider?: string | null
  sso_protocol?: string | null
  scim_enabled?: boolean
  provisioning_type?: string | null
  api_access_enabled?: boolean
  api_documentation_url?: string | null
  notes?: string | null
}

// Installed Applications
export type DeploymentStatus = 'pilot' | 'production' | 'deprecated' | 'retired'

export interface InstalledApplication {
  id: UUID
  software_id?: UUID | null
  application_name: string
  version?: string | null
  install_method?: string | null
  deployment_platform?: string | null
  package_id?: string | null
  deployment_status?: DeploymentStatus | null
  install_date?: Date | null
  auto_update_enabled?: boolean
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateInstalledApplicationInput {
  software_id?: UUID
  application_name: string
  version?: string
  install_method?: string
  deployment_platform?: string
  package_id?: string
  deployment_status?: DeploymentStatus
  install_date?: string
  auto_update_enabled?: boolean
  notes?: string
}

export interface UpdateInstalledApplicationInput {
  software_id?: UUID | null
  application_name?: string
  version?: string | null
  install_method?: string | null
  deployment_platform?: string | null
  package_id?: string | null
  deployment_status?: DeploymentStatus | null
  install_date?: string | null
  auto_update_enabled?: boolean
  notes?: string | null
}

// Software Licenses
export type LicenseType = 'perpetual' | 'subscription' | 'free' | 'volume' | 'site' | 'concurrent'

export interface SoftwareLicense {
  id: UUID
  software_id?: UUID | null
  purchased_from_id?: UUID | null
  license_key?: string | null
  license_type?: LicenseType | null
  purchase_date?: Date | null
  expiration_date?: Date | null
  seat_count?: number | null
  seats_used?: number | null
  cost?: number | null
  renewal_date?: Date | null
  auto_renew?: boolean
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateSoftwareLicenseInput {
  software_id?: UUID
  purchased_from_id?: UUID
  license_key?: string
  license_type?: LicenseType
  purchase_date?: string
  expiration_date?: string
  seat_count?: number
  seats_used?: number
  cost?: number
  renewal_date?: string
  auto_renew?: boolean
  notes?: string
}

export interface UpdateSoftwareLicenseInput {
  software_id?: UUID | null
  purchased_from_id?: UUID | null
  license_key?: string | null
  license_type?: LicenseType | null
  purchase_date?: string | null
  expiration_date?: string | null
  seat_count?: number | null
  seats_used?: number | null
  cost?: number | null
  renewal_date?: string | null
  auto_renew?: boolean
  notes?: string | null
}

// Documents
export type DocumentType =
  | 'policy'
  | 'procedure'
  | 'diagram'
  | 'runbook'
  | 'architecture'
  | 'sop'
  | 'network_diagram'
  | 'rack_diagram'
  | 'other'
export type DocumentStatus = 'draft' | 'published' | 'archived'

export interface Document {
  id: UUID
  author_id?: UUID | null
  title: string
  document_type?: DocumentType | null
  content?: string | null
  version?: string | null
  status: DocumentStatus
  created_date?: Date | null
  updated_date?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateDocumentInput {
  author_id?: UUID
  title: string
  document_type?: DocumentType
  content?: string
  version?: string
  status?: DocumentStatus
  created_date?: string
  updated_date?: string
  notes?: string
}

export interface UpdateDocumentInput {
  author_id?: UUID | null
  title?: string
  document_type?: DocumentType | null
  content?: string | null
  version?: string | null
  status?: DocumentStatus
  created_date?: string | null
  updated_date?: string | null
  notes?: string | null
}

// ============================================================================
// External Documents Types
// ============================================================================

export type ExternalDocumentType =
  | 'password_vault'
  | 'ssl_certificate'
  | 'domain_registrar'
  | 'ticket'
  | 'runbook'
  | 'diagram'
  | 'wiki_page'
  | 'contract'
  | 'invoice'
  | 'other'

export interface ExternalDocument {
  id: UUID
  title: string
  document_type?: ExternalDocumentType | null
  url?: string | null
  description?: string | null
  notes?: string | null
  created_date?: Date | null
  updated_date?: Date | null
  created_at: Date
  updated_at: Date
}

export interface CreateExternalDocumentInput {
  title: string
  document_type?: ExternalDocumentType
  url?: string
  description?: string
  notes?: string
  created_date?: string
  updated_date?: string
}

export interface UpdateExternalDocumentInput {
  title?: string
  document_type?: ExternalDocumentType | null
  url?: string | null
  description?: string | null
  notes?: string | null
  created_date?: string | null
  updated_date?: string | null
}

// ============================================================================
// Contracts Types
// ============================================================================

export type ContractType =
  | 'support'
  | 'license'
  | 'service'
  | 'lease'
  | 'maintenance'
  | 'consulting'

export interface Contract {
  id: UUID
  company_id?: UUID | null
  contract_name: string
  contract_number?: string | null
  contract_type?: ContractType | null
  start_date?: Date | null
  end_date?: Date | null
  cost?: number | null
  billing_frequency?: string | null
  auto_renew: boolean
  renewal_notice_days?: number | null
  terms?: string | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateContractInput {
  company_id?: UUID
  contract_name: string
  contract_number?: string
  contract_type?: ContractType
  start_date?: string
  end_date?: string
  cost?: number
  billing_frequency?: string
  auto_renew?: boolean
  renewal_notice_days?: number
  terms?: string
  notes?: string
}

export interface UpdateContractInput {
  company_id?: UUID | null
  contract_name?: string
  contract_number?: string | null
  contract_type?: ContractType | null
  start_date?: string | null
  end_date?: string | null
  cost?: number | null
  billing_frequency?: string | null
  auto_renew?: boolean
  renewal_notice_days?: number | null
  terms?: string | null
  notes?: string | null
}

// ============================================================================
// Authentication & Authorization Types
// ============================================================================

/**
 * User role enum - System-level permissions
 * Separate from groups which are organizational units
 */
export type UserRole = 'user' | 'admin' | 'super_admin'

/**
 * User interface - Authentication user linked to a person
 * Key principle: Not all people are users, but all users are people
 */
export interface User {
  id: UUID
  person_id: UUID
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  last_login?: Date | null
  password_changed_at: Date
  created_at: Date
  updated_at: Date
}

/**
 * Session interface - For NextAuth.js session management
 */
export interface Session {
  id: UUID
  user_id: UUID
  session_token: string
  expires: Date
  created_at: Date
  updated_at: Date
}

/**
 * Verification Token interface - For password resets and email verification
 */
export interface VerificationToken {
  identifier: string // Email or user ID
  token: string
  expires: Date
  created_at: Date
}

/**
 * User Details interface - Combined user and person information
 * Matches the user_details database view
 */
export interface UserDetails {
  user_id: UUID
  person_id: UUID
  email: string
  role: UserRole
  is_active: boolean
  last_login?: Date | null
  password_changed_at: Date
  user_created_at: Date
  user_updated_at: Date
  full_name: string
  username?: string | null
  mobile?: string | null
  person_type?: PersonType | null
  company_id?: UUID | null
  company_name?: string | null
  location_id?: UUID | null
  location_name?: string | null
  job_title?: string | null
  department?: string | null
  person_status?: Status | null
}

/**
 * Create User Input - For user creation
 */
export interface CreateUserInput {
  person_id: UUID
  email: string
  password: string // Plain text password (will be hashed)
  role?: UserRole
  is_active?: boolean
}

/**
 * Update User Input - For user updates
 */
export interface UpdateUserInput {
  email?: string
  password?: string // Plain text password (will be hashed)
  role?: UserRole
  is_active?: boolean
}

/**
 * Login Credentials - For authentication
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Auth Session - For client-side session management
 * Simplified version without sensitive data
 */
export interface AuthSession {
  user: {
    id: UUID
    person_id: UUID
    email: string
    full_name: string
    role: UserRole
    is_active: boolean
  }
  expires: string
}

// ============================================================================
// ADMIN SETTINGS TYPES
// ============================================================================

/**
 * System Setting Categories
 */
export type SystemSettingCategory =
  | 'branding'
  | 'authentication'
  | 'storage'
  | 'notifications'
  | 'general'

/**
 * System Setting - Key-value configuration store
 */
export interface SystemSetting {
  key: string
  value: unknown // JSONB value (can be string, number, boolean, object, array)
  category: SystemSettingCategory
  description?: string | null
  updated_by?: UUID | null
  created_at: Date
  updated_at: Date
}

/**
 * Integration Types
 */
export type IntegrationType =
  | 'idp' // Identity Provider (Okta, Azure AD, etc.)
  | 'mdm' // Mobile Device Management (Jamf, Intune)
  | 'rmm' // Remote Monitoring & Management
  | 'cloud_provider' // AWS, Azure, GCP
  | 'ticketing' // Jira, ServiceNow
  | 'monitoring' // Datadog, New Relic
  | 'backup' // Backblaze, Acronis
  | 'other'

/**
 * Integration Providers (common providers for each type)
 */
export type IntegrationProvider =
  // IdP providers
  | 'okta'
  | 'azure_ad'
  | 'google_workspace'
  | 'onelogin'
  | 'auth0'
  // MDM providers
  | 'jamf'
  | 'intune'
  | 'kandji'
  | 'mosyle'
  // RMM providers
  | 'connectwise'
  | 'kaseya'
  | 'ninj armed'
  | 'datto'
  // Cloud providers
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'cloudflare'
  // Ticketing
  | 'jira'
  | 'servicenow'
  | 'zendesk'
  // Monitoring
  | 'datadog'
  | 'new_relic'
  | 'grafana'
  // Backup
  | 'backblaze'
  | 'acronis'
  | 'veeam'
  // Other
  | 'custom'

/**
 * Sync Frequency
 */
export type SyncFrequency = 'manual' | 'hourly' | 'daily' | 'weekly'

/**
 * Sync Status
 */
export type SyncStatus = 'success' | 'failed' | 'in_progress' | 'never_run'

/**
 * Integration Configuration
 */
export interface Integration {
  id: UUID
  integration_type: IntegrationType
  name: string
  provider: string // IntegrationProvider or custom string
  config: Record<string, unknown> // JSONB config (connection details, API keys, etc.)
  sync_enabled: boolean
  sync_frequency?: SyncFrequency | null
  last_sync_at?: Date | null
  last_sync_status?: SyncStatus | null
  is_active: boolean
  notes?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Integration Sync Log Entry
 */
export interface IntegrationSyncLog {
  id: UUID
  integration_id: UUID
  sync_started_at: Date
  sync_completed_at?: Date | null
  status: 'success' | 'failed' | 'in_progress'
  records_processed: number
  records_created: number
  records_updated: number
  records_failed: number
  error_message?: string | null
  details?: Record<string, unknown> | null // JSONB details
  created_at: Date
}

/**
 * Custom Field Type
 */
export type CustomFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'boolean'
  | 'textarea'
  | 'url'
  | 'email'

/**
 * Custom Field Object Type (what object the field applies to)
 */
export type CustomFieldObjectType =
  | 'device'
  | 'person'
  | 'location'
  | 'room'
  | 'network'
  | 'software'
  | 'saas_service'
  | 'software_license'
  | 'document'
  | 'contract'
  | 'company'

/**
 * Custom Field Definition
 */
export interface CustomField {
  id: UUID
  object_type: CustomFieldObjectType
  field_name: string // Technical name (snake_case)
  field_label: string // Display name
  field_type: CustomFieldType
  field_options?: { options: Array<{ value: string; label: string }> } | null // For select/multi_select
  is_required: boolean
  display_order: number
  is_active: boolean
  help_text?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Admin Audit Log Entry
 */
export interface AdminAuditLog {
  id: UUID
  user_id?: UUID | null
  action: string // e.g., 'setting_changed', 'integration_added', 'field_created'
  category: string // e.g., 'branding', 'auth', 'storage', 'integrations', 'fields', 'rbac'
  target_type?: string | null // What type of object was affected
  target_id?: UUID | null // ID of the affected object
  details: Record<string, unknown> // JSONB: before/after values, additional context
  ip_address?: string | null
  user_agent?: string | null
  created_at: Date
}

/**
 * Storage Backend Types
 */
export type StorageBackend = 'local' | 'nfs' | 'smb' | 's3'

/**
 * Authentication Backend Types
 */
export type AuthBackend = 'local' | 'ldap' | 'saml'

/**
 * Branding Settings (extracted from system_settings)
 */
export interface BrandingSettings {
  site_name: string
  logo_url?: string | null
  favicon_url?: string | null
  primary_color: string
  background_color: string
  text_color: string
  accent_color: string
}

/**
 * Authentication Settings (extracted from system_settings)
 */
export interface AuthenticationSettings {
  backend: AuthBackend
  mfa_required: boolean
  session_timeout: number // seconds
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_special: boolean
  saml?: {
    enabled: boolean
    idp_entity_id?: string | null
    idp_sso_url?: string | null
    idp_certificate?: string | null
  }
}

/**
 * Storage Settings (extracted from system_settings)
 */
export interface StorageSettings {
  backend: StorageBackend
  local?: {
    path: string
  }
  s3?: {
    endpoint?: string | null
    bucket?: string | null
    region: string
    access_key?: string | null
    secret_key?: string | null
  }
  nfs?: {
    server?: string | null
    path?: string | null
  }
  smb?: {
    server?: string | null
    share?: string | null
    username?: string | null
    password?: string | null
  }
}

// ============================================================================
// RBAC Types
// ============================================================================

/**
 * Permission action types
 */
export type PermissionAction = 'view' | 'edit' | 'delete' | 'manage_permissions'

/**
 * Object types that can have permissions
 */
export type ObjectType =
  | 'company'
  | 'location'
  | 'room'
  | 'person'
  | 'device'
  | 'io'
  | 'ip_address'
  | 'network'
  | 'software'
  | 'saas_service'
  | 'installed_application'
  | 'software_license'
  | 'document'
  | 'external_document'
  | 'contract'
  | 'group'

/**
 * Role assignment scope
 */
export type RoleScope = 'global' | 'location' | 'specific_objects'

/**
 * Role interface
 */
export interface Role {
  id: UUID
  role_name: string
  description?: string | null
  is_system_role: boolean
  parent_role_id?: UUID | null
  created_date?: Date | null
  created_at: Date
  updated_at: Date
  // Populated fields (from joins)
  parent_role?: Role
}

/**
 * Permission interface
 */
export interface Permission {
  id: UUID
  permission_name: string
  object_type: ObjectType
  action: PermissionAction
  description?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Role-Permission junction (role_permissions table)
 */
export interface RolePermission {
  role_id: UUID
  permission_id: UUID
}

/**
 * Role Assignment interface
 */
export interface RoleAssignment {
  id: UUID
  role_id: UUID
  person_id?: UUID | null
  group_id?: UUID | null
  scope: RoleScope
  granted_by?: UUID | null
  assigned_date?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
  // Populated fields (from joins)
  role?: Role
  person?: Person
  group?: Group
  granted_by_user?: UserDetails
  locations?: Location[] // For location-scoped assignments
}

/**
 * Object-level permission override interface
 */
export interface ObjectPermission {
  id: UUID
  person_id?: UUID | null
  group_id?: UUID | null
  object_type: ObjectType
  object_id: UUID
  permission_type: PermissionAction
  granted_by?: UUID | null
  granted_date?: Date | null
  created_at: Date
  updated_at: Date
  // Populated fields (from joins)
  person?: Person
  group?: Group
  granted_by_user?: UserDetails
}

/**
 * Create Role input
 */
export interface CreateRoleInput {
  role_name: string
  description?: string
  is_system_role?: boolean
  created_date?: Date
}

/**
 * Update Role input
 */
export interface UpdateRoleInput {
  role_name?: string
  description?: string
  created_date?: Date
}

/**
 * Create Permission input
 */
export interface CreatePermissionInput {
  permission_name: string
  object_type: ObjectType
  action: PermissionAction
  description?: string
}

/**
 * Update Permission input
 */
export interface UpdatePermissionInput {
  permission_name?: string
  description?: string
}

/**
 * Create Role Assignment input
 */
export interface CreateRoleAssignmentInput {
  role_id: UUID
  person_id?: UUID
  group_id?: UUID
  scope: RoleScope
  location_ids?: UUID[] // For location-scoped assignments
  assigned_date?: Date
  notes?: string
}

/**
 * Update Role Assignment input
 */
export interface UpdateRoleAssignmentInput {
  scope?: RoleScope
  location_ids?: UUID[]
  assigned_date?: Date
  notes?: string
}

/**
 * Create Object Permission input
 */
export interface CreateObjectPermissionInput {
  person_id?: UUID
  group_id?: UUID
  object_type: ObjectType
  object_id: UUID
  permission_type: PermissionAction
  granted_date?: Date
}

/**
 * Group Member junction (for group_members table)
 */
export interface GroupMember {
  group_id: UUID
  person_id: UUID
}

/**
 * Bulk Operations Types
 * Re-export from bulk-operations module
 */
export type {
  ImportStatus,
  ImportJob,
  ImportResult,
  ValidationError,
  FieldMapping,
  ImportConfiguration,
  ExportConfiguration,
  BulkEditRequest,
  BulkEditResponse,
  BulkDeleteRequest,
  BulkDeleteResponse,
  DuplicateMatch,
  CSVTemplate,
  ImportPreviewRow,
  ImportableObjectType,
  ObjectTypeMetadata,
} from './bulk-operations'

// =============================================================================
// File Attachments
// =============================================================================

/**
 * Object types that support file attachments
 */
export type AttachmentObjectType =
  | 'device'
  | 'person'
  | 'location'
  | 'room'
  | 'network'
  | 'document'
  | 'contract'
  | 'company'
  | 'software'
  | 'saas_service'

/**
 * File attachment status
 */
export type AttachmentStatus = 'active' | 'quarantined' | 'deleted'

/**
 * File metadata stored in JSONB column
 * Flexible structure for different file types
 */
export interface FileMetadata {
  // Image metadata
  width?: number
  height?: number
  format?: string

  // Video metadata
  duration?: number
  codec?: string
  resolution?: string

  // Document metadata
  pageCount?: number
  author?: string
  title?: string

  // EXIF data for images
  exif?: {
    make?: string
    model?: string
    dateTaken?: string
    location?: {
      latitude: number
      longitude: number
    }
  }

  // Thumbnail path (for generated thumbnails)
  thumbnailPath?: string

  // Any other custom metadata
  [key: string]: unknown
}

/**
 * File attachment record
 */
export interface FileAttachment {
  id: UUID
  filename: string // Safe stored filename (UUID-based)
  original_filename: string // User's original filename
  file_size: number // File size in bytes
  mime_type: string // MIME type (image/png, application/pdf, etc.)
  storage_path: string // Backend-specific path or key
  storage_backend: 'local' | 's3' | 'nfs' | 'smb'
  metadata: FileMetadata | null
  uploaded_by: UUID
  uploaded_at: Date
  download_count: number
  status: AttachmentStatus
  created_at: Date
  updated_at: Date

  // Optional joined fields (when querying with JOINs)
  uploader?: {
    id: UUID
    full_name: string
    email: string
  }
}

/**
 * Attachment with parent object information
 */
export interface AttachmentWithObject extends FileAttachment {
  object_type: AttachmentObjectType
  object_id: UUID
  attached_by: UUID
  attached_at: Date
}

/**
 * Upload request payload
 */
export interface UploadRequest {
  object_type: AttachmentObjectType
  object_id: UUID
  filename: string
  file_size: number
  mime_type: string
}

/**
 * Upload response
 */
export interface UploadResponse {
  success: boolean
  data?: {
    attachment_id: UUID
    upload_url?: string // For client-side upload (S3 presigned URL)
    storage_path: string
  }
  message?: string
  error?: string
}

/**
 * Attachment list query parameters
 */
export interface AttachmentListQuery {
  object_type?: AttachmentObjectType
  object_id?: UUID
  mime_type?: string
  status?: AttachmentStatus
  uploaded_by?: UUID
  limit?: number
  offset?: number
  sort_by?: 'uploaded_at' | 'filename' | 'file_size'
  sort_order?: 'asc' | 'desc'
}

/**
 * Download URL response
 */
export interface DownloadUrlResponse {
  success: boolean
  data?: {
    url: string
    expires_at?: string // For presigned URLs
  }
  message?: string
  error?: string
}
