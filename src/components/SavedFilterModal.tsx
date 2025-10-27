/**
 * SavedFilterModal Component
 * Modal dialog for saving current filter configuration
 * Allows users to name, describe, and configure filter visibility
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import type { SavedFilterObjectType, FilterConfig } from '@/types'

export interface SavedFilterModalProps {
  /** Object type for the filter */
  objectType: SavedFilterObjectType
  /** Current filter configuration */
  currentFilterConfig: FilterConfig
  /** Callback when filter is saved */
  onSave: (filterId: string) => void
  /** Callback when modal is closed */
  onClose: () => void
  /** Whether modal is open */
  isOpen: boolean
}

/**
 * SavedFilterModal displays a form for saving filter configurations
 */
export function SavedFilterModal({
  objectType,
  currentFilterConfig,
  onSave,
  onClose,
  isOpen,
}: SavedFilterModalProps) {
  const [filterName, setFilterName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  /**
   * Validates and saves the filter
   */
  const handleSave = async () => {
    setError(null)

    // Validation
    if (!filterName.trim()) {
      setError('Please enter a filter name')
      return
    }

    if (filterName.length > 255) {
      setError('Filter name is too long (max 255 characters)')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter_name: filterName,
          description: description || null,
          object_type: objectType,
          filter_config: currentFilterConfig,
          is_public: isPublic,
          is_default: isDefault,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to save filter')
      }

      const result = await response.json()
      onSave(result.data.id)
      onClose()

      // Reset form
      setFilterName('')
      setDescription('')
      setIsPublic(false)
      setIsDefault(false)
    } catch (err) {
      console.error('Error saving filter:', err)
      setError(err instanceof Error ? err.message : 'Failed to save filter')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handles closing the modal
   */
  const handleClose = () => {
    if (!isSaving) {
      setError(null)
      setFilterName('')
      setDescription('')
      setIsPublic(false)
      setIsDefault(false)
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="modal-container" role="dialog" aria-labelledby="save-filter-title">
        <div className="modal-header">
          <h2 id="save-filter-title">Save Filter</h2>
          <button
            className="modal-close-button"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* Filter name */}
          <div className="form-group">
            <label htmlFor="filter-name" className="form-label required">
              Filter Name
            </label>
            <Input
              id="filter-name"
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g., Active network devices"
              maxLength={255}
              disabled={isSaving}
              required
            />
            <span className="field-hint">{filterName.length}/255 characters</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="filter-description" className="form-label">
              Description (Optional)
            </label>
            <Textarea
              id="filter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this filter shows..."
              rows={3}
              maxLength={500}
              disabled={isSaving}
            />
            <span className="field-hint">{description.length}/500 characters</span>
          </div>

          {/* Options */}
          <div className="form-group">
            <div className="checkbox-group">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSaving}
              />
              <label htmlFor="is-public" className="checkbox-label">
                <strong>Public Filter</strong>
                <span className="checkbox-description">Make this filter visible to all users</span>
              </label>
            </div>

            <div className="checkbox-group">
              <Checkbox
                id="is-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isSaving}
              />
              <label htmlFor="is-default" className="checkbox-label">
                <strong>Set as Default</strong>
                <span className="checkbox-description">
                  Automatically apply this filter when viewing {objectType}
                </span>
              </label>
            </div>
          </div>

          {/* Current filter summary */}
          <div className="filter-summary">
            <h3>Current Filter Settings</h3>
            {currentFilterConfig.search && (
              <div className="filter-item">
                <strong>Search:</strong> {currentFilterConfig.search}
              </div>
            )}
            {currentFilterConfig.filters && Object.keys(currentFilterConfig.filters).length > 0 && (
              <div className="filter-item">
                <strong>Filters:</strong>{' '}
                {Object.entries(currentFilterConfig.filters)
                  .filter(([, value]) => value)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ')}
              </div>
            )}
            {currentFilterConfig.sort_by && (
              <div className="filter-item">
                <strong>Sort:</strong> {currentFilterConfig.sort_by} (
                {currentFilterConfig.sort_order || 'asc'})
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <Button onClick={handleClose} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !filterName.trim()}>
            {isSaving ? 'Saving...' : 'Save Filter'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(35, 31, 32, 0.6);
          z-index: 1000;
        }

        .modal-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-off-white);
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          z-index: 1001;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-separator);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .modal-close-button {
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
          color: var(--color-brew-black);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .modal-close-button:hover:not(:disabled) {
          background: rgba(35, 31, 32, 0.1);
        }

        .modal-close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--color-separator);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .form-label.required::after {
          content: ' *';
          color: var(--color-error-border);
        }

        .field-hint {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: var(--color-brew-black-60);
        }

        .checkbox-group {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .checkbox-group:last-child {
          margin-bottom: 0;
        }

        .checkbox-label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          cursor: pointer;
        }

        .checkbox-description {
          font-size: 0.875rem;
          color: var(--color-brew-black-60);
          font-weight: 400;
        }

        .filter-summary {
          background: rgba(28, 127, 242, 0.05);
          border: 1px solid rgba(28, 127, 242, 0.2);
          border-radius: 6px;
          padding: 1rem;
          margin-top: 1.5rem;
        }

        .filter-summary h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-morning-blue);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-item {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-brew-black);
        }

        .filter-item:last-child {
          margin-bottom: 0;
        }

        .filter-item strong {
          color: var(--color-brew-black);
          margin-right: 0.5rem;
        }

        .error-message {
          background: var(--color-error-border);
          color: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </>
  )
}
