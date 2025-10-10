/**
 * Room Detail Page
 *
 * Shows detailed information about a specific room
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import type { Room, Location } from '@/types'

export default function RoomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch room data
  useEffect(() => {
    if (!id) return

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch room')
        }
        const result = await response.json()
        setRoom(result.data)

        // Fetch location data if available
        if (result.data.location_id) {
          const locationResponse = await fetch(`/api/locations/${result.data.location_id}`)
          if (locationResponse.ok) {
            const locationResult = await locationResponse.json()
            setLocation(locationResult.data)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [id])

  const handleEdit = () => {
    router.push(`/rooms/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete room')
      }

      router.push('/rooms')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete room')
    }
  }

  const handleBack = () => {
    router.push('/rooms')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Room not found'}</p>
        <button onClick={handleBack}>Back to Rooms</button>
      </div>
    )
  }

  // Helper function to format room type
  const formatRoomType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Room Name', value: room.room_name },
        { label: 'Room Type', value: room.room_type ? formatRoomType(room.room_type) : '—' },
        { label: 'Floor', value: room.floor || '—' },
        {
          label: 'Capacity',
          value:
            room.capacity !== null && room.capacity !== undefined ? room.capacity.toString() : '—',
        },
      ],
    },
    {
      title: 'Location',
      fields: [
        {
          label: 'Location',
          value: location ? location.location_name : room.location_id,
        },
      ],
    },
    {
      title: 'Access',
      fields: [
        {
          label: 'Access Requirements',
          value: room.access_requirements || '—',
          width: 'full',
        },
      ],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Room ID', value: room.id },
        {
          label: 'Created',
          value: new Date(room.created_at).toLocaleString(),
        },
        {
          label: 'Last Updated',
          value: new Date(room.updated_at).toLocaleString(),
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
      id: 'devices',
      label: 'Devices',
      content: (
        <div className="tab-content">
          <p className="text-muted">Devices in this room will appear here.</p>
          <p className="text-muted">
            <em>Device functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'patch-panels',
      label: 'Patch Panels',
      content: (
        <div className="tab-content">
          <p className="text-muted">Patch panels in this room will appear here.</p>
          <p className="text-muted">
            <em>Patch panel functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'documentation',
      label: 'Documentation',
      content: (
        <div className="tab-content">
          <p className="text-muted">Documentation for this room will appear here.</p>
          <p className="text-muted">
            <em>Documentation functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this room will appear here.</p>
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
        title={room.room_name}
        subtitle="Room"
        breadcrumbs={[{ label: 'Rooms', href: '/rooms' }, { label: room.room_name }]}
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
