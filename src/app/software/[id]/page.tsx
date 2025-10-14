/**
 * Software Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Software } from '@/types'

export default function SoftwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const handleDelete = async () => {
    if (!software || !confirm(`Are you sure you want to delete "${software.product_name}"?`)) return
    try {
      const response = await fetch(`/api/software/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete software')
      }
      toast.success('Software deleted successfully')
      router.push('/software')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete software')
    }
  }

  const formatCategory = (category: string | null | undefined) => {
    if (!category) return '-'
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

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
          <Link href="/software" className="btn btn-secondary mt-4">
            Back to Software
          </Link>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        {/* Breadcrumbs */}
        <nav
          className="mb-md"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-black)',
            opacity: 0.6,
            marginBottom: '1rem',
          }}
        >
          <span>
            <Link href="/software" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
              Software
            </Link>
            <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          </span>
          <span>{software.product_name}</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{software.product_name}</h1>
            <p className="text-gray-600">{formatCategory(software.software_category)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/software/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Basic Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Product Name</p>
              <p>{software.product_name}</p>
            </div>
            <div>
              <p className="font-bold">Category</p>
              <p>{formatCategory(software.software_category)}</p>
            </div>
            <div>
              <p className="font-bold">Website</p>
              <p>
                {software.website ? (
                  <a
                    href={software.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline"
                  >
                    {software.website}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </div>
          {software.description && (
            <div className="mt-4">
              <p className="font-bold">Description</p>
              <p>{software.description}</p>
            </div>
          )}
        </div>

        {software.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{software.notes}</p>
          </div>
        )}

        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(software.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(software.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
