/**
 * Edit IO Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { IOForm } from '@/components/IOForm'
import type { IO } from '@/types'

export default function EditIOPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [io, setIo] = useState<IO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchIO = async () => {
      try {
        const response = await fetch(`/api/ios/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch IO')
        }

        setIo(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIO()
  }, [id])

  const handleSuccess = (io: IO) => {
    router.push(`/ios/${io.id}`)
  }

  const handleCancel = () => {
    router.push(`/ios/${id}`)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !io) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'IO not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <IOForm io={io} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
