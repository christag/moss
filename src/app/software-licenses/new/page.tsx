/**
 * Create Software License Page
 */
'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SoftwareLicenseForm } from '@/components/SoftwareLicenseForm'
import type { SoftwareLicense } from '@/types'

export default function NewSoftwareLicensePage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="p-lg">Loading...</div>
        </div>
      }
    >
      <NewSoftwareLicensePageContent />
    </Suspense>
  )
}

function NewSoftwareLicensePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent software_id from query params if provided
  const software_id = searchParams.get('software_id')
  const initialValues = software_id ? { software_id } : {}

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link
            href="/software-licenses"
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            Software Licenses
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <h1 className="text-h1 mb-6">Add Software License</h1>
        <div className="card">
          <SoftwareLicenseForm
            initialValues={initialValues}
            onSuccess={(license: SoftwareLicense) =>
              router.push(`/software-licenses/${license.id}`)
            }
            onCancel={() => router.push('/software-licenses')}
          />
        </div>
      </div>
    </div>
  )
}
