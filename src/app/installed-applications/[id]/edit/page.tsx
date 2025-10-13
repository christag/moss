/**
 * Edit Installed Application Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InstalledApplicationForm } from '@/components/InstalledApplicationForm'
import type { InstalledApplication } from '@/types'

export default function EditInstalledApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [application, setApplication] = useState<InstalledApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/installed-applications/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch application')
        setApplication(result.data)
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

  if (error || !application)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Application not found'}</div>
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
            href="/installed-applications"
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            Installed Applications
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <Link
            href={`/installed-applications/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {application.application_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <h1 className="text-h1 mb-6">Edit Installed Application</h1>
        <div className="card">
          <InstalledApplicationForm
            application={application}
            onSuccess={(app: InstalledApplication) =>
              router.push(`/installed-applications/${app.id}`)
            }
            onCancel={() => router.push(`/installed-applications/${id}`)}
          />
        </div>
      </div>
    </div>
  )
}
