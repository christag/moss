/**
 * Installed Application Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { InstalledApplication } from '@/types'

export default function InstalledApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [application, setApplication] = useState<InstalledApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/installed-applications/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch application')
        setApplication(result.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (
      !application ||
      !confirm(`Are you sure you want to delete "${application.application_name}"?`)
    )
      return
    try {
      const response = await fetch(`/api/installed-applications/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete application')
      }
      router.push('/installed-applications')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete application')
    }
  }

  const formatStatus = (status: string | null) => {
    if (!status) return '-'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )

  if (error || !application)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Application not found'}</div>
          <Link href="/installed-applications" className="btn btn-secondary mt-4">
            Back to Applications
          </Link>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{application.application_name}</h1>
            <p className="text-gray-600">
              {application.version && `Version ${application.version}`}
              {application.deployment_status && ` • ${formatStatus(application.deployment_status)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/installed-applications/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Application Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Application Name</p>
              <p>{application.application_name}</p>
            </div>
            <div>
              <p className="font-bold">Version</p>
              <p>{application.version || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Deployment Status</p>
              <p>
                {application.deployment_status === 'production' ? (
                  <span className="badge badge-success">
                    {formatStatus(application.deployment_status)}
                  </span>
                ) : application.deployment_status === 'pilot' ? (
                  <span className="badge badge-info">
                    {formatStatus(application.deployment_status)}
                  </span>
                ) : application.deployment_status === 'deprecated' ? (
                  <span className="badge badge-warning">
                    {formatStatus(application.deployment_status)}
                  </span>
                ) : application.deployment_status === 'retired' ? (
                  <span className="badge badge-default">
                    {formatStatus(application.deployment_status)}
                  </span>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="font-bold">Install Method</p>
              <p>{application.install_method || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Deployment Platform</p>
              <p>{application.deployment_platform || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Package ID</p>
              <p>{application.package_id || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Install Date</p>
              <p>
                {application.install_date
                  ? new Date(application.install_date).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Auto Update Enabled</p>
              <p>{application.auto_update_enabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {application.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{application.notes}</p>
          </div>
        )}

        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(application.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(application.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
