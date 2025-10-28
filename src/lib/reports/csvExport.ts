/**
 * CSV Export for Reports
 * Wrapper around the existing CSV export utility
 * for report-specific exports
 */

import Papa from 'papaparse'

export interface CSVExportOptions {
  reportName: string
  columns: string[]
  data: Record<string, unknown>[]
}

/**
 * Export report data to CSV format
 * Returns a Blob that can be downloaded by the client
 */
export function exportReportToCSV(options: CSVExportOptions): Blob {
  const { columns, data } = options

  // Convert data to CSV using Papa Parse
  const csv = Papa.unparse(data, {
    columns,
    header: true,
    skipEmptyLines: true,
  })

  // Create Blob
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(reportName: string): string {
  const sanitized = reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitized}_${timestamp}.csv`
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSVFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
