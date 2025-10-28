/**
 * Report Preview Page
 * Displays report execution results
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReportPreview } from '@/components/reports/ReportPreview'
import type { CustomReport } from '@/lib/schemas/reports'

function ReportPreviewContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<{
    results: Record<string, unknown>[]
    columns: string[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
    executionTime: number
  } | null>(null)

  // Get report configuration from URL params (if passed)
  const reportConfigParam = searchParams.get('config')

  const executeReport = async (
    config: Partial<CustomReport>,
    page: number = 1,
    pageSize: number = 100
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportConfig: config,
          pagination: {
            page,
            pageSize,
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to execute report')
      }

      // Extract columns from first result
      const columns = data.data.results.length > 0 ? Object.keys(data.data.results[0]) : []

      setReportData({
        results: data.data.results,
        columns,
        pagination: data.data.pagination,
        executionTime: data.data.executionTime,
      })
    } catch (err) {
      console.error('Error executing report:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (reportConfigParam) {
      try {
        const config = JSON.parse(decodeURIComponent(reportConfigParam))
        executeReport(config)
      } catch (err) {
        console.error('Error parsing report config:', err)
        setError('Invalid report configuration')
      }
    }
  }, [reportConfigParam])

  const handlePageChange = (page: number) => {
    if (reportConfigParam) {
      try {
        const config = JSON.parse(decodeURIComponent(reportConfigParam))
        executeReport(config, page)
      } catch (err) {
        console.error('Error parsing report config:', err)
      }
    }
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting report as ${format}`)
    alert(`Export to ${format.toUpperCase()} will be implemented in Phase 3`)
  }

  return (
    <div className="report-preview-page">
      <div className="report-preview-header">
        <h1>Report Preview</h1>
        <p>View and export report results</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!error && !reportData && !isLoading && (
        <div className="info-message">
          <p>No report configuration provided.</p>
          <p>
            To preview a report, execute a report from the report builder and you&apos;ll be
            redirected here with the results.
          </p>
        </div>
      )}

      {(isLoading || reportData) && (
        <ReportPreview
          results={reportData?.results || []}
          columns={reportData?.columns || []}
          pagination={reportData?.pagination}
          executionTime={reportData?.executionTime}
          onPageChange={handlePageChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      )}

      <style jsx>{`
        .report-preview-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-xl);
        }

        .report-preview-header {
          margin-bottom: var(--spacing-xl);
        }

        .report-preview-header h1 {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          color: var(--color-black);
          margin-bottom: var(--spacing-xs);
        }

        .report-preview-header p {
          font-size: 18px;
          color: var(--color-border-default);
        }

        .error-message {
          background-color: #fff3f3;
          border: 1px solid var(--color-error-border);
          border-radius: 4px;
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          color: var(--color-error-border);
        }

        .error-message strong {
          font-weight: 600;
        }

        .info-message {
          background-color: var(--color-off-white);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-border-default);
        }

        .info-message p {
          margin: 0;
          font-size: 18px;
        }

        .info-message p:not(:last-child) {
          margin-bottom: var(--spacing-md);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .report-preview-page {
            padding: var(--spacing-md);
          }

          .report-preview-header h1 {
            font-size: var(--font-size-xl);
          }

          .report-preview-header p {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default function ReportPreviewPage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>Loading...</div>}
    >
      <ReportPreviewContent />
    </Suspense>
  )
}
