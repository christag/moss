/**
 * Edit SaaS Service Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SaaSServiceForm } from '@/components/SaaSServiceForm'
import type { SaaSService } from '@/types'

export default function EditSaaSServicePage({ params }: { params: Promise<{ id: string }> }) {
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
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link
            href="/saas-services"
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            SaaS Services
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <Link
            href={`/saas-services/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {service.service_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <h1 className="text-h1 mb-6">Edit SaaS Service</h1>
        <div className="card">
          <SaaSServiceForm
            service={service}
            onSuccess={(srv: SaaSService) => router.push(`/saas-services/${srv.id}`)}
            onCancel={() => router.push(`/saas-services/${id}`)}
          />
        </div>
      </div>
    </div>
  )
}
