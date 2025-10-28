/**
 * Report Detail Page
 *
 * Display and run a specific saved report.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ReportPreview } from '@/components/reports/ReportPreview'
import type { CustomReport } from '@/lib/schemas/reports'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<CustomReport | null>(null)
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch report details
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${reportId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }
        const data = await response.json()
        setReport(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  // Run report
  const handleRunReport = async () => {
    if (!report) return

    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportConfig: {
            report_name: report.report_name,
            object_type: report.object_type,
            fields: report.fields,
            filters: report.filters,
            grouping: report.grouping,
            aggregations: report.aggregations,
            sorting: report.sorting,
            is_public: report.is_public,
          },
          pagination: {
            page: 1,
            pageSize: 100,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to execute report')
      }

      const data = await response.json()
      setResults(data.data.results || [])
      setColumns(data.data.columns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute report')
    } finally {
      setIsRunning(false)
    }
  }

  // Delete report
  const handleDelete = async () => {
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

      router.push('/reports')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report')
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading report...</p>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <Link href="/reports">
          <Button>Back to Reports</Button>
        </Link>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="error-container">
        <p>Report not found</p>
        <Link href="/reports">
          <Button>Back to Reports</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="report-detail-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
          { label: report.report_name, href: `/reports/${reportId}` },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>{report.report_name}</h1>
          {report.description && <p className="report-description">{report.description}</p>}
          <div className="report-meta">
            <span className="meta-item">
              <strong>Object Type:</strong> {report.object_type.replace(/_/g, ' ')}
            </span>
            <span className="meta-item">
              <strong>Last Run:</strong>{' '}
              {report.last_run_at ? new Date(report.last_run_at).toLocaleString() : 'Never'}
            </span>
            {report.is_public && <span className="badge public">Public</span>}
          </div>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleRunReport} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Report'}
          </Button>
          <Link href={`/reports/${reportId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          {!report.is_system && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="report-results">
        {error && (
          <div className="error-banner">
            <p>Error: {error}</p>
          </div>
        )}

        {results.length > 0 ? (
          <ReportPreview results={results} columns={columns} isLoading={isRunning} />
        ) : (
          <div className="no-results">
            <p>Click &quot;Run Report&quot; to see results.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .report-detail-page {
          padding: var(--spacing-lg);
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-lg);
          min-height: 400px;
          text-align: center;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: var(--spacing-lg) 0;
          gap: var(--spacing-lg);
        }

        .header-content h1 {
          font-size: 36px;
          font-weight: 600;
          color: var(--color-black);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .report-description {
          font-size: 16px;
          color: var(--color-border-default);
          margin: 0 0 var(--spacing-md) 0;
        }

        .report-meta {
          display: flex;
          gap: var(--spacing-lg);
          align-items: center;
          flex-wrap: wrap;
        }

        .meta-item {
          font-size: 14px;
          color: var(--color-border-default);
        }

        .meta-item strong {
          color: var(--color-black);
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.public {
          background-color: var(--color-blue);
          color: white;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .report-results {
          margin-top: var(--spacing-lg);
        }

        .error-banner {
          background-color: #ffebee;
          border: 1px solid var(--color-error-border);
          border-radius: 4px;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          color: var(--color-error-border);
        }

        .no-results {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-border-default);
        }

        @media (max-width: 768px) {
          .report-detail-page {
            padding: var(--spacing-md);
          }

          .page-header {
            flex-direction: column;
          }

          .header-content h1 {
            font-size: 28px;
          }

          .header-actions {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
