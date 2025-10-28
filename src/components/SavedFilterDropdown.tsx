/**
 * SavedFilterDropdown Component
 * Dropdown selector for applying saved filters
 * Displays user's own filters + public filters
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import type { SavedFilter, SavedFilterObjectType, FilterConfig } from '@/types'

export interface SavedFilterDropdownProps {
  /** Object type to filter saved filters by */
  objectType: SavedFilterObjectType
  /** Callback when a filter is selected/applied */
  onFilterApply: (filterConfig: FilterConfig) => void
  /** Callback when filters list changes (for refresh) */
  onFiltersChange?: () => void
}

/**
 * SavedFilterDropdown displays a dropdown of saved filters
 */
export function SavedFilterDropdown({
  objectType,
  onFilterApply,
  onFiltersChange,
}: SavedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(false)
  const [appliedFilterId, setAppliedFilterId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Fetch saved filters from API
   */
  const fetchFilters = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        object_type: objectType,
        limit: '100',
      })

      const response = await fetch(`/api/saved-filters?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch filters')
      }

      const result = await response.json()
      const fetchedFilters = result.data?.saved_filters || []
      setFilters(fetchedFilters)

      // Auto-apply default filter on first load
      const defaultFilter = fetchedFilters.find((f: SavedFilter) => f.is_default)
      if (defaultFilter && !appliedFilterId) {
        handleApplyFilter(defaultFilter)
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch filters on mount and when object type changes
  useEffect(() => {
    fetchFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * Apply a saved filter
   */
  const handleApplyFilter = async (filter: SavedFilter) => {
    try {
      // Record usage
      await fetch(`/api/saved-filters/${filter.id}/apply`, {
        method: 'POST',
      })

      // Apply the filter configuration
      onFilterApply(filter.filter_config)
      setAppliedFilterId(filter.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Error applying filter:', error)
    }
  }

  /**
   * Delete a saved filter
   */
  const handleDeleteFilter = async (filterId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    if (!confirm('Are you sure you want to delete this saved filter?')) {
      return
    }

    try {
      const response = await fetch(`/api/saved-filters/${filterId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete filter')
      }

      // Refresh filters list
      await fetchFilters()
      if (onFiltersChange) {
        onFiltersChange()
      }

      if (appliedFilterId === filterId) {
        setAppliedFilterId(null)
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
      alert('Failed to delete filter')
    }
  }

  /**
   * Clear current filter
   */
  const handleClearFilter = () => {
    onFilterApply({})
    setAppliedFilterId(null)
    setIsOpen(false)
  }

  // Separate own filters and public filters
  const ownFilters = filters.filter((f) => !f.created_by_email || f.created_by_email === '')
  const publicFilters = filters.filter((f) => f.created_by_email && f.created_by_email !== '')

  const appliedFilter = filters.find((f) => f.id === appliedFilterId)

  return (
    <div className="saved-filter-dropdown" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Saved Filters"
        aria-expanded={isOpen}
      >
        {appliedFilter ? `Filter: ${appliedFilter.filter_name}` : 'Saved Filters'}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </Button>

      {isOpen && (
        <div className="dropdown-menu" role="menu">
          {loading ? (
            <div className="dropdown-item disabled">Loading filters...</div>
          ) : filters.length === 0 ? (
            <div className="dropdown-item disabled">No saved filters</div>
          ) : (
            <>
              {appliedFilter && (
                <>
                  <button
                    className="dropdown-item clear-filter"
                    onClick={handleClearFilter}
                    role="menuitem"
                  >
                    <span>✕ Clear Filter</span>
                  </button>
                  <div className="dropdown-divider" />
                </>
              )}

              {ownFilters.length > 0 && (
                <>
                  <div className="dropdown-section-header">Your Filters</div>
                  {ownFilters.map((filter) => (
                    <button
                      key={filter.id}
                      className={`dropdown-item ${filter.id === appliedFilterId ? 'active' : ''}`}
                      onClick={() => handleApplyFilter(filter)}
                      role="menuitem"
                    >
                      <div className="filter-item-content">
                        <div className="filter-name">
                          {filter.filter_name}
                          {filter.is_default && <span className="default-badge">Default</span>}
                        </div>
                        {filter.description && (
                          <div className="filter-description">{filter.description}</div>
                        )}
                        {filter.last_used_at && (
                          <div className="filter-meta">
                            Used {new Date(filter.last_used_at).toLocaleDateString()} (
                            {filter.use_count} times)
                          </div>
                        )}
                      </div>
                      <button
                        className="delete-button"
                        onClick={(e) => handleDeleteFilter(filter.id, e)}
                        aria-label="Delete filter"
                        title="Delete filter"
                      >
                        🗑️
                      </button>
                    </button>
                  ))}
                </>
              )}

              {publicFilters.length > 0 && (
                <>
                  {ownFilters.length > 0 && <div className="dropdown-divider" />}
                  <div className="dropdown-section-header">Public Filters</div>
                  {publicFilters.map((filter) => (
                    <button
                      key={filter.id}
                      className={`dropdown-item ${filter.id === appliedFilterId ? 'active' : ''}`}
                      onClick={() => handleApplyFilter(filter)}
                      role="menuitem"
                    >
                      <div className="filter-item-content">
                        <div className="filter-name">{filter.filter_name}</div>
                        {filter.description && (
                          <div className="filter-description">{filter.description}</div>
                        )}
                        <div className="filter-meta">
                          By {filter.created_by_full_name || filter.created_by_email}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .saved-filter-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-arrow {
          margin-left: 0.5rem;
          font-size: 0.75rem;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 300px;
          max-width: 400px;
          max-height: 500px;
          overflow-y: auto;
          background: white;
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .dropdown-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover:not(.disabled) {
          background: rgba(28, 127, 242, 0.05);
        }

        .dropdown-item.active {
          background: rgba(28, 127, 242, 0.1);
        }

        .dropdown-item.disabled {
          color: var(--color-brew-black-40);
          cursor: not-allowed;
        }

        .dropdown-item.clear-filter {
          color: var(--color-error-border);
          font-weight: 500;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--color-separator);
          margin: 0.5rem 0;
        }

        .dropdown-section-header {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-brew-black-60);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-item-content {
          flex: 1;
          min-width: 0;
        }

        .filter-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--color-brew-black);
          margin-bottom: 0.25rem;
        }

        .default-badge {
          font-size: 0.75rem;
          padding: 2px 6px;
          background: var(--color-green);
          color: white;
          border-radius: 3px;
        }

        .filter-description {
          font-size: 0.875rem;
          color: var(--color-brew-black-60);
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .filter-meta {
          font-size: 0.75rem;
          color: var(--color-brew-black-40);
        }

        .delete-button {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .delete-button:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
