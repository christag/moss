'use client'

/**
 * Admin Fields Management Page
 * Manage dropdown field options across all object types
 */

import { useState, useEffect, useCallback } from 'react'
import DropdownOptionsTable from '@/components/admin/DropdownOptionsTable'
import AddOptionModal from '@/components/admin/AddOptionModal'
import EditOptionModal from '@/components/admin/EditOptionModal'
import type { DropdownFieldOption } from '@/types'
import { Icon } from '@/components/ui'

export default function FieldsPage() {
  const [options, setOptions] = useState<DropdownFieldOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterObjectType, setFilterObjectType] = useState('')
  const [filterFieldName, setFilterFieldName] = useState('')
  const [filterActiveOnly, setFilterActiveOnly] = useState(true)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState<DropdownFieldOption | null>(null)

  // Archive confirmation
  const [archiveCandidate, setArchiveCandidate] = useState<DropdownFieldOption | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        include_usage_count: 'true',
        limit: '500',
      })

      if (filterObjectType) params.set('object_type', filterObjectType)
      if (filterFieldName) params.set('field_name', filterFieldName)
      if (filterActiveOnly) params.set('is_active', 'true')

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
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filterObjectType, filterFieldName, filterActiveOnly])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const handleEdit = (option: DropdownFieldOption) => {
    setSelectedOption(option)
    setShowEditModal(true)
  }

  const handleArchive = (option: DropdownFieldOption) => {
    setArchiveCandidate(option)
    setShowArchiveConfirm(true)
  }

  const confirmArchive = async () => {
    if (!archiveCandidate) return

    try {
      const needsConfirm = archiveCandidate.usage_count > 0
      const response = await fetch(
        `/api/admin/dropdown-options/${archiveCandidate.id}?confirm=${needsConfirm}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (response.ok && result.success) {
        setShowArchiveConfirm(false)
        setArchiveCandidate(null)
        fetchOptions()
      } else {
        alert(result.message || 'Failed to archive option')
      }
    } catch (err) {
      console.error('Error archiving option:', err)
      alert('An unexpected error occurred')
    }
  }

  // Get unique object types and field names for filters
  const allObjectTypes = Array.from(new Set(options.map((o) => o.object_type))).sort()
  const allFieldNames = filterObjectType
    ? Array.from(
        new Set(options.filter((o) => o.object_type === filterObjectType).map((o) => o.field_name))
      ).sort()
    : Array.from(new Set(options.map((o) => o.field_name))).sort()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Field Management
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Manage dropdown field values across all object types. Add new options, edit labels, or
          archive unused values.
        </p>
      </div>

      {/* Filters and Actions */}
      <div
        style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {/* Object Type Filter */}
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
              Object Type
            </label>
            <select
              value={filterObjectType}
              onChange={(e) => {
                setFilterObjectType(e.target.value)
                setFilterFieldName('') // Reset field filter when object type changes
              }}
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
              <option value="">All Object Types</option>
              {allObjectTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Field Name Filter */}
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
              Field Name
            </label>
            <select
              value={filterFieldName}
              onChange={(e) => setFilterFieldName(e.target.value)}
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
              <option value="">All Fields</option>
              {allFieldNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterActiveOnly}
                onChange={(e) => setFilterActiveOnly(e.target.checked)}
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
                Active only
              </span>
            </label>
          </div>

          {/* Add Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                height: '44px',
                padding: '0 var(--spacing-lg)',
                backgroundColor: 'var(--color-brew-black)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              + Add Option
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--spacing-md)',
              textAlign: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: 'var(--color-brew-black)',
                }}
              >
                {options.length}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
                Total Options
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: 'var(--color-green)',
                }}
              >
                {options.filter((o) => o.is_active).length}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
                Active
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: 'var(--color-brew-black-60)',
                }}
              >
                {options.filter((o) => !o.is_active).length}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
                Archived
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: '#FEE',
            border: '1px solid var(--color-error-border)',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: 'var(--color-error-border)' }}>Error: {error}</p>
          <button
            onClick={fetchOptions}
            style={{
              marginTop: 'var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-error-border)',
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '2px solid var(--color-light-blue)',
              borderTopColor: 'var(--color-morning-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-brew-black-60)' }}>
            Loading dropdown options...
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <DropdownOptionsTable
          options={options}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onRefresh={fetchOptions}
        />
      )}

      {/* Add Modal */}
      <AddOptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchOptions}
        defaultObjectType={filterObjectType}
        defaultFieldName={filterFieldName}
      />

      {/* Edit Modal */}
      <EditOptionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOption(null)
        }}
        onSuccess={fetchOptions}
        option={selectedOption}
      />

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && archiveCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: '0',
            zIndex: '50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setShowArchiveConfirm(false)}
          />

          {/* Modal */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Content */}
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div
                  style={{
                    flexShrink: '0',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="alert-warning-triangle" size={24} aria-label="Warning" />
                </div>
                <div style={{ flex: '1' }}>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--color-brew-black)',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    Archive Dropdown Option
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-brew-black-60)',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    Are you sure you want to archive{' '}
                    <strong>{archiveCandidate.option_label}</strong>?
                  </p>
                  {archiveCandidate.usage_count > 0 ? (
                    <div
                      style={{
                        backgroundColor: '#FFF9E6',
                        padding: 'var(--spacing-md)',
                        borderRadius: '4px',
                        border: '1px solid var(--color-tangerine)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: '#8B6914',
                          display: 'flex',
                          gap: 'var(--spacing-sm)',
                        }}
                      >
                        <Icon name="alert-warning-triangle" size={16} aria-label="Warning" />
                        <span>
                          <strong>Warning:</strong> This option is currently used by{' '}
                          <strong>{archiveCandidate.usage_count}</strong> record(s).
                        </span>
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: '#8B6914',
                          marginTop: 'var(--spacing-sm)',
                        }}
                      >
                        Existing records will retain this value, but it will no longer appear in
                        dropdowns for new records.
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-brew-black-60)',
                      }}
                    >
                      This option is not currently in use and can be safely archived.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                backgroundColor: 'var(--color-off-white)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowArchiveConfirm(false)
                  setArchiveCandidate(null)
                }}
                style={{
                  height: '44px',
                  padding: '0 var(--spacing-lg)',
                  backgroundColor: 'white',
                  color: 'var(--color-brew-black)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '4px',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchive}
                style={{
                  height: '44px',
                  padding: '0 var(--spacing-lg)',
                  backgroundColor: 'var(--color-orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Archive Option
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
