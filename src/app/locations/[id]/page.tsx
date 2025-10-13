/**
 * Location Detail Page
 *
 * Shows detailed information about a specific location
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { RelatedItemsList, RelatedColumn } from '@/components/RelatedItemsList'
import { Badge } from '@/components/ui/Badge'
import { AttachmentsTab } from '@/components/AttachmentsTab'
import type { Location, Company, Room, Device, Person } from '@/types'

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [location, setLocation] = useState<Location | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
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

  // Fetch company data if location has company_id
  useEffect(() => {
    if (!location?.company_id) return

    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${location.company_id}`)
        if (response.ok) {
          const result = await response.json()
          setCompany(result.data)
        }
      } catch (err) {
        console.error('Error fetching company:', err)
        // Don't set error state for company fetch failures - just show company as unavailable
      }
    }

    fetchCompany()
  }, [location?.company_id])

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

      toast.success('Location deleted successfully')
      router.push('/locations')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete location')
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
        {
          label: 'Company',
          value: company ? (
            <a
              href={`/companies/${company.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {company.company_name}
            </a>
          ) : location.company_id ? (
            'Loading...'
          ) : (
            '—'
          ),
        },
        {
          label: 'Location Type',
          value: location.location_type
            ? {
                office: 'Office',
                datacenter: 'Data Center',
                warehouse: 'Warehouse',
                remote: 'Remote',
                other: 'Other',
              }[location.location_type] || location.location_type
            : '—',
        },
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

  // Define columns for related items
  const roomColumns: RelatedColumn<Room>[] = [
    { key: 'room_name', label: 'Room Name' },
    { key: 'room_number', label: 'Room #', width: '100px' },
    {
      key: 'room_type',
      label: 'Type',
      render: (room) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          office: { label: 'Office', color: 'blue' },
          conference_room: { label: 'Conference', color: 'purple' },
          server_room: { label: 'Server Room', color: 'orange' },
          closet: { label: 'Closet', color: 'gray' },
          studio: { label: 'Studio', color: 'green' },
          control_room: { label: 'Control Room', color: 'red' },
          edit_bay: { label: 'Edit Bay', color: 'yellow' },
          storage: { label: 'Storage', color: 'gray' },
          other: { label: 'Other', color: 'gray' },
        }
        const type = room.room_type ? typeMap[room.room_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '150px',
    },
    { key: 'floor', label: 'Floor', width: '100px' },
  ]

  const deviceColumns: RelatedColumn<Device>[] = [
    { key: 'hostname', label: 'Hostname' },
    {
      key: 'device_type',
      label: 'Type',
      render: (device) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          computer: { label: 'Computer', color: 'blue' },
          server: { label: 'Server', color: 'purple' },
          switch: { label: 'Switch', color: 'green' },
          router: { label: 'Router', color: 'orange' },
          firewall: { label: 'Firewall', color: 'red' },
          printer: { label: 'Printer', color: 'gray' },
          mobile: { label: 'Mobile', color: 'blue' },
        }
        const type = device.device_type ? typeMap[device.device_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '120px',
    },
    { key: 'model', label: 'Model' },
    { key: 'serial_number', label: 'Serial Number' },
    {
      key: 'status',
      label: 'Status',
      render: (device) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Active', color: 'success' },
          inactive: { label: 'Inactive', color: 'secondary' },
          retired: { label: 'Retired', color: 'default' },
          repair: { label: 'Repair', color: 'warning' },
          storage: { label: 'Storage', color: 'secondary' },
        }
        const status = device.status ? statusMap[device.status] : null
        return status ? (
          <Badge variant={status.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {status.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
  ]

  const peopleColumns: RelatedColumn<Person>[] = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'job_title', label: 'Title' },
    { key: 'department', label: 'Department' },
    {
      key: 'person_type',
      label: 'Type',
      render: (person) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          employee: { label: 'Employee', color: 'blue' },
          contractor: { label: 'Contractor', color: 'purple' },
          vendor_contact: { label: 'Vendor', color: 'orange' },
          partner: { label: 'Partner', color: 'green' },
          customer: { label: 'Customer', color: 'yellow' },
          other: { label: 'Other', color: 'gray' },
        }
        const type = person.person_type ? typeMap[person.person_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '120px',
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
        <RelatedItemsList<Room>
          apiEndpoint={`/api/rooms?location_id=${id}`}
          columns={roomColumns}
          linkPattern="/rooms/:id"
          addButtonLabel="Add Room"
          onAdd={() => router.push(`/rooms/new?location_id=${id}`)}
          emptyMessage="No rooms at this location"
          limit={20}
        />
      ),
    },
    {
      id: 'devices',
      label: 'Devices',
      content: (
        <RelatedItemsList<Device>
          apiEndpoint={`/api/devices?location_id=${id}`}
          columns={deviceColumns}
          linkPattern="/devices/:id"
          addButtonLabel="Add Device"
          onAdd={() => router.push(`/devices/new?location_id=${id}`)}
          emptyMessage="No devices at this location"
          limit={20}
        />
      ),
    },
    {
      id: 'people',
      label: 'People',
      content: (
        <RelatedItemsList<Person>
          apiEndpoint={`/api/people?location_id=${id}`}
          columns={peopleColumns}
          linkPattern="/people/:id"
          addButtonLabel="Add Person"
          onAdd={() => router.push(`/people/new?location_id=${id}`)}
          emptyMessage="No people at this location"
          limit={20}
        />
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
      id: 'attachments',
      label: 'Attachments',
      content: <AttachmentsTab objectType="location" objectId={id} canEdit={true} />,
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
