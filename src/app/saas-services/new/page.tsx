/**
 * Create SaaS Service Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SaaSServiceForm } from '@/components/SaaSServiceForm'
import type { SaaSService } from '@/types'

export default function NewSaaSServicePage() {
  const router = useRouter()

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
          <span>New</span>
        </nav>

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
