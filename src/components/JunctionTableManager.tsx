/**
 * JunctionTableManager Component
 *
 * Generic component for managing many-to-many relationships (junction tables)
 * Displays current associations as removable chips and provides add functionality
 */
'use client'

import React, { useState, useEffect, useRef } from 'react'

export interface JunctionItem {
  id: string
  [key: string]: unknown
}

export interface JunctionTableManagerProps<T extends JunctionItem> {
  // Current associated items
  currentItems: T[]

  // API endpoint to fetch available items to associate
  availableItemsEndpoint: string

  // Function to get display label from item
  getItemLabel: (item: T) => string

  // Callbacks for add/remove operations
  onAdd: (item: T) => Promise<void>
  onRemove: (itemId: string) => Promise<void>

  // Optional props
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function JunctionTableManager<T extends JunctionItem>({
  currentItems,
  availableItemsEndpoint,
  getItemLabel,
  onAdd,
  onRemove,
  placeholder = 'Search to add...',
  emptyMessage = 'No items associated',
  className = '',
  disabled = false,
}: JunctionTableManagerProps<T>) {
  const [availableItems, setAvailableItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch available items
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(availableItemsEndpoint)
        if (!response.ok) throw new Error('Failed to fetch available items')

        const result = await response.json()
        if (result.data && Array.isArray(result.data)) {
          setAvailableItems(result.data)
        }
      } catch (err) {
        console.error('Error fetching available items:', err)
        setError(err instanceof Error ? err.message : 'Failed to load items')
      } finally {
        setLoading(false)
      }
    }

    if (availableItemsEndpoint) {
      fetchAvailable()
    }
  }, [availableItemsEndpoint])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Filter available items (exclude already associated items and apply search)
  const currentItemIds = new Set(currentItems.map((item) => item.id))
  const filteredItems = availableItems.filter((item) => {
    const isNotAssociated = !currentItemIds.has(item.id)
    const matchesSearch = searchQuery
      ? getItemLabel(item).toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return isNotAssociated && matchesSearch
  })

  const handleAdd = async (item: T) => {
    try {
      setOperationInProgress(item.id)
      setError(null)
      await onAdd(item)
      setSearchQuery('')
      setShowDropdown(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setOperationInProgress(null)
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      setOperationInProgress(itemId)
      setError(null)
      await onRemove(itemId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    } finally {
      setOperationInProgress(null)
    }
  }

  return (
    <>
      <div className={`junction-table-manager ${className}`}>
        {/* Current associations */}
        <div className="junction-items">
          {currentItems.length === 0 && <p className="empty-message">{emptyMessage}</p>}

          {currentItems.map((item) => (
            <div key={item.id} className="junction-chip">
              <span className="junction-chip-label">{getItemLabel(item)}</span>
              {!disabled && (
                <button
                  type="button"
                  className="junction-chip-remove"
                  onClick={() => handleRemove(item.id)}
                  disabled={operationInProgress === item.id}
                  aria-label={`Remove ${getItemLabel(item)}`}
                >
                  {operationInProgress === item.id ? '...' : '×'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new association */}
        {!disabled && (
          <div className="junction-add-section" ref={dropdownRef}>
            <div className="junction-search-container">
              <input
                type="text"
                className="junction-search-input"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={loading}
              />

              {showDropdown && (
                <div className="junction-dropdown">
                  {loading && <div className="junction-dropdown-item loading">Loading...</div>}

                  {!loading && filteredItems.length === 0 && (
                    <div className="junction-dropdown-item empty">
                      {searchQuery
                        ? 'No matching items found'
                        : 'All available items are already associated'}
                    </div>
                  )}

                  {!loading &&
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="junction-dropdown-item"
                        onClick={() => handleAdd(item)}
                        disabled={operationInProgress === item.id}
                      >
                        {getItemLabel(item)}
                        {operationInProgress === item.id && ' (adding...)'}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && <div className="junction-error">{error}</div>}
      </div>

      <style jsx>{`
        .junction-table-manager {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .junction-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-height: 2rem;
        }

        .empty-message {
          color: var(--color-brew-black-60, #999);
          font-style: italic;
          margin: 0;
        }

        .junction-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: var(--color-morning-blue, #1c7ff2);
          color: var(--color-off-white, #faf9f5);
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .junction-chip-label {
          line-height: 1.5;
        }

        .junction-chip-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          padding: 0;
          margin: 0;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          color: var(--color-off-white, #faf9f5);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s;
        }

        .junction-chip-remove:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }

        .junction-chip-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .junction-add-section {
          position: relative;
        }

        .junction-search-container {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .junction-search-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-brew-black-60, #999);
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .junction-search-input:focus {
          outline: none;
          border-color: var(--color-morning-blue, #1c7ff2);
        }

        .junction-search-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .junction-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
          background: white;
          border: 1px solid var(--color-brew-black-60, #999);
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .junction-dropdown-item {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: white;
          text-align: left;
          font-size: 1rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s;
        }

        .junction-dropdown-item:not(.loading):not(.empty):hover:not(:disabled) {
          background: var(--color-light-blue, #acd7ff);
        }

        .junction-dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .junction-dropdown-item.loading,
        .junction-dropdown-item.empty {
          color: var(--color-brew-black-60, #999);
          font-style: italic;
          cursor: default;
        }

        .junction-error {
          padding: 0.75rem 1rem;
          background: #fee;
          border: 1px solid var(--color-orange, #fd6a3d);
          border-radius: 4px;
          color: #c00;
          font-size: 0.875rem;
        }

        /* Scrollbar styling */
        .junction-dropdown::-webkit-scrollbar {
          width: 8px;
        }

        .junction-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .junction-dropdown::-webkit-scrollbar-thumb {
          background: var(--color-brew-black-60, #999);
          border-radius: 4px;
        }

        .junction-dropdown::-webkit-scrollbar-thumb:hover {
          background: var(--color-brew-black, #231f20);
        }
      `}</style>
    </>
  )
}
