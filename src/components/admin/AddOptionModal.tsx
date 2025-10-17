'use client'

/**
 * AddOptionModal Component
 * Modal form for adding new dropdown options
 */

import { useState, useEffect } from 'react'
import type { CreateDropdownOptionInput } from '@/types'

interface AddOptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultObjectType?: string
  defaultFieldName?: string
}

const OBJECT_TYPES = [
  { value: 'companies', label: 'Companies' },
  { value: 'locations', label: 'Locations' },
  { value: 'rooms', label: 'Rooms' },
  { value: 'people', label: 'People' },
  { value: 'devices', label: 'Devices' },
  { value: 'networks', label: 'Networks' },
  { value: 'ios', label: 'IOs (Interfaces/Ports)' },
  { value: 'ip_addresses', label: 'IP Addresses' },
  { value: 'software', label: 'Software' },
  { value: 'saas_services', label: 'SaaS Services' },
  { value: 'installed_applications', label: 'Installed Applications' },
  { value: 'software_licenses', label: 'Software Licenses' },
  { value: 'groups', label: 'Groups' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'documents', label: 'Documents' },
  { value: 'external_documents', label: 'External Documents' },
]

export default function AddOptionModal({
  isOpen,
  onClose,
  defaultObjectType = '',
  defaultFieldName = '',
  onSuccess,
}: AddOptionModalProps) {
  const [formData, setFormData] = useState<CreateDropdownOptionInput>({
    object_type: defaultObjectType,
    field_name: defaultFieldName,
    option_value: '',
    option_label: '',
    display_order: 0,
    color: null,
    description: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [showCustomField, setShowCustomField] = useState(false)

  // Fetch available field names when object type changes
  useEffect(() => {
    if (formData.object_type) {
      fetchAvailableFields(formData.object_type)
    } else {
      setAvailableFields([])
    }
  }, [formData.object_type])

  const fetchAvailableFields = async (objectType: string) => {
    setLoadingFields(true)
    try {
      const response = await fetch(
        `/api/admin/dropdown-options?object_type=${objectType}&limit=500`
      )
      const result = await response.json()

      if (result.success) {
        // Extract unique field names
        const fieldNames = Array.from(
          new Set(result.data.options.map((opt: { field_name: string }) => opt.field_name))
        ).sort()
        setAvailableFields(fieldNames as string[])
      }
    } catch (err) {
      console.error('Error fetching field names:', err)
    } finally {
      setLoadingFields(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/dropdown-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSuccess()
        handleClose()
      } else {
        setError(result.message || 'Failed to create dropdown option')
      }
    } catch (err) {
      console.error('Error creating dropdown option:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      object_type: defaultObjectType,
      field_name: defaultFieldName,
      option_value: '',
      option_label: '',
      display_order: 0,
      color: null,
      description: null,
    })
    setError(null)
    setShowCustomField(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-md)',
        overflowY: 'auto',
      }}
    >
      {/* Background overlay */}
      <div
        style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div
            style={{
              padding: 'var(--spacing-lg)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-brew-black)',
              }}
            >
              Add New Dropdown Option
            </h3>
          </div>

          {/* Modal Content */}
          <div style={{ padding: 'var(--spacing-lg)' }}>
            {error && (
              <div
                style={{
                  marginBottom: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: '#FEE',
                  border: '1px solid var(--color-error-border)',
                  borderRadius: '4px',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-border)' }}>
                  {error}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Object Type - Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Object Type <span style={{ color: 'var(--color-error-border)' }}>*</span>
                </label>
                <select
                  value={formData.object_type}
                  onChange={(e) => {
                    setFormData({ ...formData, object_type: e.target.value, field_name: '' })
                    setShowCustomField(false)
                  }}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">Select an object type...</option>
                  {OBJECT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  The type of object this option applies to
                </p>
              </div>

              {/* Field Name - Dropdown or Custom Input */}
              {formData.object_type && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: 'var(--color-brew-black)',
                      }}
                    >
                      Field Name <span style={{ color: 'var(--color-error-border)' }}>*</span>
                    </label>
                    {availableFields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCustomField(!showCustomField)}
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-morning-blue)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {showCustomField ? 'Select existing field' : 'Create new field'}
                      </button>
                    )}
                  </div>

                  {!showCustomField && availableFields.length > 0 ? (
                    <select
                      value={formData.field_name}
                      onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                      required
                      disabled={loadingFields}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 var(--spacing-sm)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '4px',
                        fontSize: 'var(--font-size-base)',
                        backgroundColor: loadingFields ? 'var(--color-disabled)' : 'white',
                      }}
                    >
                      <option value="">Select a field...</option>
                      {availableFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.field_name}
                      onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                      placeholder="e.g., device_type, status"
                      required
                      pattern="^[a-z_][a-z0-9_]*$"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 var(--spacing-sm)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '4px',
                        fontSize: 'var(--font-size-base)',
                      }}
                    />
                  )}
                  <p
                    style={{
                      marginTop: 'var(--spacing-xs)',
                      fontSize: '11px',
                      color: 'var(--color-brew-black-60)',
                    }}
                  >
                    {showCustomField || availableFields.length === 0
                      ? 'Use snake_case (e.g., device_type, priority_level)'
                      : loadingFields
                        ? 'Loading available fields...'
                        : 'Select an existing field or create a new one'}
                  </p>
                </div>
              )}

              {/* Option Value */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Option Value <span style={{ color: 'var(--color-error-border)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.option_value}
                  onChange={(e) => setFormData({ ...formData, option_value: e.target.value })}
                  placeholder="e.g., laptop, server"
                  required
                  pattern="^[a-z0-9_]+$"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                <p
                  style={{
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  Lowercase with underscores (stored in database)
                </p>
              </div>

              {/* Option Label */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Display Label <span style={{ color: 'var(--color-error-border)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.option_label}
                  onChange={(e) => setFormData({ ...formData, option_label: e.target.value })}
                  placeholder="e.g., Laptop, Server"
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                <p
                  style={{
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  Human-readable label shown in UI
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) })
                  }
                  min="0"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                <p
                  style={{
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  Lower numbers appear first
                </p>
              </div>

              {/* Color */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Badge Color
                </label>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <input
                    type="color"
                    value={formData.color || '#1C7FF2'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      height: '44px',
                      width: '80px',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value || null })}
                    placeholder="#1C7FF2"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    style={{
                      flex: '1',
                      height: '44px',
                      padding: '0 var(--spacing-sm)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '4px',
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <p
                  style={{
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  Optional hex color for badges
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value || null })
                  }
                  placeholder="Optional help text"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              backgroundColor: 'var(--color-off-white)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: 'var(--spacing-sm)',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                height: '44px',
                padding: '0 var(--spacing-lg)',
                backgroundColor: 'white',
                color: 'var(--color-brew-black)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: '44px',
                padding: '0 var(--spacing-lg)',
                backgroundColor: loading ? 'var(--color-brew-black-60)' : 'var(--color-brew-black)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create Option'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
