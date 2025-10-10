/**
 * Edit Location Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { LocationForm } from '@/components/LocationForm'
import type { Location } from '@/types'

export default function EditLocationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/locations/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch location')
        }
        const result = await response.json()
        setLocation(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [id])

  const handleSuccess = (location: Location) => {
    router.push(`/locations/${location.id}`)
  }

  const handleCancel = () => {
    router.push(`/locations/${id}`)
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

  if (error || !location) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Location not found'}</div>
          <button onClick={() => router.push('/locations')}>Back to Locations</button>
        </div>
      </div>
    )
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
          <Link
            href={`/locations/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {location.location_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <LocationForm location={location} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
