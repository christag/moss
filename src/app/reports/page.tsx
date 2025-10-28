/**
 * Reports Page
 *
 * Main reports listing page with tabbed navigation.
 */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SavedReportsList } from '@/components/reports/SavedReportsList'

type ReportTab = 'my' | 'shared' | 'templates'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('my')

  return (
    <div className="reports-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Reports</h1>
          <p className="page-description">
            Create, run, and manage custom reports across all M.O.S.S. objects.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/reports/builder">
            <Button variant="primary">Create New Report</Button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Reports
          </button>
          <button
            className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared')}
          >
            Shared Reports
          </button>
          <button
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="reports-content">
        <SavedReportsList filterTab={activeTab} />
      </div>

      <style jsx>{`
        .reports-page {
          padding: var(--spacing-lg);
          max-width: 1400px;
          margin: 0 auto;
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

        .page-description {
          font-size: 16px;
          color: var(--color-border-default);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .tabs-container {
          border-bottom: 2px solid var(--color-separator);
          margin-bottom: var(--spacing-lg);
        }

        .tabs {
          display: flex;
          gap: var(--spacing-md);
        }

        .tab {
          padding: var(--spacing-md) var(--spacing-lg);
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-border-default);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          bottom: -2px;
        }

        .tab:hover {
          color: var(--color-black);
        }

        .tab.active {
          color: var(--color-blue);
          border-bottom-color: var(--color-blue);
        }

        .reports-content {
          margin-top: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .reports-page {
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

          .tabs {
            flex-wrap: wrap;
          }

          .tab {
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
