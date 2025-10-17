/**
 * Create Location Page
 */
'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LocationForm } from '@/components/LocationForm'

export default function NewLocationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent company_id from query params if provided
  const company_id = searchParams.get('company_id')
  const initialValues = company_id ? { company_id } : {}

  const handleSuccess = (location: unknown) => {
    const locationData = location as { id: string }
    router.push(`/locations/${locationData.id}`)
  }

  const handleCancel = () => {
    router.push('/locations')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/locations" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Locations
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New Location</span>
        </nav>

        <LocationForm
          initialValues={initialValues}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
