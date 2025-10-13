/**
 * SaaS Service Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SaaSService } from '@/types'

export default function SaaSServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [service, setService] = useState<SaaSService | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/saas-services/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch service')
        setService(result.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!service || !confirm(`Are you sure you want to delete "${service.service_name}"?`)) return
    try {
      const response = await fetch(`/api/saas-services/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete service')
      }
      toast.success('SaaS service deleted successfully')
      router.push('/saas-services')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete service')
    }
  }

  if (loading)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )

  if (error || !service)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Service not found'}</div>
          <Link href="/saas-services" className="btn btn-secondary mt-4">
            Back to Services
          </Link>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        {/* Breadcrumbs */}
        <nav
          className="mb-md"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-black)',
            opacity: 0.6,
            marginBottom: '1rem',
          }}
        >
          <span>
            <Link
              href="/saas-services"
              style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
            >
              SaaS Services
            </Link>
            <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          </span>
          <span>{service.service_name}</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{service.service_name}</h1>
            <p className="text-gray-600">
              {service.environment} •{' '}
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/saas-services/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Service Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Service Name</p>
              <p>{service.service_name}</p>
            </div>
            <div>
              <p className="font-bold">Environment</p>
              <p>{service.environment || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Status</p>
              <p>
                {service.status === 'active' ? (
                  <span className="badge badge-success">
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                ) : service.status === 'trial' ? (
                  <span className="badge badge-info">
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                ) : (
                  <span className="badge badge-default">
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="font-bold">Criticality</p>
              <p>
                {service.criticality
                  ? service.criticality.charAt(0).toUpperCase() + service.criticality.slice(1)
                  : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Service URL</p>
              <p>
                {service.service_url ? (
                  <a
                    href={service.service_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline"
                  >
                    {service.service_url}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="font-bold">Account ID</p>
              <p>{service.account_id || '-'}</p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Subscription Details</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Subscription Start</p>
              <p>
                {service.subscription_start
                  ? new Date(service.subscription_start).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Subscription End</p>
              <p>
                {service.subscription_end
                  ? new Date(service.subscription_end).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Seat Count</p>
              <p>{service.seat_count || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Cost</p>
              <p>{service.cost ? `$${service.cost}` : '-'}</p>
            </div>
            <div>
              <p className="font-bold">Billing Frequency</p>
              <p>{service.billing_frequency || '-'}</p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">SSO & Integration</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">SSO Provider</p>
              <p>{service.sso_provider || '-'}</p>
            </div>
            <div>
              <p className="font-bold">SSO Protocol</p>
              <p>{service.sso_protocol || '-'}</p>
            </div>
            <div>
              <p className="font-bold">SCIM Enabled</p>
              <p>{service.scim_enabled ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-bold">API Access</p>
              <p>{service.api_access_enabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {service.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{service.notes}</p>
          </div>
        )}

        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(service.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(service.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
