/**
 * ExportModal Component
 * Modal dialog for exporting list data to CSV
 * Supports field selection and format options
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export interface ExportModalProps {
  /** Object type being exported (e.g., 'devices', 'people') */
  objectType: string
  /** Display name for the object type */
  objectTypeName: string
  /** Current query filters from list view */
  currentFilters?: Record<string, string>
  /** Callback when modal is closed */
  onClose: () => void
  /** Whether modal is open */
  isOpen: boolean
}

/**
 * ExportModal displays a modal dialog for CSV export configuration
 */
export function ExportModal({
  objectType,
  objectTypeName,
  currentFilters = {},
  onClose,
  isOpen,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOption, setExportOption] = useState<'all' | 'filtered'>('filtered')

  if (!isOpen) return null

  /**
   * Triggers CSV export download
   */
  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Build query string with filters
      const params = new URLSearchParams()

      // Apply current filters if "filtered" option selected
      if (exportOption === 'filtered') {
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value)
          }
        })
      }

      // Fetch CSV from API
      const response = await fetch(`/api/export/${objectType}?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${objectType}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Close modal
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-[#231F20]">Export {objectTypeName}</h2>
          <p className="text-sm text-[#231F20]/60 mt-1">
            Download {objectTypeName.toLowerCase()} data as CSV
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-3 mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="exportOption"
              value="filtered"
              checked={exportOption === 'filtered'}
              onChange={(e) => setExportOption(e.target.value as 'all' | 'filtered')}
              className="mt-1 w-4 h-4 text-[#1C7FF2] focus:ring-[#1C7FF2]"
            />
            <div>
              <div className="font-medium text-[#231F20]">Export Filtered Results</div>
              <div className="text-sm text-[#231F20]/60">
                Export only items matching current filters and search
                {Object.keys(currentFilters).length > 0 && (
                  <span className="block mt-1 text-xs">
                    Active filters: {Object.keys(currentFilters).length}
                  </span>
                )}
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="exportOption"
              value="all"
              checked={exportOption === 'all'}
              onChange={(e) => setExportOption(e.target.value as 'all' | 'filtered')}
              className="mt-1 w-4 h-4 text-[#1C7FF2] focus:ring-[#1C7FF2]"
            />
            <div>
              <div className="font-medium text-[#231F20]">Export All</div>
              <div className="text-sm text-[#231F20]/60">
                Export all {objectTypeName.toLowerCase()} (ignores filters)
              </div>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-[#ACD7FF]/20 border border-[#ACD7FF] rounded p-3 mb-6">
          <p className="text-sm text-[#231F20]">
            The exported CSV will include all fields with properly formatted dates and values.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>
    </div>
  )
}
