/**
 * Create Installed Application Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InstalledApplicationForm } from '@/components/InstalledApplicationForm'
import type { InstalledApplication } from '@/types'

export default function NewInstalledApplicationPage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link
            href="/installed-applications"
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            Installed Applications
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <h1 className="text-h1 mb-6">Add Installed Application</h1>
        <div className="card">
          <InstalledApplicationForm
            onSuccess={(application: InstalledApplication) =>
              router.push(`/installed-applications/${application.id}`)
            }
            onCancel={() => router.push('/installed-applications')}
          />
        </div>
      </div>
    </div>
  )
}
