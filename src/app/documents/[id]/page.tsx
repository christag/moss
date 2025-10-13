/**
 * Document Detail Page with Tabs
 *
 * Features:
 * - Overview tab: Document metadata and content preview
 * - Associated Objects tab: 5 JunctionTableManager sections for devices, networks, services, locations, rooms
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  Document,
  DocumentType,
  DocumentStatus,
  Device,
  Network,
  SaaSService,
  Location,
  Room,
} from '@/types'
import { JunctionTableManager } from '@/components/JunctionTableManager'
import { Card, CardHeader, CardContent, Badge, Button } from '@/components/ui'
import { AttachmentsTab } from '@/components/AttachmentsTab'

interface DocumentAssociations {
  devices: Device[]
  networks: Network[]
  saas_services: SaaSService[]
  locations: Location[]
  rooms: Room[]
}

type TabName = 'overview' | 'associations' | 'attachments'

// Helper function to format document type for display
function formatDocumentType(type: DocumentType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: DocumentStatus): 'success' | 'info' | 'warning' {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'info'
    case 'archived':
      return 'warning'
    default:
      return 'info'
  }
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabName>('overview')

  // Associations tab state
  const [associations, setAssociations] = useState<DocumentAssociations | null>(null)
  const [associationsLoading, setAssociationsLoading] = useState(false)
  const [associationsError, setAssociationsError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/documents/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch document')
        setDocument(result.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Load associations when tab is selected
  useEffect(() => {
    if (activeTab === 'associations' && !associations) {
      loadAssociations()
    }
  }, [activeTab, id])

  const loadAssociations = async () => {
    try {
      setAssociationsLoading(true)
      setAssociationsError(null)

      // Load all associations in parallel
      const [devicesRes, networksRes, servicesRes, locationsRes, roomsRes] = await Promise.all([
        fetch(`/api/documents/${id}/devices`),
        fetch(`/api/documents/${id}/networks`),
        fetch(`/api/documents/${id}/saas-services`),
        fetch(`/api/documents/${id}/locations`),
        fetch(`/api/documents/${id}/rooms`),
      ])

      const [devices, networks, services, locations, rooms] = await Promise.all([
        devicesRes.json(),
        networksRes.json(),
        servicesRes.json(),
        locationsRes.json(),
        roomsRes.json(),
      ])

      if (
        !devices.success ||
        !networks.success ||
        !services.success ||
        !locations.success ||
        !rooms.success
      ) {
        throw new Error('Failed to fetch one or more associations')
      }

      setAssociations({
        devices: devices.data || [],
        networks: networks.data || [],
        saas_services: services.data || [],
        locations: locations.data || [],
        rooms: rooms.data || [],
      })
    } catch (err) {
      setAssociationsError(err instanceof Error ? err.message : 'Failed to load associations')
    } finally {
      setAssociationsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!document || !confirm(`Are you sure you want to delete "${document.title}"?`)) return
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete document')
      }
      toast.success('Document deleted successfully')
      router.push('/documents')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  // Device association handlers
  const handleAddDevice = async (device: Device) => {
    const response = await fetch(`/api/documents/${id}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: device.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to associate device')
    }

    await loadAssociations()
  }

  const handleRemoveDevice = async (deviceId: string) => {
    const response = await fetch(`/api/documents/${id}/devices/${deviceId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove device association')
    }

    await loadAssociations()
  }

  // Network association handlers
  const handleAddNetwork = async (network: Network) => {
    const response = await fetch(`/api/documents/${id}/networks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network_id: network.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to associate network')
    }

    await loadAssociations()
  }

  const handleRemoveNetwork = async (networkId: string) => {
    const response = await fetch(`/api/documents/${id}/networks/${networkId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove network association')
    }

    await loadAssociations()
  }

  // SaaS Service association handlers
  const handleAddService = async (service: SaaSService) => {
    const response = await fetch(`/api/documents/${id}/saas-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saas_service_id: service.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to associate service')
    }

    await loadAssociations()
  }

  const handleRemoveService = async (serviceId: string) => {
    const response = await fetch(`/api/documents/${id}/saas-services/${serviceId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove service association')
    }

    await loadAssociations()
  }

  // Location association handlers
  const handleAddLocation = async (location: Location) => {
    const response = await fetch(`/api/documents/${id}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_id: location.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to associate location')
    }

    await loadAssociations()
  }

  const handleRemoveLocation = async (locationId: string) => {
    const response = await fetch(`/api/documents/${id}/locations/${locationId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove location association')
    }

    await loadAssociations()
  }

  // Room association handlers
  const handleAddRoom = async (room: Room) => {
    const response = await fetch(`/api/documents/${id}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: room.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to associate room')
    }

    await loadAssociations()
  }

  const handleRemoveRoom = async (roomId: string) => {
    const response = await fetch(`/api/documents/${id}/rooms/${roomId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove room association')
    }

    await loadAssociations()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg text-center">Loading...</div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message" style={{ color: '#FD6A3D' }}>
            {error || 'Document not found'}
          </div>
          <Button onClick={() => router.push('/documents')} style={{ marginTop: '1rem' }}>
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  const totalAssociations = associations
    ? associations.devices.length +
      associations.networks.length +
      associations.saas_services.length +
      associations.locations.length +
      associations.rooms.length
    : 0

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
            <Link href="/documents" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
              Documents
            </Link>
            <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          </span>
          <span>{document.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-lg">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <h1 style={{ marginBottom: '0.5rem' }}>{document.title}</h1>
              {document.document_type && (
                <p style={{ color: '#231F20', opacity: 0.7, marginBottom: '0.5rem' }}>
                  {formatDocumentType(document.document_type)}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button onClick={() => router.push(`/documents/${id}/edit`)} variant="outline">
                Edit
              </Button>
              <Button onClick={handleDelete} variant="destructive">
                Delete
              </Button>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(document.status)}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <div
            className="tab-list"
            style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '2px solid #ACD7FF',
              paddingBottom: '0.5rem',
            }}
          >
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'overview' ? '2px solid #1C7FF2' : 'none',
                color: activeTab === 'overview' ? '#1C7FF2' : '#231F20',
                fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'associations' ? 'active' : ''}`}
              onClick={() => setActiveTab('associations')}
              style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'associations' ? '2px solid #1C7FF2' : 'none',
                color: activeTab === 'associations' ? '#1C7FF2' : '#231F20',
                fontWeight: activeTab === 'associations' ? 'bold' : 'normal',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              Associated Objects
              {totalAssociations > 0 && (
                <Badge
                  variant="blue"
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                >
                  {totalAssociations}
                </Badge>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'attachments' ? 'active' : ''}`}
              onClick={() => setActiveTab('attachments')}
              style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'attachments' ? '2px solid #1C7FF2' : 'none',
                color: activeTab === 'attachments' ? '#1C7FF2' : '#231F20',
                fontWeight: activeTab === 'attachments' ? 'bold' : 'normal',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              Attachments
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            {/* Document Info Card */}
            <Card style={{ marginBottom: '1.5rem' }}>
              <CardHeader>
                <h2>Document Information</h2>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                      Title
                    </p>
                    <p style={{ color: '#231F20', opacity: 0.8 }}>{document.title}</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                      Type
                    </p>
                    <p style={{ color: '#231F20', opacity: 0.8 }}>
                      {document.document_type
                        ? formatDocumentType(document.document_type)
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                      Version
                    </p>
                    <p style={{ color: '#231F20', opacity: 0.8 }}>
                      {document.version || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                      Status
                    </p>
                    <Badge variant={getStatusBadgeVariant(document.status)}>
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </Badge>
                  </div>
                  {document.created_date && (
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                        Created Date
                      </p>
                      <p style={{ color: '#231F20', opacity: 0.8 }}>
                        {new Date(document.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {document.updated_date && (
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#231F20' }}>
                        Updated Date
                      </p>
                      <p style={{ color: '#231F20', opacity: 0.8 }}>
                        {new Date(document.updated_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Preview Card */}
            {document.content && (
              <Card style={{ marginBottom: '1.5rem' }}>
                <CardHeader>
                  <h2>Content Preview</h2>
                </CardHeader>
                <CardContent>
                  <div
                    style={{
                      padding: '1rem',
                      background: '#FAF9F5',
                      borderRadius: '4px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: '#231F20',
                    }}
                  >
                    {document.content}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Card */}
            {document.notes && (
              <Card>
                <CardHeader>
                  <h2>Notes</h2>
                </CardHeader>
                <CardContent>
                  <p style={{ color: '#231F20', opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                    {document.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'associations' && (
          <div className="tab-content">
            {associationsLoading && <div className="p-lg text-center">Loading associations...</div>}
            {associationsError && (
              <div className="error-message" style={{ color: '#FD6A3D', marginBottom: '1rem' }}>
                {associationsError}
              </div>
            )}
            {associations && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Devices Section */}
                <Card>
                  <CardHeader>
                    <h2>Devices ({associations.devices.length})</h2>
                  </CardHeader>
                  <CardContent>
                    <JunctionTableManager<Device>
                      currentItems={associations.devices}
                      availableItemsEndpoint="/api/devices"
                      getItemLabel={(device) => device.hostname || 'Unnamed Device'}
                      onAdd={handleAddDevice}
                      onRemove={handleRemoveDevice}
                      placeholder="Search devices..."
                      emptyMessage="No devices associated with this document"
                    />
                  </CardContent>
                </Card>

                {/* Networks Section */}
                <Card>
                  <CardHeader>
                    <h2>Networks ({associations.networks.length})</h2>
                  </CardHeader>
                  <CardContent>
                    <JunctionTableManager<Network>
                      currentItems={associations.networks}
                      availableItemsEndpoint="/api/networks"
                      getItemLabel={(network) => network.network_name}
                      onAdd={handleAddNetwork}
                      onRemove={handleRemoveNetwork}
                      placeholder="Search networks..."
                      emptyMessage="No networks associated with this document"
                    />
                  </CardContent>
                </Card>

                {/* SaaS Services Section */}
                <Card>
                  <CardHeader>
                    <h2>SaaS Services ({associations.saas_services.length})</h2>
                  </CardHeader>
                  <CardContent>
                    <JunctionTableManager<SaaSService>
                      currentItems={associations.saas_services}
                      availableItemsEndpoint="/api/saas-services"
                      getItemLabel={(service) => service.service_name}
                      onAdd={handleAddService}
                      onRemove={handleRemoveService}
                      placeholder="Search services..."
                      emptyMessage="No SaaS services associated with this document"
                    />
                  </CardContent>
                </Card>

                {/* Locations Section */}
                <Card>
                  <CardHeader>
                    <h2>Locations ({associations.locations.length})</h2>
                  </CardHeader>
                  <CardContent>
                    <JunctionTableManager<Location>
                      currentItems={associations.locations}
                      availableItemsEndpoint="/api/locations"
                      getItemLabel={(location) => location.location_name}
                      onAdd={handleAddLocation}
                      onRemove={handleRemoveLocation}
                      placeholder="Search locations..."
                      emptyMessage="No locations associated with this document"
                    />
                  </CardContent>
                </Card>

                {/* Rooms Section */}
                <Card>
                  <CardHeader>
                    <h2>Rooms ({associations.rooms.length})</h2>
                  </CardHeader>
                  <CardContent>
                    <JunctionTableManager<Room>
                      currentItems={associations.rooms}
                      availableItemsEndpoint="/api/rooms"
                      getItemLabel={(room) => room.room_name}
                      onAdd={handleAddRoom}
                      onRemove={handleRemoveRoom}
                      placeholder="Search rooms..."
                      emptyMessage="No rooms associated with this document"
                    />
                  </CardContent>
                </Card>

                {/* Helper text */}
                <p
                  style={{ color: '#231F20', opacity: 0.7, fontSize: '0.9rem', marginTop: '1rem' }}
                >
                  Associate this document with devices, networks, services, locations, and rooms to
                  help organize and categorize your documentation.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="tab-content">
            <AttachmentsTab objectType="document" objectId={id} canEdit={true} />
          </div>
        )}
      </div>
    </div>
  )
}
