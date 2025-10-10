'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

/**
 * Column definition for the generic list view
 */
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  width?: string
}

/**
 * Filter definition for the generic list view
 */
export interface Filter {
  key: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: { value: string; label: string }[]
  placeholder?: string
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number
  limit: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

/**
 * Props for GenericListView component
 */
export interface GenericListViewProps<T> {
  title: string
  columns: Column<T>[]
  data: T[]
  pagination?: Pagination
  filters?: Filter[]
  filterValues?: Record<string, string>
  searchPlaceholder?: string
  searchValue?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  loading?: boolean
  onSearch?: (value: string) => void
  onFilterChange?: (key: string, value: string) => void
  onSort?: (column: string) => void
  onPageChange?: (page: number) => void
  onAdd?: () => void
  addButtonLabel?: string
  emptyMessage?: string
  rowLink?: (item: T) => string
}

/**
 * Generic List View Component
 * Reusable table-based list view for any object type
 */
export function GenericListView<T extends { id: string }>({
  title,
  columns,
  data,
  pagination,
  filters,
  filterValues = {},
  searchPlaceholder = 'Search...',
  searchValue = '',
  sortBy,
  sortOrder = 'asc',
  loading = false,
  onSearch,
  onFilterChange,
  onSort,
  onPageChange,
  onAdd,
  addButtonLabel = 'Add New',
  emptyMessage = 'No items found.',
  rowLink,
}: GenericListViewProps<T>) {
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(searchValue)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    if (onFilterChange) {
      onFilterChange(key, value)
    }
  }

  const handleSort = (column: Column<T>) => {
    if (column.sortable !== false && onSort) {
      onSort(column.key as string)
    }
  }

  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item)
    }

    const value = item[column.key as keyof T]
    return value !== null && value !== undefined ? String(value) : '-'
  }

  return (
    <>
      {/* Blue Page Header with Title and Filters */}
      <div
        style={{
          backgroundColor: 'var(--color-blue)',
          color: 'var(--color-off-white)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="container">
          <div className="p-lg">
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom:
                  onSearch || (filters && filters.length > 0) ? 'var(--spacing-lg)' : '0',
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-size-h2)',
                  fontWeight: '700',
                  color: 'var(--color-off-white)',
                  margin: '0',
                }}
              >
                {title}
              </h1>
              {onAdd && (
                <button
                  onClick={onAdd}
                  style={{
                    backgroundColor: 'var(--color-off-white)',
                    color: 'var(--color-blue)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                  }}
                >
                  {addButtonLabel}
                </button>
              )}
            </div>

            {/* Search and Filters */}
            {(onSearch || (filters && filters.length > 0)) && (
              <div style={{ marginBottom: '0' }}>
                {onSearch && (
                  <div
                    style={{
                      marginBottom: filters && filters.length > 0 ? 'var(--spacing-sm)' : '0',
                    }}
                  >
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={localSearch}
                      onChange={handleSearchChange}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontSize: 'var(--font-size-base)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'var(--color-black)',
                      }}
                    />
                  </div>
                )}

                {filters && filters.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    {filters.map((filter) => {
                      if (filter.type === 'select' && filter.options) {
                        return (
                          <select
                            key={filter.key}
                            value={filterValues[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            style={{
                              padding: 'var(--spacing-sm)',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              color: 'var(--color-black)',
                            }}
                          >
                            <option value="">{`All ${filter.label}`}</option>
                            {filter.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )
                      }
                      return null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Off-white Data Section */}
      <div className="container">
        <div className="p-lg">
          {/* Table */}
          {loading ? (
            <div className="text-center p-2xl">Loading...</div>
          ) : !data || data.length === 0 ? (
            <div className="text-center p-2xl text-black opacity-60">{emptyMessage}</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key as string}
                          style={{
                            width: column.width,
                            cursor: column.sortable !== false ? 'pointer' : 'default',
                          }}
                          onClick={() => handleSort(column)}
                        >
                          <div className="flex items-center gap-xs">
                            {column.label}
                            {column.sortable !== false &&
                              sortBy === column.key &&
                              (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => {
                      const handleRowClick = () => {
                        if (rowLink) {
                          router.push(rowLink(item))
                        }
                      }

                      return (
                        <tr
                          key={item.id}
                          onClick={handleRowClick}
                          style={{
                            cursor: rowLink ? 'pointer' : 'default',
                          }}
                        >
                          {columns.map((column) => (
                            <td key={column.key as string}>{renderCell(item, column)}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between mt-lg">
                  <div className="text-sm text-black opacity-60">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total_count)} of{' '}
                    {pagination.total_count} results
                  </div>
                  <div className="flex gap-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.has_prev}
                      onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-md">
                      Page {pagination.page} of {pagination.total_pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.has_next}
                      onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
