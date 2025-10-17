'use client'

/**
 * DynamicDropdown Component
 * Fetches dropdown options from the database instead of using hardcoded enums
 * Supports active/archived options and custom styling
 */

import { useEffect, useState, useCallback } from 'react'
import type { DropdownFieldOption } from '@/types'

interface DynamicDropdownProps {
  objectType: string
  fieldName: string
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  showArchived?: boolean
  className?: string
  error?: string
}

export default function DynamicDropdown({
  objectType,
  fieldName,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  showArchived = false,
  className = '',
  error,
}: DynamicDropdownProps) {
  const [options, setOptions] = useState<DropdownFieldOption[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)

      const params = new URLSearchParams({
        object_type: objectType,
        field_name: fieldName,
        include_usage_count: 'false', // Don't need usage counts in dropdowns
      })

      // Only fetch active options unless showArchived is true
      if (!showArchived) {
        params.set('is_active', 'true')
      }

      const response = await fetch(`/api/admin/dropdown-options?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch dropdown options')
      }

      const result = await response.json()

      if (result.success) {
        setOptions(result.data.options)
      } else {
        throw new Error(result.message || 'Failed to fetch options')
      }
    } catch (err) {
      console.error('Error fetching dropdown options:', err)
      setFetchError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [objectType, fieldName, showArchived])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Find the selected option to check if it's archived
  const selectedOption = options.find((opt) => opt.option_value === value)
  const isSelectedArchived = selectedOption && !selectedOption.is_active

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isSelectedArchived ? 'bg-yellow-50' : ''}
        `}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>

        {/* Active options */}
        {options
          .filter((opt) => opt.is_active)
          .map((option) => (
            <option key={option.id} value={option.option_value}>
              {option.option_label}
            </option>
          ))}

        {/* Archived options (only show if currently selected or showArchived is true) */}
        {options
          .filter((opt) => !opt.is_active && (showArchived || opt.option_value === value))
          .map((option) => (
            <option key={option.id} value={option.option_value} disabled={!showArchived}>
              {option.option_label} (Archived)
            </option>
          ))}
      </select>

      {/* Show warning if selected value is archived */}
      {isSelectedArchived && (
        <p className="mt-1 text-sm text-yellow-600">
          ⚠️ This option is archived and cannot be selected for new records
        </p>
      )}

      {/* Show error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Show fetch error */}
      {fetchError && (
        <p className="mt-1 text-sm text-red-600">Error loading options: {fetchError}</p>
      )}

      {/* Show empty state */}
      {!loading && !fetchError && options.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No options available for this field</p>
      )}
    </div>
  )
}
