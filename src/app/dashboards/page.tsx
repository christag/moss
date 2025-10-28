/**
 * Dashboards Page
 *
 * List all available dashboards.
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { CustomDashboard } from '@/lib/schemas/reports'

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboards
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await fetch('/api/dashboards')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboards')
        }
        const data = await response.json()
        setDashboards(data.data.dashboards)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboards()
  }, [])

  // Handle delete
  const handleDelete = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete dashboard')
      }

      setDashboards(dashboards.filter((d) => d.id !== dashboardId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading dashboards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="dashboards-page">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboards', href: '/dashboards' },
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Dashboards</h1>
          <p className="page-description">View custom dashboards with widgets and metrics.</p>
        </div>
      </div>

      {/* Dashboards List */}
      {dashboards.length === 0 ? (
        <div className="empty-state">
          <p>No dashboards available.</p>
          <p className="help-text">Create dashboards via the API to display them here.</p>
        </div>
      ) : (
        <div className="dashboards-grid">
          {dashboards.map((dashboard) => (
            <div key={dashboard.id} className="dashboard-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3 className="card-title">{dashboard.dashboard_name}</h3>
                  {dashboard.is_default && <span className="badge default">Default</span>}
                  {dashboard.is_public && <span className="badge public">Public</span>}
                </div>
                {dashboard.description && (
                  <p className="card-description">{dashboard.description}</p>
                )}
              </div>

              <div className="card-meta">
                <span className="meta-item">{dashboard.widgets.length} widgets</span>
                <span className="meta-item">
                  Created by{' '}
                  {(dashboard as CustomDashboard & { created_by_name?: string }).created_by_name ||
                    'Unknown'}
                </span>
              </div>

              <div className="card-actions">
                <Link href={`/dashboards/${dashboard.id}`}>
                  <Button variant="primary" size="sm">
                    View
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(dashboard.id!)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .dashboards-page {
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
          margin: var(--spacing-lg) 0;
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

        .empty-state {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-xl);
          text-align: center;
        }

        .empty-state p {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--color-border-default);
        }

        .help-text {
          font-size: 14px;
        }

        .dashboards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
        }

        .dashboard-card {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          transition: box-shadow 0.2s ease;
        }

        .dashboard-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          flex: 1;
        }

        .card-title-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-black);
          margin: 0;
        }

        .badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
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

        .card-description {
          font-size: 14px;
          color: var(--color-border-default);
          margin: 0;
          line-height: 1.5;
        }

        .card-meta {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          font-size: 13px;
          color: var(--color-border-default);
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--color-separator);
        }

        .card-actions {
          display: flex;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--color-separator);
        }

        @media (max-width: 768px) {
          .dashboards-page {
            padding: var(--spacing-md);
          }

          .header-content h1 {
            font-size: 28px;
          }

          .dashboards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
