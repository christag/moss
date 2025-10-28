/**
 * Report Preview Component
 *
 * Displays query results in a table format with pagination and export options.
 * Follows M.O.S.S. design system standards.
 */
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'

interface ReportPreviewProps {
  results: Record<string, unknown>[]
  columns: string[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  executionTime?: number
  onPageChange?: (page: number) => void
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void
  isLoading?: boolean
}

export function ReportPreview({
  results,
  columns,
  pagination,
  executionTime,
  onPageChange,
  onExport,
  isLoading = false,
}: ReportPreviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '—'
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 97) + '...'
    }
    return String(value)
  }

  // Handle row selection
  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedRows.size === results.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(results.map((_, i) => i)))
    }
  }

  if (isLoading) {
    return (
      <div className="report-preview-loading">
        <div className="spinner" aria-live="polite" aria-busy="true">
          Loading report results...
        </div>
        <style jsx>{`
          .report-preview-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            font-size: 18px;
            color: var(--color-border-default);
          }

          .spinner {
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="report-preview-empty">
        <p>No results found for this report configuration.</p>
        <style jsx>{`
          .report-preview-empty {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            font-size: 18px;
            color: var(--color-border-default);
            text-align: center;
            padding: var(--spacing-xl);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="report-preview">
      {/* Header with stats and actions */}
      <div className="report-preview-header">
        <div className="report-preview-stats">
          <span className="stat-item">
            <strong>{pagination?.total || results.length}</strong> results
          </span>
          {executionTime !== undefined && (
            <span className="stat-item">
              Executed in <strong>{executionTime}ms</strong>
            </span>
          )}
          {selectedRows.size > 0 && (
            <span className="stat-item">
              <strong>{selectedRows.size}</strong> selected
            </span>
          )}
        </div>

        {onExport && (
          <div className="report-preview-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
              aria-label="Export to CSV"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('xlsx')}
              aria-label="Export to Excel"
            >
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
              aria-label="Export to PDF"
            >
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="report-preview-table-container">
        <table className="report-preview-table" role="table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedRows.size === results.length && results.length > 0}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              {columns.map((column) => (
                <th key={column}>
                  {column.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, rowIndex) => (
              <tr key={rowIndex} className={selectedRows.has(rowIndex) ? 'selected' : ''}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </td>
                {columns.map((column) => (
                  <td key={column}>{formatCellValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}

      <style jsx>{`
        .report-preview {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          overflow: hidden;
        }

        .report-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border-default);
          background-color: var(--color-off-white);
        }

        .report-preview-stats {
          display: flex;
          gap: var(--spacing-lg);
          font-size: 14px;
          color: var(--color-border-default);
        }

        .stat-item strong {
          color: var(--color-black);
          font-weight: 600;
        }

        .report-preview-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .report-preview-table-container {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }

        .report-preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 16px;
        }

        .report-preview-table thead {
          position: sticky;
          top: 0;
          background-color: var(--color-off-white);
          z-index: 10;
        }

        .report-preview-table th {
          text-align: left;
          padding: 12px 16px;
          font-weight: 600;
          color: var(--color-black);
          border-bottom: 2px solid var(--color-border-default);
          white-space: nowrap;
        }

        .report-preview-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-separator);
          color: var(--color-black);
        }

        .report-preview-table tbody tr:hover {
          background-color: rgba(28, 127, 242, 0.05);
        }

        .report-preview-table tbody tr.selected {
          background-color: rgba(28, 127, 242, 0.1);
        }

        .checkbox-column {
          width: 40px;
          padding: 12px 16px;
        }

        .checkbox-column input[type='checkbox'] {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .report-preview-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: flex-start;
          }

          .report-preview-stats {
            flex-direction: column;
            gap: var(--spacing-xs);
          }

          .report-preview-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .report-preview-table {
            font-size: 14px;
          }

          .report-preview-table th,
          .report-preview-table td {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  )
}
