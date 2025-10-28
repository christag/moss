/**
 * Report Builder Page
 *
 * Simple form-based report builder for MVP.
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ReportForm } from '@/components/reports/ReportForm'
import type { CreateCustomReport } from '@/lib/schemas/reports'

export default function ReportBuilderPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateCustomReport) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create report')
      }

      const result = await response.json()
      const reportId = result.data.id

      // Redirect to the new report's page
      router.push(`/reports/${reportId}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create report')
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/reports')
  }

  return (
    <div className="report-builder-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
          { label: 'New Report', href: '/reports/builder' },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <h1>Create New Report</h1>
        <p className="page-description">
          Configure a custom report to query and analyze M.O.S.S. data.
        </p>
      </div>

      {/* Form */}
      <ReportForm onSubmit={handleSubmit} onCancel={handleCancel} />

      <style jsx>{`
        .report-builder-page {
          padding: var(--spacing-lg);
          max-width: 1200px;
          margin: 0 auto;
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
          .report-builder-page {
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
