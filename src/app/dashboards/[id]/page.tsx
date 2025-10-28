/**
 * Dashboard Detail Page
 *
 * View a specific dashboard with all its widgets.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DashboardView } from '@/components/dashboards/DashboardView'
import type { CustomDashboard } from '@/lib/schemas/reports'

export default function DashboardDetailPage() {
  const params = useParams()
  const dashboardId = params.id as string

  const [dashboard, setDashboard] = useState<CustomDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`/api/dashboards/${dashboardId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard')
        }
        const data = await response.json()
        setDashboard(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [dashboardId])

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="error-container">
        <p>Error: {error || 'Dashboard not found'}</p>
        <Link href="/dashboards">
          <Button>Back to Dashboards</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="dashboard-detail-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboards', href: '/dashboards' },
          { label: dashboard.dashboard_name, href: `/dashboards/${dashboardId}` },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>{dashboard.dashboard_name}</h1>
          {dashboard.description && (
            <p className="dashboard-description">{dashboard.description}</p>
          )}
          <div className="dashboard-meta">
            {dashboard.is_default && <span className="badge default">Default</span>}
            {dashboard.is_public && <span className="badge public">Public</span>}
            <span className="meta-item">{dashboard.widgets.length} widgets</span>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/dashboards">
            <Button variant="outline">Back to Dashboards</Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {dashboard.widgets.length === 0 ? (
          <div className="empty-dashboard">
            <p>This dashboard has no widgets configured.</p>
          </div>
        ) : (
          <DashboardView dashboard={dashboard} />
        )}
      </div>

      <style jsx>{`
        .dashboard-detail-page {
          padding: var(--spacing-lg);
          max-width: 1600px;
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

        .dashboard-description {
          font-size: 16px;
          color: var(--color-border-default);
          margin: 0 0 var(--spacing-md) 0;
        }

        .dashboard-meta {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
          flex-wrap: wrap;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.default {
          background-color: var(--color-green);
          color: white;
        }

        .badge.public {
          background-color: var(--color-blue);
          color: white;
        }

        .meta-item {
          font-size: 14px;
          color: var(--color-border-default);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .dashboard-content {
          margin-top: var(--spacing-lg);
        }

        .empty-dashboard {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-border-default);
        }

        @media (max-width: 768px) {
          .dashboard-detail-page {
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
