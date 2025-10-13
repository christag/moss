/**
 * CSV Import Utility
 * Handles CSV parsing, field mapping, and validation for bulk imports
 */

import Papa from 'papaparse'
import type { ValidationError, FieldMapping } from '@/types/bulk-operations'

/**
 * Result of CSV parsing operation
 */
export interface ParseResult<T = Record<string, unknown>> {
  success: boolean
  data: T[]
  errors: ValidationError[]
  headers: string[]
  totalRows: number
}

/**
 * Options for CSV parsing
 */
export interface ParseOptions {
  /** Expected headers (for validation) */
  expectedHeaders?: string[]
  /** Maximum rows to parse (default: 1000) */
  maxRows?: number
  /** Skip empty rows (default: true) */
  skipEmptyLines?: boolean
  /** Transform header names (default: trim whitespace) */
  transformHeader?: (header: string) => string
}

/**
 * Parses a CSV file and returns structured data with validation
 *
 * @param file - File object from file input
 * @param options - Parsing options
 * @returns Promise resolving to ParseResult
 *
 * @example
 * const result = await parseCSV(file, {
 *   expectedHeaders: ['hostname', 'device_type', 'manufacturer'],
 *   maxRows: 100
 * })
 */
export async function parseCSV<T = Record<string, unknown>>(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult<T>> {
  const {
    expectedHeaders,
    maxRows = 1000,
    skipEmptyLines = true,
    transformHeader = (h) => h.trim().toLowerCase(),
  } = options

  return new Promise((resolve) => {
    const errors: ValidationError[] = []
    let data: T[] = []
    let headers: string[] = []
    let rowCount = 0

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines,
      transformHeader,
      dynamicTyping: false, // Keep everything as strings for now
      step: (result, parser) => {
        rowCount++

        // Capture headers from first row
        if (headers.length === 0 && result.meta.fields) {
          headers = result.meta.fields
        }

        // Stop if max rows exceeded
        if (rowCount > maxRows) {
          parser.abort()
          errors.push({
            row: rowCount,
            field: '_file',
            message: `Import aborted: Maximum ${maxRows} rows exceeded`,
            value: null,
          })
          return
        }

        // Add row data
        if (result.data) {
          data.push(result.data as T)
        }

        // Report parsing errors
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error) => {
            errors.push({
              row: rowCount,
              field: '_parsing',
              message: error.message,
              value: null,
            })
          })
        }
      },
      complete: () => {
        // Validate headers if expected headers provided
        if (expectedHeaders && expectedHeaders.length > 0) {
          const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))
          if (missingHeaders.length > 0) {
            errors.push({
              row: 0,
              field: '_headers',
              message: `Missing required headers: ${missingHeaders.join(', ')}`,
              value: missingHeaders,
            })
          }
        }

        resolve({
          success: errors.length === 0,
          data,
          errors,
          headers,
          totalRows: data.length,
        })
      },
      error: (error) => {
        errors.push({
          row: 0,
          field: '_file',
          message: `Failed to parse CSV: ${error.message}`,
          value: null,
        })

        resolve({
          success: false,
          data: [],
          errors,
          headers: [],
          totalRows: 0,
        })
      },
    })
  })
}

/**
 * Maps CSV columns to database fields using field mapping configuration
 *
 * @param rows - Parsed CSV rows
 * @param mappings - Array of field mappings
 * @returns Mapped data ready for database insertion
 *
 * @example
 * const mappings = [
 *   { csvColumn: 'Host Name', dbField: 'hostname', required: true },
 *   { csvColumn: 'Type', dbField: 'device_type', required: true }
 * ]
 * const mapped = mapFields(csvData, mappings)
 */
export function mapFields<T = Record<string, unknown>>(
  rows: Record<string, unknown>[],
  mappings: FieldMapping[]
): T[] {
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {}

    mappings.forEach((mapping) => {
      const value = row[mapping.csvColumn]

      // Apply default value if field is missing
      if (value === undefined || value === null || value === '') {
        if (mapping.defaultValue !== undefined) {
          mapped[mapping.dbField] = mapping.defaultValue
        } else {
          mapped[mapping.dbField] = null
        }
      } else {
        // Apply transformation if provided
        if (mapping.transform) {
          mapped[mapping.dbField] = mapping.transform(value)
        } else {
          mapped[mapping.dbField] = value
        }
      }
    })

    return mapped as T
  })
}

/**
 * Validates mapped data against Zod schema
 *
 * @param data - Mapped data to validate
 * @param schema - Zod schema for validation
 * @returns Array of validation errors (empty if valid)
 */
export function validateImportData(
  data: Record<string, unknown>[],
  schema: { parse: (data: unknown) => unknown }
): ValidationError[] {
  const errors: ValidationError[] = []

  data.forEach((row, index) => {
    try {
      schema.parse(row)
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> }
        zodError.errors.forEach((err) => {
          errors.push({
            row: index + 1,
            field: err.path.join('.'),
            message: err.message,
            value: row[err.path[0]],
          })
        })
      } else {
        errors.push({
          row: index + 1,
          field: '_validation',
          message: String(error),
          value: null,
        })
      }
    }
  })

  return errors
}

/**
 * Detects likely field mappings by comparing CSV headers to database fields
 *
 * @param csvHeaders - Headers from CSV file
 * @param dbFields - Available database fields
 * @returns Suggested field mappings
 *
 * @example
 * const suggestions = detectFieldMappings(
 *   ['Host Name', 'Device Type', 'Serial #'],
 *   ['hostname', 'device_type', 'serial_number']
 * )
 */
export function detectFieldMappings(csvHeaders: string[], dbFields: string[]): FieldMapping[] {
  const mappings: FieldMapping[] = []

  csvHeaders.forEach((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_')

    // Try exact match first
    let match = dbFields.find((field) => field === normalized)

    // Try fuzzy match
    if (!match) {
      match = dbFields.find((field) => {
        const fieldNormalized = field.toLowerCase().replace(/[^a-z0-9]/g, '_')
        return fieldNormalized.includes(normalized) || normalized.includes(fieldNormalized)
      })
    }

    mappings.push({
      csvColumn: header,
      dbField: match || '',
      required: false,
    })
  })

  return mappings
}

/**
 * Splits large array into chunks for batch processing
 *
 * @param array - Array to split
 * @param size - Chunk size (default: 100)
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number = 100): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Formats validation errors for display
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'No errors'

  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row]) {
        acc[error.row] = []
      }
      acc[error.row].push(error)
      return acc
    },
    {} as Record<number, ValidationError[]>
  )

  const lines: string[] = []
  Object.entries(errorsByRow).forEach(([row, rowErrors]) => {
    lines.push(`Row ${row}:`)
    rowErrors.forEach((error) => {
      lines.push(`  - ${error.field}: ${error.message}`)
    })
  })

  return lines.join('\n')
}
