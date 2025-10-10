/**
 * Core type definitions for M.O.S.S.
 * Database model types will be generated from the schema
 */

// Common types
export type UUID = string

export type Status = 'active' | 'inactive' | 'retired' | 'repair' | 'storage'

export type CompanyType = 'own_organization' | 'vendor' | 'manufacturer' | 'partner'

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
  parent_device_id?: UUID
  assigned_to_id?: UUID
  location_id?: UUID
  room_id?: UUID
  hostname?: string
  device_type: DeviceType
  serial_number?: string
  model?: string
  manufacturer?: string
  status: Status
  created_at: Date
  updated_at: Date
}
