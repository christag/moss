/**
 * Create SaaS Service Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SaaSServiceForm } from '@/components/SaaSServiceForm'
import type { SaaSService } from '@/types'

export default function NewSaaSServicePage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Add SaaS Service</h1>
        <div className="card">
          <SaaSServiceForm
            onSuccess={(service: SaaSService) => router.push(`/saas-services/${service.id}`)}
            onCancel={() => router.push('/saas-services')}
          />
        </div>
      </div>
    </div>
  )
}
