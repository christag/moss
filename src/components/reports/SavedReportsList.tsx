/**
 * Saved Reports List Component
 *
 * Displays a list of saved reports with filtering, search, and actions.
 * Follows M.O.S.S. design system standards.
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { CustomReport } from '@/lib/schemas/reports'

interface SavedReportsListProps {
  filterTab?: 'my' | 'shared' | 'templates'
}

export function SavedReportsList({ filterTab = 'my' }: SavedReportsListProps) {
  const [reports, setReports] = useState<CustomReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [objectTypeFilter, setObjectTypeFilter] = useState<string>('')

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()

        if (filterTab === 'shared') {
          params.append('public', 'true')
        }

        if (objectTypeFilter) {
          params.append('object_type', objectTypeFilter)
        }

        const response = await fetch(`/api/reports?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch reports')
        }

        const data = await response.json()
        let filteredReports = data.data.reports

        // Apply filters
        if (filterTab === 'my') {
          // Backend already returns user's reports + public reports, filter to only user's
          filteredReports = filteredReports.filter((r: CustomReport) => !r.is_public)
        } else if (filterTab === 'templates') {
          filteredReports = filteredReports.filter((r: CustomReport) => r.is_system)
        }

        setReports(filteredReports)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [filterTab, objectTypeFilter])

  // Filter by search query
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchQuery === '' ||
      report.report_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  // Handle delete
  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      // Remove from list
      setReports(reports.filter((r) => r.id !== reportId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report')
    }
  }

  // Handle run report
  const handleRunReport = async (reportId: string) => {
    window.location.href = `/reports/${reportId}/run`
  }

  if (isLoading) {
    return (
      <div className="reports-list-loading">
        <p>Loading reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reports-list-error">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="reports-list">
      {/* Search and filters */}
      <div className="reports-list-filters">
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          value={objectTypeFilter}
          onChange={(e) => setObjectTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Object Types</option>
          <option value="device">Devices</option>
          <option value="person">People</option>
          <option value="location">Locations</option>
          <option value="network">Networks</option>
          <option value="software">Software</option>
          <option value="saas_service">SaaS Services</option>
        </select>
      </div>

      {/* Reports table */}
      {filteredReports.length === 0 ? (
        <div className="reports-list-empty">
          <p>No reports found.</p>
          {filterTab === 'my' && (
            <Link href="/reports/builder">
              <Button variant="primary">Create Your First Report</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Object Type</th>
                <th>Created By</th>
                <th>Last Run</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="report-name">
                    <Link href={`/reports/${report.id}`}>{report.report_name}</Link>
                  </td>
                  <td className="report-description">
                    {report.description || <span className="no-description">—</span>}
                  </td>
                  <td className="report-object-type">{report.object_type.replace(/_/g, ' ')}</td>
                  <td className="report-created-by">
                    {(report as CustomReport & { created_by_name?: string }).created_by_name ||
                      'System'}
                  </td>
                  <td className="report-last-run">
                    {report.last_run_at
                      ? new Date(report.last_run_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="report-actions">
                    <Button variant="outline" size="sm" onClick={() => handleRunReport(report.id!)}>
                      Run
                    </Button>
                    <Link href={`/reports/${report.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    {!report.is_system && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(report.id!)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .reports-list {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          overflow: hidden;
        }

        .reports-list-filters {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border-default);
          background-color: var(--color-off-white);
        }

        .search-input,
        .filter-select {
          height: 44px;
          padding: 0 var(--spacing-md);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          font-size: 16px;
          background-color: white;
        }

        .search-input {
          flex: 1;
        }

        .filter-select {
          min-width: 200px;
        }

        .reports-list-loading,
        .reports-list-error,
        .reports-list-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          min-height: 400px;
          text-align: center;
        }

        .reports-table-container {
          overflow-x: auto;
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 16px;
        }

        .reports-table thead {
          background-color: var(--color-off-white);
        }

        .reports-table th {
          text-align: left;
          padding: 12px 16px;
          font-weight: 600;
          color: var(--color-black);
          border-bottom: 2px solid var(--color-border-default);
          white-space: nowrap;
        }

        .reports-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-separator);
          color: var(--color-black);
        }

        .reports-table tbody tr:hover {
          background-color: rgba(28, 127, 242, 0.05);
        }

        .report-name a {
          color: var(--color-blue);
          text-decoration: none;
          font-weight: 600;
        }

        .report-name a:hover {
          text-decoration: underline;
        }

        .report-description {
          max-width: 300px;
        }

        .no-description {
          color: var(--color-border-default);
        }

        .report-actions {
          display: flex;
          gap: var(--spacing-xs);
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .reports-list-filters {
            flex-direction: column;
          }

          .filter-select {
            width: 100%;
          }

          .reports-table {
            font-size: 14px;
          }

          .reports-table th,
          .reports-table td {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  )
}
