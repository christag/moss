/**
 * Edit Software Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { SoftwareForm } from '@/components/SoftwareForm'
import type { Software } from '@/types'

export default function EditSoftwarePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [software, setSoftware] = useState<Software | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/software/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch software')
        setSoftware(result.data)
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

  if (error || !software)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Software not found'}</div>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Edit Software</h1>
        <div className="card">
          <SoftwareForm
            software={software}
            onSuccess={(sw: Software) => router.push(`/software/${sw.id}`)}
            onCancel={() => router.push(`/software/${id}`)}
          />
        </div>
      </div>
    </div>
  )
}
