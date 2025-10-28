/**
 * Report Edit Page
 *
 * Edit an existing saved report.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { ReportForm } from '@/components/reports/ReportForm'
import type { CustomReport, CreateCustomReport } from '@/lib/schemas/reports'

export default function ReportEditPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<CustomReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

  const handleSubmit = async (data: CreateCustomReport) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update report')
      }

      // Redirect to the report detail page
      router.push(`/reports/${reportId}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update report')
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/reports/${reportId}`)
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="error-container">
        <p>Error: {error || 'Report not found'}</p>
        <Link href="/reports">
          <Button>Back to Reports</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="report-edit-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
          { label: report.report_name, href: `/reports/${reportId}` },
          { label: 'Edit', href: `/reports/${reportId}/edit` },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <h1>Edit Report</h1>
        <p className="page-description">Update the configuration for {report.report_name}.</p>
      </div>

      {/* Form */}
      <ReportForm initialData={report} onSubmit={handleSubmit} onCancel={handleCancel} isEditing />

      <style jsx>{`
        .report-edit-page {
          padding: var(--spacing-lg);
          max-width: 1200px;
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
          margin: var(--spacing-lg) 0;
        }

        .page-header h1 {
          font-size: 36px;
          font-weight: 600;
          color: var(--color-black);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .page-description {
          font-size: 16px;
          color: var(--color-border-default);
          margin: 0;
        }

        @media (max-width: 768px) {
          .report-edit-page {
            padding: var(--spacing-md);
          }

          .page-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  )
}
