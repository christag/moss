/**
 * Create Software Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SoftwareForm } from '@/components/SoftwareForm'
import type { Software } from '@/types'

export default function NewSoftwarePage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/software" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Software
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <h1 className="text-h1 mb-6">Add Software</h1>
        <div className="card">
          <SoftwareForm
            onSuccess={(software: Software) => router.push(`/software/${software.id}`)}
            onCancel={() => router.push('/software')}
          />
        </div>
      </div>
    </div>
  )
}
