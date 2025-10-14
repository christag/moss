/**
 * CSV Export Utility
 * Converts database query results to CSV format for download
 */

import Papa from 'papaparse'

/**
 * Column definition for CSV export
 */
export interface ExportColumn {
  /** Database column name or accessor function */
  key: string
  /** Human-readable column header */
  label: string
  /** Optional formatter function for values */
  format?: (value: unknown) => string
}

/**
 * Configuration for CSV export
 */
export interface ExportConfig {
  /** Array of column definitions */
  columns: ExportColumn[]
  /** Filename for download (without .csv extension) */
  filename: string
  /** Include header row (default: true) */
  includeHeaders?: boolean
  /** Custom delimiter (default: ',') */
  delimiter?: string
}

/**
 * Converts an array of objects to CSV string
 *
 * @param data - Array of objects to export
 * @param config - Export configuration
 * @returns CSV string ready for download
 *
 * @example
 * const devices = await query('SELECT * FROM devices')
 * const csv = exportToCSV(devices.rows, {
 *   columns: [
 *     { key: 'hostname', label: 'Hostname' },
 *     { key: 'device_type', label: 'Type' },
 *     { key: 'created_at', label: 'Created', format: (val) => new Date(val).toLocaleDateString() }
 *   ],
 *   filename: 'devices'
 * })
 */
export function exportToCSV(data: Record<string, unknown>[], config: ExportConfig): string {
  const { columns, includeHeaders = true, delimiter = ',' } = config

  // Build headers
  const headers = includeHeaders ? columns.map((col) => col.label) : []

  // Transform data rows according to column definitions
  const rows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.key]

      // Apply formatter if provided
      if (col.format) {
        return col.format(value)
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toISOString()
      }

      // Handle objects/arrays (stringify)
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }

      // Return as string
      return String(value)
    })
  })

  // Use Papa Parse to generate CSV
  const csv = Papa.unparse(
    {
      fields: headers,
      data: rows,
    },
    {
      delimiter,
      newline: '\n',
      quotes: true, // Quote all fields
      quoteChar: '"',
      escapeChar: '"',
      header: includeHeaders,
    }
  )

  return csv
}

/**
 * Triggers a browser download of CSV data
 *
 * @param csv - CSV string content
 * @param filename - Filename without extension
 *
 * @example
 * const csv = exportToCSV(data, config)
 * downloadCSV(csv, 'devices-export')
 */
export function downloadCSV(csv: string, filename: string): void {
  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Standard date formatter for CSV exports
 * Converts ISO strings or Date objects to YYYY-MM-DD format
 */
export function formatDate(value: unknown): string {
  if (!value) return ''

  try {
    const date = value instanceof Date ? value : new Date(String(value))
    return date.toISOString().split('T')[0]
  } catch {
    return String(value)
  }
}

/**
 * Standard datetime formatter for CSV exports
 * Converts ISO strings or Date objects to YYYY-MM-DD HH:mm:ss format
 */
export function formatDateTime(value: unknown): string {
  if (!value) return ''

  try {
    const date = value instanceof Date ? value : new Date(String(value))
    return date.toISOString().replace('T', ' ').split('.')[0]
  } catch {
    return String(value)
  }
}

/**
 * Boolean formatter for CSV exports
 * Converts true/false to Yes/No
 */
export function formatBoolean(value: unknown): string {
  if (value === null || value === undefined) return ''
  return value ? 'Yes' : 'No'
}

/**
 * UUID formatter for CSV exports
 * Preserves UUIDs as-is but handles null/undefined
 */
export function formatUUID(value: unknown): string {
  if (!value) return ''
  return String(value)
}

/**
 * Array formatter for CSV exports
 * Converts arrays to comma-separated strings
 */
export function formatArray(value: unknown): string {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}
