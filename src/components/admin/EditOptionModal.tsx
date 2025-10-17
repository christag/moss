'use client'

/**
 * EditOptionModal Component
 * Modal form for editing existing dropdown options
 */

import { useState, useEffect } from 'react'
import type { DropdownFieldOption, UpdateDropdownOptionInput } from '@/types'

interface EditOptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  option: DropdownFieldOption | null
}

export default function EditOptionModal({
  isOpen,
  onClose,
  onSuccess,
  option,
}: EditOptionModalProps) {
  const [formData, setFormData] = useState<UpdateDropdownOptionInput>({
    option_label: '',
    display_order: 0,
    is_active: true,
    color: null,
    description: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (option) {
      setFormData({
        option_label: option.option_label,
        display_order: option.display_order,
        is_active: option.is_active,
        color: option.color,
        description: option.description,
      })
    }
  }, [option])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!option) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/dropdown-options/${option.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSuccess()
        handleClose()
      } else {
        setError(result.message || 'Failed to update dropdown option')
      }
    } catch (err) {
      console.error('Error updating dropdown option:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen || !option) return null

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
              Edit Dropdown Option
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
              {/* Read-only fields */}
              <div
                style={{
                  backgroundColor: 'var(--color-off-white)',
                  padding: 'var(--spacing-md)',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'var(--spacing-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500', color: 'var(--color-brew-black-60)' }}>
                      Object Type:
                    </span>
                    <span
                      style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-brew-black)' }}
                    >
                      {option.object_type}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500', color: 'var(--color-brew-black-60)' }}>
                      Field Name:
                    </span>
                    <span
                      style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-brew-black)' }}
                    >
                      {option.field_name}
                    </span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontWeight: '500', color: 'var(--color-brew-black-60)' }}>
                      Value:
                    </span>
                    <span
                      style={{
                        marginLeft: 'var(--spacing-sm)',
                        color: 'var(--color-brew-black)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {option.option_value}
                    </span>
                  </div>
                  {option.usage_count > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontWeight: '500', color: 'var(--color-brew-black-60)' }}>
                        Used by:
                      </span>
                      <span
                        style={{
                          marginLeft: 'var(--spacing-sm)',
                          color: 'var(--color-brew-black)',
                        }}
                      >
                        {option.usage_count} record(s)
                      </span>
                    </div>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-brew-black-60)',
                    marginTop: 'var(--spacing-sm)',
                  }}
                >
                  These fields cannot be changed
                </p>
              </div>

              {/* Editable fields */}

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

              {/* Active Status */}
              {!option.is_system && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{
                        width: '19px',
                        height: '19px',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        marginLeft: 'var(--spacing-sm)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-brew-black)',
                      }}
                    >
                      Active (shown in dropdowns)
                    </span>
                  </label>
                  {!formData.is_active && option.usage_count > 0 && (
                    <p
                      style={{
                        marginTop: 'var(--spacing-xs)',
                        fontSize: '11px',
                        color: '#8B6914',
                      }}
                    >
                      ⚠️ Existing records will keep this value, but it won&apos;t appear in
                      dropdowns
                    </p>
                  )}
                </div>
              )}

              {option.is_system && (
                <div
                  style={{
                    backgroundColor: '#E3F2FD',
                    padding: 'var(--spacing-md)',
                    borderRadius: '4px',
                    border: '1px solid var(--color-morning-blue)',
                  }}
                >
                  <p
                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-morning-blue)' }}
                  >
                    🔒 This is a system option and cannot be archived
                  </p>
                </div>
              )}

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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
