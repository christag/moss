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
}

export interface CreateNetworkInput {
  location_id?: UUID
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
