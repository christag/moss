/**
 * Edit Role Assignment Modal Component
 * Modal for editing role assignment scope and locations
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import type { Location } from '@/types'

interface EditRoleAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  assignmentId: string
  currentScope: 'global' | 'location' | 'specific_objects'
  currentLocationIds: string[]
  currentNotes?: string
  assigneeName: string
  roleName: string
}

type ScopeType = 'global' | 'location' | 'specific_objects'

interface FormData {
  scope: ScopeType
  location_ids: string[]
  notes: string
}

export default function EditRoleAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  assignmentId,
  currentScope,
  currentLocationIds,
  currentNotes,
  assigneeName,
  roleName,
}: EditRoleAssignmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    scope: currentScope,
    location_ids: currentLocationIds || [],
    notes: currentNotes || '',
  })

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form data when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        scope: currentScope,
        location_ids: currentLocationIds || [],
        notes: currentNotes || '',
      })
      setError(null)
      fetchLocations()
    }
  }, [isOpen, currentScope, currentLocationIds, currentNotes])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations?limit=200')
      const data = await response.json()
      if (data.success) {
        setLocations(data.data)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
    }
  }

  const handleScopeChange = (newScope: ScopeType) => {
    setFormData({
      ...formData,
      scope: newScope,
      location_ids: newScope === 'location' ? formData.location_ids : [],
    })
  }

  const handleLocationToggle = (locationId: string) => {
    const currentIds = formData.location_ids
    const newIds = currentIds.includes(locationId)
      ? currentIds.filter((id) => id !== locationId)
      : [...currentIds, locationId]

    setFormData({ ...formData, location_ids: newIds })
  }

  const handleSubmit = async () => {
    // Validation
    if (formData.scope === 'location' && formData.location_ids.length === 0) {
      setError('Please select at least one location for location-scoped assignments')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/role-assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: formData.scope,
          location_ids: formData.scope === 'location' ? formData.location_ids : undefined,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Failed to update role assignment')
      }
    } catch (err) {
      console.error('Error updating role assignment:', err)
      setError('An error occurred while updating the assignment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          padding: 'var(--spacing-xl)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
            Edit Role Assignment
          </h2>
          <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xs)' }}>
            <strong>Assignee:</strong> {assigneeName}
          </p>
          <p style={{ color: 'var(--color-brew-black-60)' }}>
            <strong>Role:</strong> {roleName}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-orange)',
              color: 'var(--color-brew-black)',
              padding: 'var(--spacing-md)',
              borderRadius: '6px',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {error}
          </div>
        )}

        {/* Scope Selection */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Assignment Scope
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Global Scope */}
            <label
              style={{
                display: 'flex',
                alignItems: 'start',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                border: '2px solid',
                borderColor:
                  formData.scope === 'global'
                    ? 'var(--color-morning-blue)'
                    : 'var(--color-brew-black-20)',
                borderRadius: '6px',
                backgroundColor:
                  formData.scope === 'global' ? 'rgba(28, 127, 242, 0.05)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="scope"
                value="global"
                checked={formData.scope === 'global'}
                onChange={() => handleScopeChange('global')}
                style={{ marginRight: 'var(--spacing-sm)', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: '600' }}>Global</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                  Applies to all objects across the entire system
                </div>
              </div>
            </label>

            {/* Location Scope */}
            <label
              style={{
                display: 'flex',
                alignItems: 'start',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                border: '2px solid',
                borderColor:
                  formData.scope === 'location'
                    ? 'var(--color-morning-blue)'
                    : 'var(--color-brew-black-20)',
                borderRadius: '6px',
                backgroundColor:
                  formData.scope === 'location' ? 'rgba(28, 127, 242, 0.05)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="scope"
                value="location"
                checked={formData.scope === 'location'}
                onChange={() => handleScopeChange('location')}
                style={{ marginRight: 'var(--spacing-sm)', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: '600' }}>Location</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                  Applies only to objects in specific locations
                </div>
              </div>
            </label>

            {/* Specific Objects Scope */}
            <label
              style={{
                display: 'flex',
                alignItems: 'start',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                border: '2px solid',
                borderColor:
                  formData.scope === 'specific_objects'
                    ? 'var(--color-morning-blue)'
                    : 'var(--color-brew-black-20)',
                borderRadius: '6px',
                backgroundColor:
                  formData.scope === 'specific_objects'
                    ? 'rgba(28, 127, 242, 0.05)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="scope"
                value="specific_objects"
                checked={formData.scope === 'specific_objects'}
                onChange={() => handleScopeChange('specific_objects')}
                style={{ marginRight: 'var(--spacing-sm)', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: '600' }}>Specific Objects</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                  Applies only to individually specified objects (managed via Object Permissions)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Location Selection (only if scope is location) */}
        {formData.scope === 'location' && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Select Locations
            </label>
            <div
              style={{
                border: '1px solid var(--color-brew-black-20)',
                borderRadius: '6px',
                padding: 'var(--spacing-md)',
                maxHeight: '200px',
                overflow: 'auto',
              }}
            >
              {locations.length === 0 ? (
                <p style={{ color: 'var(--color-brew-black-60)' }}>Loading locations...</p>
              ) : (
                locations.map((location) => (
                  <label
                    key={location.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--spacing-sm)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.location_ids.includes(location.id)}
                      onChange={() => handleLocationToggle(location.id)}
                      style={{ marginRight: 'var(--spacing-sm)' }}
                    />
                    <span>{location.location_name}</span>
                  </label>
                ))
              )}
            </div>
            {formData.location_ids.length > 0 && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-brew-black-60)',
                  marginTop: 'var(--spacing-sm)',
                }}
              >
                {formData.location_ids.length} location
                {formData.location_ids.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label
            htmlFor="notes"
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-brew-black-20)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            placeholder="Add any notes about this assignment..."
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end',
            marginTop: 'var(--spacing-xl)',
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Assignment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
