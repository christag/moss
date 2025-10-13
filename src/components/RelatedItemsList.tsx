/**
 * RelatedItemsList Component
 *
 * Generic component for displaying related entities in detail page tabs.
 * Fetches data from API based on relationship type and displays in a mini-table.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

/**
 * Column definition for related items
 */
export interface RelatedColumn<T = Record<string, unknown>> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  width?: string
}

/**
 * Props for RelatedItemsList component
 */
export interface RelatedItemsListProps<T = Record<string, unknown>> {
  /** API endpoint to fetch related items (e.g., /api/rooms?location_id=123) */
  apiEndpoint: string
  /** Columns to display in the table */
  columns: RelatedColumn<T>[]
  /** Link pattern for clicking through to detail page (e.g., /rooms/:id) */
  linkPattern?: string
  /** Label for the "Add New" button */
  addButtonLabel?: string
  /** Callback when "Add New" button is clicked */
  onAdd?: () => void
  /** Maximum number of items to show (default: 10) */
  limit?: number
  /** Message to display when no items exist */
  emptyMessage?: string
  /** Optional CSS class for custom styling */
  className?: string
}

/**
 * RelatedItemsList Component
 */
export function RelatedItemsList<T extends { id: string }>({
  apiEndpoint,
  columns,
  linkPattern,
  addButtonLabel,
  onAdd,
  limit = 10,
  emptyMessage = 'No items found',
  className = '',
}: RelatedItemsListProps<T>) {
  const router = useRouter()
  const [items, setItems] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)

        // Add limit to endpoint if not already present
        const url = apiEndpoint.includes('?')
          ? `${apiEndpoint}&limit=${limit}`
          : `${apiEndpoint}?limit=${limit}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch related items')
        }

        const result = await response.json()

        // Handle various response formats:
        // 1. Paginated response with nested array: { data: { rooms: [...], pagination: {...} } }
        // 2. Paginated response with direct array: { data: [...], pagination: {...} }
        // 3. Direct array response: [...]
        if (result.data) {
          // Check if data is an object with a nested array (e.g., { rooms: [], pagination: {} })
          if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            // Find the first array property in data (rooms, devices, people, etc.)
            const arrayKey = Object.keys(result.data).find((key) => Array.isArray(result.data[key]))
            if (arrayKey) {
              setItems(result.data[arrayKey])
              setTotalCount(result.data.pagination?.total_count || result.data[arrayKey].length)
            } else {
              throw new Error('No array found in response data')
            }
          } else if (Array.isArray(result.data)) {
            // Direct array in data property
            setItems(result.data)
            setTotalCount(result.pagination?.total_count || result.data.length)
          } else {
            throw new Error('Unexpected data format')
          }
        } else if (Array.isArray(result)) {
          // Direct array response (no data wrapper)
          setItems(result)
          setTotalCount(result.length)
        } else {
          throw new Error('Unexpected response format')
        }
      } catch (err) {
        console.error('Error fetching related items:', err)
        setError(err instanceof Error ? err.message : 'Failed to load items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [apiEndpoint, limit])

  const handleRowClick = (item: T) => {
    if (linkPattern) {
      const path = linkPattern.replace(':id', item.id)
      router.push(path)
    }
  }

  const renderCellValue = (item: T, column: RelatedColumn<T>) => {
    if (column.render) {
      return column.render(item)
    }

    const value = item[column.key as keyof T]
    if (value === null || value === undefined) {
      return '—'
    }
    return String(value)
  }

  if (loading) {
    return (
      <div className={`related-items-list ${className}`}>
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`related-items-list ${className}`}>
        <div className="error-state">
          <p style={{ color: 'var(--color-orange)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`related-items-list ${className}`}>
        <div className="empty-state">
          <p className="empty-message">{emptyMessage}</p>
          {onAdd && addButtonLabel && (
            <Button variant="primary" onClick={onAdd} style={{ marginTop: '1rem' }}>
              {addButtonLabel}
            </Button>
          )}
        </div>

        <style jsx>{`
          .related-items-list {
            padding: 2rem;
          }

          .empty-state {
            text-align: center;
            padding: 3rem 1rem;
          }

          .empty-message {
            color: var(--color-brew-black-60);
            font-size: 1rem;
            margin: 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className={`related-items-list ${className}`}>
      {/* Header with count and add button */}
      <div className="list-header">
        <div className="count-badge">
          <Badge variant="info">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        {onAdd && addButtonLabel && (
          <Button variant="primary" size="sm" onClick={onAdd}>
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Related items table */}
      <div className="table-container">
        <table className="related-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} style={{ width: column.width }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className={linkPattern ? 'clickable-row' : ''}
              >
                {columns.map((column) => (
                  <td key={String(column.key)}>{renderCellValue(item, column)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show "View All" link if there are more items */}
      {totalCount > limit && (
        <div className="view-all-footer">
          <p className="more-items-text">
            Showing {items.length} of {totalCount} items
          </p>
        </div>
      )}

      <style jsx>{`
        .related-items-list {
          background: var(--color-background);
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .count-badge {
          display: flex;
          align-items: center;
        }

        .loading-state,
        .error-state {
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .loading-state p,
        .error-state p {
          margin: 0;
          font-size: 1rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .related-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .related-table thead {
          background: var(--color-off-white);
          border-bottom: 2px solid var(--color-border);
        }

        .related-table th {
          text-align: left;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          color: var(--color-black);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .related-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
        }

        .related-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .related-table tbody tr.clickable-row {
          cursor: pointer;
        }

        .related-table tbody tr.clickable-row:hover {
          background-color: rgba(var(--color-blue-rgb), 0.05);
        }

        .view-all-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border);
          background: var(--color-off-white);
          text-align: center;
        }

        .more-items-text {
          margin: 0;
          font-size: 0.875rem;
          color: var(--color-brew-black-60);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .related-table {
            font-size: 0.875rem;
          }

          .related-table th,
          .related-table td {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}
