'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button, Icon } from '@/components/ui'
import {
  parseViewStateFromURL,
  updateURLWithViewState,
  type ViewState,
} from '@/lib/urlStateManager'
import { ExportModal } from '@/components/ExportModal'

/**
 * Enhanced column definition with filtering and visibility control
 */
export interface ColumnConfig<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'number' | 'date'
  filterOptions?: { value: string; label: string }[]
  defaultVisible?: boolean // Controls if column is visible by default
  alwaysVisible?: boolean // Prevents hiding this column
  render?: (item: T) => React.ReactNode
  width?: string
}

// Backward compatibility
export type Column<T> = ColumnConfig<T>

/**
 * Filter definition (legacy - kept for backward compatibility)
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
  columns: ColumnConfig<T>[]
  data: T[]
  pagination?: Pagination
  filters?: Filter[] // Legacy global filters
  filterValues?: Record<string, string> // Legacy
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
  // New props for enhanced functionality
  enableColumnManagement?: boolean // Enable show/hide columns
  enablePerColumnFiltering?: boolean // Enable filters in column headers
  onViewStateChange?: (viewState: ViewState) => void // Callback when view state changes
  // Export functionality
  enableExport?: boolean // Enable CSV export button
  exportObjectType?: string // Object type identifier for export API (e.g., 'devices', 'people')
  exportObjectTypeName?: string // Display name for export modal (e.g., 'Devices', 'People')
}

/**
 * Generic List View Component
 * Enhanced with column management, per-column filtering, and URL persistence
 */
export function GenericListView<T extends { id: string }>({
  title,
  columns,
  data,
  pagination,
  filters, // Legacy
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
  enableColumnManagement = true,
  enablePerColumnFiltering = true,
  onViewStateChange,
  enableExport = false,
  exportObjectType,
  exportObjectTypeName,
}: GenericListViewProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse initial view state from URL
  const urlViewState = parseViewStateFromURL(searchParams)

  // Determine visible columns (from URL or defaults)
  const defaultVisibleColumns = columns
    .filter((col) => col.defaultVisible !== false)
    .map((col) => col.key as string)

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    urlViewState.visibleColumns || defaultVisibleColumns
  )
  const [columnManagerOpen, setColumnManagerOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchValue)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    urlViewState.columnFilters || {}
  )
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Get visible column configs
  const visibleColumnConfigs = columns.filter((col) => visibleColumns.includes(col.key as string))

  // Update URL when view state changes
  useEffect(() => {
    const viewState: ViewState = {
      visibleColumns,
      sortBy,
      sortOrder,
      columnFilters,
      globalSearch: localSearch || undefined,
      page: pagination?.page,
    }

    // Call parent callback if provided
    if (onViewStateChange) {
      onViewStateChange(viewState)
    }

    // Update URL
    updateURLWithViewState(viewState, pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, sortBy, sortOrder, columnFilters, localSearch, pagination?.page])

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

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }))
    // Also call legacy filter handler if exists
    if (onFilterChange) {
      onFilterChange(columnKey, value)
    }
  }

  const handleSort = (column: ColumnConfig<T>) => {
    if (column.sortable !== false && onSort) {
      onSort(column.key as string)
    }
  }

  const toggleColumn = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey)
    if (column?.alwaysVisible) return // Can't hide always visible columns

    setVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((k) => k !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns)
  }

  const clearAllFilters = () => {
    setColumnFilters({})
    setLocalSearch('')
    if (onSearch) {
      onSearch('')
    }
  }

  const hasActiveFilters =
    Object.values(columnFilters).some((v) => v) ||
    localSearch ||
    Object.values(filterValues).some((v) => v)

  // Keyboard navigation handler for table rows
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (!data || data.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedRowIndex((prev) => Math.min(prev + 1, data.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedRowIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        if (selectedRowIndex >= 0 && selectedRowIndex < data.length && rowLink) {
          e.preventDefault()
          router.push(rowLink(data[selectedRowIndex]))
        }
        break
      case 'Escape':
        e.preventDefault()
        setSelectedRowIndex(-1)
        break
    }
  }

  const renderCell = (item: T, column: ColumnConfig<T>) => {
    if (column.render) {
      return column.render(item)
    }

    const value = item[column.key as keyof T]
    return value !== null && value !== undefined ? String(value) : '—'
  }

  const renderColumnFilter = (column: ColumnConfig<T>) => {
    if (!column.filterable || !enablePerColumnFiltering) return null

    const columnKey = column.key as string
    const currentFilter = columnFilters[columnKey] || ''

    if (column.filterType === 'select' && column.filterOptions) {
      return (
        <select
          value={currentFilter}
          onChange={(e) => handleColumnFilterChange(columnKey, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Filter ${column.label} column`}
          style={{
            width: '100%',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            backgroundColor: 'white',
            marginTop: '4px',
          }}
        >
          <option value="">All</option>
          {column.filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (column.filterType === 'text' || column.filterType === 'number') {
      return (
        <input
          type={column.filterType}
          value={currentFilter}
          onChange={(e) => handleColumnFilterChange(columnKey, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder={`Filter ${column.label.toLowerCase()}...`}
          aria-label={`Filter ${column.label} column`}
          style={{
            width: '100%',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '4px',
          }}
        />
      )
    }

    return null
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
          <div className="p-md">
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom:
                  onSearch || (filters && filters.length > 0) || hasActiveFilters
                    ? 'var(--spacing-md)'
                    : '0',
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: '700',
                  color: 'var(--color-off-white)',
                  margin: '0',
                }}
              >
                {title}
              </h1>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {enableExport && exportObjectType && exportObjectTypeName && (
                  <button
                    onClick={() => setExportModalOpen(true)}
                    aria-label="Export to CSV"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                    }}
                    title="Export to CSV"
                  >
                    <Icon name="download" size={16} aria-hidden="true" />
                    Export
                  </button>
                )}
                {enableColumnManagement && (
                  <button
                    onClick={() => setColumnManagerOpen(!columnManagerOpen)}
                    aria-label="Manage visible columns"
                    aria-expanded={columnManagerOpen}
                    aria-haspopup="dialog"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                    }}
                    title="Manage Columns"
                  >
                    <Icon name="table_chart" size={16} aria-hidden="true" />
                    Columns
                  </button>
                )}
                {onAdd && (
                  <button
                    onClick={onAdd}
                    aria-label={addButtonLabel}
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
            </div>

            {/* Search and Filters */}
            {(onSearch || (filters && filters.length > 0) || hasActiveFilters) && (
              <div style={{ marginBottom: '0' }}>
                {onSearch && (
                  <div
                    style={{
                      position: 'relative',
                      marginBottom: filters && filters.length > 0 ? 'var(--spacing-sm)' : '0',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 'var(--spacing-sm)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <Icon name="magnifying-glass-search" size={16} aria-label="Search" />
                    </span>
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={localSearch}
                      onChange={handleSearchChange}
                      aria-label={`Search ${title.toLowerCase()}`}
                      role="searchbox"
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        paddingLeft: 'calc(var(--spacing-sm) * 2 + 16px)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontSize: 'var(--font-size-base)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'var(--color-black)',
                      }}
                    />
                  </div>
                )}

                {/* Legacy filters */}
                {filters && filters.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 'var(--spacing-sm)',
                      marginBottom: hasActiveFilters ? 'var(--spacing-sm)' : '0',
                    }}
                  >
                    {filters.map((filter) => {
                      if (filter.type === 'select' && filter.options) {
                        return (
                          <select
                            key={filter.key}
                            value={filterValues[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            aria-label={`Filter by ${filter.label.toLowerCase()}`}
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

                {/* Active filter chips */}
                {hasActiveFilters && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-xs)',
                      alignItems: 'center',
                    }}
                  >
                    {localSearch && (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Search: {localSearch}</span>
                        <button
                          onClick={() => {
                            setLocalSearch('')
                            if (onSearch) onSearch('')
                          }}
                          aria-label="Clear search"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '0 4px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {Object.entries(columnFilters).map(([key, value]) => {
                      if (!value) return null
                      const column = columns.find((col) => col.key === key)
                      return (
                        <div
                          key={key}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>
                            {column?.label}: {value}
                          </span>
                          <button
                            onClick={() => handleColumnFilterChange(key, '')}
                            aria-label={`Clear ${column?.label} filter`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              padding: '0 4px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                    <button
                      onClick={clearAllFilters}
                      aria-label="Clear all filters"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'var(--color-off-white)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Manager Panel */}
      {columnManagerOpen && (
        <div
          role="dialog"
          aria-label="Manage visible columns"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '300px',
            backgroundColor: 'var(--color-off-white)',
            boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Manage Columns</h3>
            <button
              onClick={() => setColumnManagerOpen(false)}
              aria-label="Close column manager"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
            {columns.map((column) => {
              const columnKey = column.key as string
              const isVisible = visibleColumns.includes(columnKey)
              const isDisabled = column.alwaysVisible

              return (
                <div
                  key={columnKey}
                  style={{
                    padding: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xs)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: isVisible ? 'var(--color-light-blue)' : 'transparent',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleColumn(columnKey)}
                      disabled={isDisabled}
                      style={{ marginRight: 'var(--spacing-xs)' }}
                    />
                    <span>{column.label}</span>
                    {column.alwaysVisible && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          color: 'var(--color-black)',
                          opacity: 0.6,
                        }}
                      >
                        Required
                      </span>
                    )}
                  </label>
                </div>
              )
            })}
          </div>
          <div
            style={{
              padding: 'var(--spacing-md)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              onClick={resetColumns}
              aria-label="Reset columns to default visibility"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                backgroundColor: 'var(--color-blue)',
                color: 'var(--color-off-white)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Overlay for column manager */}
      {columnManagerOpen && (
        <div
          onClick={() => setColumnManagerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Off-white Data Section */}
      <div className="container">
        <div className="p-lg">
          {/* Table */}
          {loading ? (
            <div className="text-center p-2xl" role="status" aria-live="polite" aria-busy="true">
              Loading...
            </div>
          ) : !data || data.length === 0 ? (
            <div
              className="text-center p-2xl text-black opacity-60"
              role="status"
              aria-live="polite"
            >
              {emptyMessage}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table
                  className="table"
                  role="table"
                  aria-label={`${title} table`}
                  aria-rowcount={data.length}
                  onKeyDown={handleTableKeyDown}
                  tabIndex={0}
                >
                  <thead role="rowgroup">
                    <tr role="row">
                      {visibleColumnConfigs.map((column) => (
                        <th
                          key={column.key as string}
                          role="columnheader"
                          aria-sort={
                            sortBy === column.key
                              ? sortOrder === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : column.sortable !== false
                                ? 'none'
                                : undefined
                          }
                          style={{
                            width: column.width,
                            cursor: column.sortable !== false ? 'pointer' : 'default',
                            padding: 'var(--spacing-xs) var(--spacing-sm)', // Reduced from sm/md
                          }}
                        >
                          <div>
                            <div
                              className="flex items-center gap-xs"
                              onClick={() => handleSort(column)}
                            >
                              {column.label}
                              {column.sortable !== false &&
                                sortBy === column.key &&
                                (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                            </div>
                            {renderColumnFilter(column)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {data.map((item, index) => {
                      const handleRowClick = () => {
                        if (rowLink) {
                          router.push(rowLink(item))
                        }
                      }

                      const isSelected = index === selectedRowIndex

                      return (
                        <tr
                          key={item.id}
                          role="row"
                          aria-selected={isSelected}
                          onClick={handleRowClick}
                          style={{
                            cursor: rowLink ? 'pointer' : 'default',
                            backgroundColor: isSelected ? 'var(--color-light-blue)' : undefined,
                            outline: isSelected ? '2px solid var(--color-morning-blue)' : undefined,
                            outlineOffset: isSelected ? '-2px' : undefined,
                          }}
                        >
                          {visibleColumnConfigs.map((column) => (
                            <td
                              key={column.key as string}
                              role="cell"
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)', // Reduced from sm/md
                              }}
                            >
                              {renderCell(item, column)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <nav
                  className="flex items-center justify-between mt-lg"
                  role="navigation"
                  aria-label="Pagination"
                >
                  <div className="text-sm text-black opacity-60" aria-live="polite">
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
                      aria-label="Go to previous page"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-md" aria-current="page">
                      Page {pagination.page} of {pagination.total_pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.has_next}
                      onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                      aria-label="Go to next page"
                    >
                      Next
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {enableExport && exportObjectType && exportObjectTypeName && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          objectType={exportObjectType}
          objectTypeName={exportObjectTypeName}
          currentFilters={{
            ...filterValues,
            ...columnFilters,
            search: localSearch,
          }}
        />
      )}
    </>
  )
}
