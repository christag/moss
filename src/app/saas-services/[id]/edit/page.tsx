/**
 * Edit SaaS Service Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
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
