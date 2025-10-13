/**
 * Types for Bulk Operations (CSV Import/Export, Bulk Edit/Delete)
 */

// Import Job Status
export type ImportStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

// Import Job - Tracks CSV import operations
export interface ImportJob {
  id: string
  user_id: string
  object_type: string
  file_name: string
  file_size?: number
  status: ImportStatus
  row_count?: number
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

// Import Result - Detailed outcome of import operation
export interface ImportResult {
  id: string
  job_id: string
  rows_processed: number
  rows_created: number
  rows_updated: number
  rows_failed: number
  errors_json?: ValidationError[]
  completed_at: string
}

// Validation Error - Error encountered during validation or import
export interface ValidationError {
  row: number
  field: string
  value: unknown
  error: string
  severity?: 'error' | 'warning'
}

// Field Mapping - Maps CSV column to M.O.S.S. field
export interface FieldMapping {
  csvColumn: string // Column name from CSV file
  mossField: string // Field name in M.O.S.S. object
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'uuid' | 'email' | 'url'
  required: boolean
  transform?: (value: unknown) => unknown // Optional transformation function
}

// Import Configuration - User's import settings
export interface ImportConfiguration {
  objectType: string
  fieldMappings: FieldMapping[]
  skipDuplicates?: boolean
  updateExisting?: boolean
  validateOnly?: boolean // If true, only validate without importing
}

// CSV Export Configuration
export interface ExportConfiguration {
  objectType: string
  columns: string[] // Field names to include
  filters?: Record<string, string> // Applied filters
  includeHeaders?: boolean
  format?: 'csv' | 'xlsx'
}

// Bulk Edit Request
export interface BulkEditRequest {
  objectType: string
  ids: string[] // Array of record IDs to update
  field: string // Field to update
  value: unknown // New value
}

// Bulk Edit Response
export interface BulkEditResponse {
  success: boolean
  updated: number
  failed: number
  errors?: Array<{ id: string; error: string }>
}

// Bulk Delete Request
export interface BulkDeleteRequest {
  objectType: string
  ids: string[] // Array of record IDs to delete
}

// Bulk Delete Response
export interface BulkDeleteResponse {
  success: boolean
  deleted: number
  failed: number
  errors?: Array<{ id: string; error: string; reason: string }>
}

// Duplicate Detection Result
export interface DuplicateMatch {
  csvRow: number
  existingRecord: Record<string, unknown>
  matchedField: string // Field that matched (e.g., 'serial_number', 'email')
  action?: 'skip' | 'update' | 'create' // User's chosen action
}

// CSV Template - Metadata for downloadable templates
export interface CSVTemplate {
  objectType: string
  headers: string[]
  sampleRows: Record<string, unknown>[]
  fieldDescriptions?: Record<string, string>
}

// Import Preview Row - Row data with validation status
export interface ImportPreviewRow {
  rowNumber: number
  data: Record<string, unknown>
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
}

// Importable Object Types
export type ImportableObjectType =
  | 'device'
  | 'person'
  | 'location'
  | 'room'
  | 'network'
  | 'company'
  | 'group'
  | 'software'
  | 'saas_service'
  | 'software_license'
  | 'installed_application'
  | 'contract'
  | 'document'
  | 'external_document'

// Object Type Metadata - Configuration per object type
export interface ObjectTypeMetadata {
  type: ImportableObjectType
  label: string // Display name
  requiredFields: string[]
  uniqueFields: string[] // Fields that must be unique (for duplicate detection)
  foreignKeyFields: Record<string, string> // Field name → referenced table
  editableFields: string[] // Fields that can be bulk edited
}
