/**
 * Location Detail Page
 *
 * Shows detailed information about a specific location
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import type { Location } from '@/types'

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch location data
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

  const handleEdit = () => {
    router.push(`/locations/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete location')
      }

      router.push('/locations')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete location')
    }
  }

  const handleBack = () => {
    router.push('/locations')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Location not found'}</p>
        <button onClick={handleBack}>Back to Locations</button>
      </div>
    )
  }

  // Build full address display
  const addressParts = [
    location.address,
    location.city,
    location.state,
    location.zip,
    location.country,
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '—'

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Location Name', value: location.location_name },
        { label: 'Location Type', value: location.location_type || '—' },
        { label: 'Full Address', value: fullAddress, width: 'full' },
      ],
    },
    {
      title: 'Address Details',
      fields: [
        { label: 'Address', value: location.address || '—' },
        { label: 'City', value: location.city || '—' },
        { label: 'State', value: location.state || '—' },
        { label: 'ZIP Code', value: location.zip || '—' },
        { label: 'Country', value: location.country || '—' },
      ],
    },
    {
      title: 'Contact & Access',
      fields: [
        { label: 'Contact Phone', value: location.contact_phone || '—' },
        { label: 'Timezone', value: location.timezone || '—' },
        { label: 'Access Instructions', value: location.access_instructions || '—', width: 'full' },
        { label: 'Notes', value: location.notes || '—', width: 'full' },
      ],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Location ID', value: location.id },
        {
          label: 'Created',
          value: new Date(location.created_at).toLocaleString(),
        },
        {
          label: 'Last Updated',
          value: new Date(location.updated_at).toLocaleString(),
        },
      ],
    },
  ]

  // Define tabs
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <div>Overview content is rendered by GenericDetailView</div>,
    },
    {
      id: 'rooms',
      label: 'Rooms',
      content: (
        <div className="tab-content">
          <p className="text-muted">Rooms at this location will appear here.</p>
          <p className="text-muted">
            <em>Room functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'devices',
      label: 'Devices',
      content: (
        <div className="tab-content">
          <p className="text-muted">Devices at this location will appear here.</p>
          <p className="text-muted">
            <em>Device functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'people',
      label: 'People',
      content: (
        <div className="tab-content">
          <p className="text-muted">People at this location will appear here.</p>
          <p className="text-muted">
            <em>People functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'networks',
      label: 'Networks',
      content: (
        <div className="tab-content">
          <p className="text-muted">Networks at this location will appear here.</p>
          <p className="text-muted">
            <em>Network functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this location will appear here.</p>
          <p className="text-muted">
            <em>Audit log functionality coming soon...</em>
          </p>
        </div>
      ),
    },
  ]

  return (
    <>
      <GenericDetailView
        title={location.location_name}
        subtitle="Location"
        breadcrumbs={[
          { label: 'Locations', href: '/locations' },
          { label: location.location_name },
        ]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />

      <style jsx global>{`
        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: var(--color-brew-black-60);
        }

        .error-container h1 {
          color: var(--color-orange);
          margin-bottom: 1rem;
        }

        .error-container p {
          margin-bottom: 1.5rem;
          color: var(--color-brew-black-60);
        }

        .error-container button {
          padding: 0.75rem 1.5rem;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .error-container button:hover {
          opacity: 0.9;
        }

        .tab-content {
          padding: 2rem;
        }

        .text-muted {
          color: var(--color-brew-black-60);
          line-height: 1.6;
        }
      `}</style>
    </>
  )
}
