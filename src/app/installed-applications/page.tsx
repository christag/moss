/**
 * Installed Applications List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { InstalledApplication } from '@/types'

export default function InstalledApplicationsPage() {
  const [applications, setApplications] = useState<InstalledApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deploymentStatusFilter, setDeploymentStatusFilter] = useState('')

  const fetchApplications = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'application_name',
        sort_order: 'asc',
      })
      if (search) params.append('search', search)
      if (deploymentStatusFilter) params.append('deployment_status', deploymentStatusFilter)

      const response = await fetch(`/api/installed-applications?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to fetch applications')
      setApplications(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, deploymentStatusFilter])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const formatStatus = (status: string | null) => {
    if (!status) return '-'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-h1">Installed Applications</h1>
          <Link href="/installed-applications/new" className="btn btn-primary">
            Add Application
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-2 gap-4">
            <div>
              <label htmlFor="search" className="block mb-2 font-bold">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="deployment_status" className="block mb-2 font-bold">
                Deployment Status
              </label>
              <select
                id="deployment_status"
                value={deploymentStatusFilter}
                onChange={(e) => setDeploymentStatusFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="pilot">Pilot</option>
                <option value="production">Production</option>
                <option value="deprecated">Deprecated</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card">
          {applications.length === 0 ? (
            <p className="text-center py-8">No installed applications found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Application Name</th>
                  <th className="text-left p-2">Version</th>
                  <th className="text-left p-2">Deployment Status</th>
                  <th className="text-left p-2">Platform</th>
                  <th className="text-left p-2">Install Date</th>
                  <th className="text-left p-2">Auto Update</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link
                        href={`/installed-applications/${app.id}`}
                        className="text-blue hover:underline"
                      >
                        {app.application_name}
                      </Link>
                    </td>
                    <td className="p-2">{app.version || '-'}</td>
                    <td className="p-2">
                      {app.deployment_status === 'production' ? (
                        <span className="badge badge-success">
                          {formatStatus(app.deployment_status)}
                        </span>
                      ) : app.deployment_status === 'pilot' ? (
                        <span className="badge badge-info">
                          {formatStatus(app.deployment_status)}
                        </span>
                      ) : app.deployment_status === 'deprecated' ? (
                        <span className="badge badge-warning">
                          {formatStatus(app.deployment_status)}
                        </span>
                      ) : app.deployment_status === 'retired' ? (
                        <span className="badge badge-default">
                          {formatStatus(app.deployment_status)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">{app.deployment_platform || '-'}</td>
                    <td className="p-2">
                      {app.install_date ? new Date(app.install_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-2">{app.auto_update_enabled ? 'Yes' : 'No'}</td>
                    <td className="p-2">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
