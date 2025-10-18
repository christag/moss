/**
 * Create Person Page
 */
'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PersonForm } from '@/components/PersonForm'
import type { Person } from '@/types'

export default function NewPersonPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="p-lg">Loading...</div>
        </div>
      }
    >
      <NewPersonPageContent />
    </Suspense>
  )
}

function NewPersonPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent fields from query params if provided
  const company_id = searchParams.get('company_id')
  const location_id = searchParams.get('location_id')

  const initialValues: Record<string, string> = {}
  if (company_id) initialValues.company_id = company_id
  if (location_id) initialValues.location_id = location_id

  const handleSuccess = (person: Person) => {
    router.push(`/people/${person.id}`)
  }

  const handleCancel = () => {
    router.push('/people')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/people" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            People
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New Person</span>
        </nav>

        <PersonForm
          initialValues={initialValues}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
