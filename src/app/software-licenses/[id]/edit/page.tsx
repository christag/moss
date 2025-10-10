/**
 * Edit Software License Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { SoftwareLicenseForm } from '@/components/SoftwareLicenseForm'
import type { SoftwareLicense } from '@/types'

export default function EditSoftwareLicensePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [license, setLicense] = useState<SoftwareLicense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/software-licenses/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch license')
        setLicense(result.data)
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

  if (error || !license)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'License not found'}</div>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Edit Software License</h1>
        <div className="card">
          <SoftwareLicenseForm
            license={license}
            onSuccess={(lic: SoftwareLicense) => router.push(`/software-licenses/${lic.id}`)}
            onCancel={() => router.push(`/software-licenses/${id}`)}
          />
        </div>
      </div>
    </div>
  )
}
