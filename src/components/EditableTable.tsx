/**
 * EditableTable Component
 *
 * Generic inline-editable table component with:
 * - Inline cell editing
 * - Multi-row selection
 * - Bulk actions
 * - Add new row functionality
 * - API integration for CRUD operations
 *
 * Pattern similar to SonicWall's interface management table.
 */
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { EditableCell, CellType, SelectOption } from '@/components/EditableCell'
import { BulkActionToolbar, BulkAction } from '@/components/BulkActionToolbar'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export interface ColumnConfig<T = Record<string, unknown>> {
  /** Unique column key */
  key: keyof T | string
  /** Column header label */
  label: string
  /** Column type */
  type: CellType
  /** Width in px or % */
  width?: string
  /** Options for select type */
  options?: SelectOption[]
  /** Is column sortable */
  sortable?: boolean
  /** Is column required for new rows */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Custom render function (for readonly cells) */
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface EditableTableProps<T extends { id: string }> {
  /** API endpoint for fetching data */
  apiEndpoint: string
  /** Columns configuration */
  columns: ColumnConfig<T>[]
  /** Enable row selection */
  selectable?: boolean
  /** Enable add new row */
  addNewRow?: boolean
  /** Add new row button label */
  addNewLabel?: string
  /** Callback for adding new row */
  onAddNew?: () => void
  /** Available bulk actions */
  bulkActions?: BulkAction[]
  /** Enable inline editing */
  editable?: boolean
  /** API endpoint for update (PATCH /api/resource/:id) */
  updateEndpoint?: string
  /** API endpoint for delete (DELETE /api/resource/:id) */
  deleteEndpoint?: string
  /** Empty message */
  emptyMessage?: string
  /** Max rows to display */
  limit?: number
  /** Custom CSS class */
  className?: string
}

export function EditableTable<T extends { id: string }>({
  apiEndpoint,
  columns,
  selectable = false,
  addNewRow = false,
  addNewLabel = 'Add Row',
  onAddNew,
  bulkActions = [],
  editable = true,
  updateEndpoint,
  _deleteEndpoint,
  emptyMessage = 'No items found',
  limit = 100,
  className = '',
}: EditableTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = apiEndpoint.includes('?')
        ? `${apiEndpoint}&limit=${limit}`
        : `${apiEndpoint}?limit=${limit}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()

      // Handle various response formats
      if (result.data) {
        if (Array.isArray(result.data)) {
          setData(result.data)
        } else if (typeof result.data === 'object') {
          // Find first array property
          const arrayKey = Object.keys(result.data).find((key) => Array.isArray(result.data[key]))
          if (arrayKey) {
            setData(result.data[arrayKey])
          }
        }
      } else if (Array.isArray(result)) {
        setData(result)
      }
    } catch (err) {
      console.error('Error fetching table data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle cell update
  const handleCellUpdate = async (rowId: string, columnKey: string, newValue: unknown) => {
    if (!editable || !updateEndpoint) return

    try {
      const endpoint = updateEndpoint.replace(':id', rowId)
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [columnKey]: newValue }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      // Update local data
      setData((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [columnKey]: newValue } : row))
      )

      toast.success('Updated successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
      throw err
    }
  }

  // Handle row selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.map((row) => row.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn as keyof T]
      const bVal = b[sortColumn as keyof T]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  if (loading) {
    return (
      <div className="editable-table-loading">
        <p>Loading...</p>
        <style jsx>{`
          .editable-table-loading {
            padding: 2rem;
            text-align: center;
            color: var(--color-brew-black-60);
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="editable-table-error">
        <p style={{ color: 'var(--color-orange)' }}>Error: {error}</p>
        <Button onClick={fetchData} variant="primary" size="sm">
          Retry
        </Button>
        <style jsx>{`
          .editable-table-error {
            padding: 2rem;
            text-align: center;
          }
        `}</style>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="editable-table-empty">
        <p>{emptyMessage}</p>
        {addNewRow && onAddNew && (
          <Button onClick={onAddNew} variant="primary" size="sm">
            {addNewLabel}
          </Button>
        )}
        <style jsx>{`
          .editable-table-empty {
            padding: 2rem;
            text-align: center;
            color: var(--color-brew-black-60);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className={`editable-table-container ${className}`}>
      {/* Bulk actions toolbar */}
      {selectable && bulkActions.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          totalCount={data.length}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}

      {/* Add new row button */}
      {addNewRow && onAddNew && (
        <div className="add-row-header">
          <Button onClick={onAddNew} variant="primary" size="sm">
            + {addNewLabel}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="editable-table">
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === data.length && data.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  style={{ width: column.width }}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="header-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="sort-icon">
                        {sortColumn === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedData.map((row) => (
              <tr key={row.id} className={selectedIds.has(row.id) ? 'selected' : ''}>
                {selectable && (
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelection(row.id)}
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}

                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render ? (
                      column.render(row[column.key as keyof T], row)
                    ) : (
                      <EditableCell
                        value={row[column.key as keyof T] as string | number | boolean | null}
                        type={column.type}
                        options={column.options}
                        onChange={(newValue) =>
                          handleCellUpdate(row.id, String(column.key), newValue)
                        }
                        disabled={!editable}
                        placeholder={column.placeholder}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .editable-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .add-row-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid rgba(var(--color-black-rgb), 0.1);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .editable-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .editable-table thead {
          background: var(--color-off-white);
          border-bottom: 2px solid rgba(var(--color-black-rgb), 0.1);
        }

        .editable-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-weight: 600;
          color: var(--color-black);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .editable-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .editable-table th.sortable:hover {
          background: rgba(var(--color-blue-rgb), 0.05);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-icon {
          font-size: 0.75rem;
          color: var(--color-brew-black-60);
        }

        .editable-table td {
          padding: 0;
          border-bottom: 1px solid rgba(var(--color-black-rgb), 0.05);
        }

        .editable-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .editable-table tbody tr:hover {
          background: rgba(var(--color-blue-rgb), 0.02);
        }

        .editable-table tbody tr.selected {
          background: rgba(var(--color-blue-rgb), 0.08);
        }

        .checkbox-col {
          width: 40px;
          text-align: center;
          padding: 0.5rem !important;
        }

        .checkbox-col input[type='checkbox'] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        @media (max-width: 768px) {
          .editable-table {
            font-size: 0.85rem;
          }

          .editable-table th,
          .editable-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
