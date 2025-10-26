/**
 * Device Detail Page
 *
 * Shows detailed information about a specific device with relationship tabs
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { RelatedItemsList, RelatedColumn } from '@/components/RelatedItemsList'
import { EditableTable, ColumnConfig } from '@/components/EditableTable'
import { BulkAction } from '@/components/BulkActionToolbar'
import { Badge } from '@/components/ui/Badge'
import { AttachmentsTab } from '@/components/AttachmentsTab'
import { DeviceDuplicates } from '@/components/DeviceDuplicates'
import type { Device, Company, Location, Room, Person, IO, InstalledApplication } from '@/types'

export default function DeviceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [device, setDevice] = useState<Device | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [assignedTo, setAssignedTo] = useState<Person | null>(null)
  const [parentDevice, setParentDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch device data
  useEffect(() => {
    if (!id) return

    const fetchDevice = async () => {
      try {
        const response = await fetch(`/api/devices/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch device')
        }
        const result = await response.json()
        setDevice(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDevice()
  }, [id])

  // Fetch related entities
  useEffect(() => {
    if (!device) return

    const fetchRelated = async () => {
      try {
        // Fetch company
        if (device.company_id) {
          const companyResponse = await fetch(`/api/companies/${device.company_id}`)
          if (companyResponse.ok) {
            const result = await companyResponse.json()
            setCompany(result.data)
          }
        }

        // Fetch location
        if (device.location_id) {
          const locationResponse = await fetch(`/api/locations/${device.location_id}`)
          if (locationResponse.ok) {
            const result = await locationResponse.json()
            setLocation(result.data)
          }
        }

        // Fetch room
        if (device.room_id) {
          const roomResponse = await fetch(`/api/rooms/${device.room_id}`)
          if (roomResponse.ok) {
            const result = await roomResponse.json()
            setRoom(result.data)
          }
        }

        // Fetch assigned person
        if (device.assigned_to_id) {
          const personResponse = await fetch(`/api/people/${device.assigned_to_id}`)
          if (personResponse.ok) {
            const result = await personResponse.json()
            setAssignedTo(result.data)
          }
        }

        // Fetch parent device
        if (device.parent_device_id) {
          const parentResponse = await fetch(`/api/devices/${device.parent_device_id}`)
          if (parentResponse.ok) {
            const result = await parentResponse.json()
            setParentDevice(result.data)
          }
        }
      } catch (err) {
        console.error('Error fetching related data:', err)
      }
    }

    fetchRelated()
  }, [device])

  const handleEdit = () => {
    router.push(`/devices/${id}/edit`)
  }

  const handleBack = () => {
    router.push('/devices')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete device')
      }

      toast.success('Device deleted successfully')
      router.push('/devices')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete device')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Device not found'}</p>
        <button onClick={handleBack}>Back to Devices</button>
      </div>
    )
  }

  // Helper to format device type
  const formatDeviceType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Helper to format date
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '—'
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  // Define editable columns for interfaces
  const ioEditableColumns: ColumnConfig<IO>[] = [
    {
      key: 'interface_name',
      label: 'Interface Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., eth0, gi0/1',
      width: '200px',
    },
    {
      key: 'port_number',
      label: 'Port #',
      type: 'text',
      placeholder: '1-48',
      width: '100px',
    },
    {
      key: 'interface_type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'ethernet', label: 'Ethernet' },
        { value: 'fiber_optic', label: 'Fiber' },
        { value: 'wifi', label: 'WiFi' },
        { value: 'sdi', label: 'SDI' },
        { value: 'hdmi', label: 'HDMI' },
        { value: 'xlr', label: 'XLR' },
        { value: 'coax', label: 'Coax' },
        { value: 'patch_panel_port', label: 'Patch Panel' },
        { value: 'power_input', label: 'Power In' },
        { value: 'power_output', label: 'Power Out' },
        { value: 'serial', label: 'Serial' },
        { value: 'usb', label: 'USB' },
        { value: 'thunderbolt', label: 'Thunderbolt' },
        { value: 'displayport', label: 'DisplayPort' },
        { value: 'virtual', label: 'Virtual' },
        { value: 'other', label: 'Other' },
      ],
      width: '150px',
    },
    {
      key: 'speed',
      label: 'Speed',
      type: 'text',
      placeholder: '1G, 10G, 100M',
      width: '120px',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'monitoring', label: 'Monitoring' },
        { value: 'reserved', label: 'Reserved' },
      ],
      width: '120px',
    },
    {
      key: 'mac_address',
      label: 'MAC Address',
      type: 'text',
      placeholder: '00:11:22:33:44:55',
      width: '160px',
    },
  ]

  // Define bulk actions for interfaces
  // TODO: Implement bulk action functionality - needs EditableTable to expose selectedIds
  const ioBulkActions: BulkAction[] = [
    {
      id: 'set-active',
      label: 'Set Active',
      icon: '✓',
      variant: 'primary',
      onClick: async () => {
        // TODO: Get selectedIds from EditableTable
        const selectedIds = new Set<string>()
        if (selectedIds.size === 0) {
          toast.error('No items selected')
          return
        }
        try {
          const response = await fetch('/api/ios/bulk-update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ids: Array.from(selectedIds),
              updates: { status: 'active' },
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to update interfaces')
          }

          toast.success(`${selectedIds.size} interface(s) set to active`)
          // Trigger refetch by updating device state
          setDevice({ ...device! })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update')
        }
      },
    },
    {
      id: 'set-inactive',
      label: 'Set Inactive',
      icon: '○',
      variant: 'secondary',
      onClick: async () => {
        const selectedIds = new Set<string>()
        if (selectedIds.size === 0) {
          toast.error('No items selected')
          return
        }
        try {
          const response = await fetch('/api/ios/bulk-update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ids: Array.from(selectedIds),
              updates: { status: 'inactive' },
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to update interfaces')
          }

          toast.success(`${selectedIds.size} interface(s) set to inactive`)
          setDevice({ ...device! })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update')
        }
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑',
      variant: 'destructive',
      onClick: async () => {
        const selectedIds = new Set<string>()
        if (selectedIds.size === 0) {
          toast.error('No items selected')
          return
        }
        if (
          !confirm(
            `Are you sure you want to delete ${selectedIds.size} interface(s)? This cannot be undone.`
          )
        ) {
          return
        }

        try {
          const deletePromises = Array.from(selectedIds).map((id) =>
            fetch(`/api/ios/${id}`, { method: 'DELETE' })
          )

          await Promise.all(deletePromises)

          toast.success(`${selectedIds.size} interface(s) deleted`)
          setDevice({ ...device! })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete')
        }
      },
    },
  ]

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Hostname', value: device.hostname || '—' },
        { label: 'Device Type', value: formatDeviceType(device.device_type) },
        { label: 'Asset Tag', value: device.asset_tag || '—' },
        { label: 'Operating System', value: device.operating_system || '—' },
        { label: 'OS Version', value: device.os_version || '—' },
      ],
    },
    {
      title: 'Hardware Details',
      fields: [
        { label: 'Manufacturer', value: device.manufacturer || '—' },
        { label: 'Model', value: device.model || '—' },
        { label: 'Serial Number', value: device.serial_number || '—' },
      ],
    },
    {
      title: 'Assignment & Location',
      fields: [
        {
          label: 'Assigned To',
          value: assignedTo ? (
            <a
              href={`/people/${assignedTo.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {assignedTo.full_name}
            </a>
          ) : (
            '—'
          ),
        },
        {
          label: 'Company',
          value: company ? (
            <a
              href={`/companies/${company.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {company.company_name}
            </a>
          ) : (
            '—'
          ),
        },
        {
          label: 'Location',
          value: location ? (
            <a
              href={`/locations/${location.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {location.location_name}
            </a>
          ) : (
            '—'
          ),
        },
        {
          label: 'Room',
          value: room ? (
            <a
              href={`/rooms/${room.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {room.room_name}
            </a>
          ) : (
            '—'
          ),
        },
        {
          label: 'Parent Device',
          value: parentDevice ? (
            <a
              href={`/devices/${parentDevice.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {parentDevice.hostname || parentDevice.serial_number || 'Parent Device'}
            </a>
          ) : (
            '—'
          ),
        },
      ],
    },
    {
      title: 'Dates & Warranty',
      fields: [
        { label: 'Purchase Date', value: formatDate(device.purchase_date) },
        { label: 'Install Date', value: formatDate(device.install_date) },
        { label: 'Warranty Expiration', value: formatDate(device.warranty_expiration) },
        { label: 'Last Audit Date', value: formatDate(device.last_audit_date) },
      ],
    },
    {
      title: 'Notes',
      fields: [{ label: 'Notes', value: device.notes || '—', width: 'full' }],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Device ID', value: device.id },
        { label: 'Created', value: new Date(device.created_at).toLocaleString() },
        { label: 'Last Updated', value: new Date(device.updated_at).toLocaleString() },
      ],
    },
  ]

  const childDeviceColumns: RelatedColumn<Device>[] = [
    { key: 'hostname', label: 'Hostname' },
    { key: 'device_type', label: 'Type', render: (d) => formatDeviceType(d.device_type) },
    { key: 'model', label: 'Model' },
    { key: 'serial_number', label: 'Serial Number' },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <Badge
          variant={
            d.status === 'active' ? 'success' : d.status === 'repair' ? 'warning' : 'default'
          }
        >
          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
        </Badge>
      ),
      width: '100px',
    },
  ]

  const installedAppColumns: RelatedColumn<InstalledApplication>[] = [
    { key: 'application_name', label: 'Application' },
    { key: 'version', label: 'Version', width: '120px' },
    { key: 'install_method', label: 'Install Method', width: '150px' },
    {
      key: 'deployment_status',
      label: 'Status',
      render: (app) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          pilot: { label: 'Pilot', color: 'warning' },
          production: { label: 'Production', color: 'success' },
          deprecated: { label: 'Deprecated', color: 'secondary' },
          retired: { label: 'Retired', color: 'default' },
        }
        const status = app.deployment_status ? statusMap[app.deployment_status] : null
        return status ? (
          <Badge variant={status.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {status.label}
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
      id: 'ios',
      label: 'Interfaces/Ports',
      content: (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '1rem',
              padding: '0 1rem',
            }}
          >
            <button
              onClick={() => router.push(`/topology?device_id=${id}&depth=2`)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-morning-blue, #1C7FF2)',
                color: 'var(--color-off-white, #FAF9F5)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'Inter',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              View Network Topology
            </button>
          </div>
          <EditableTable<IO>
            apiEndpoint={`/api/ios?device_id=${id}`}
            columns={ioEditableColumns}
            selectable={true}
            addNewRow={true}
            addNewLabel="Add Interface"
            onAddNew={() => router.push(`/ios/new?device_id=${id}`)}
            bulkActions={ioBulkActions}
            editable={true}
            updateEndpoint="/api/ios/:id"
            deleteEndpoint="/api/ios/:id"
            emptyMessage="No interfaces/ports configured for this device"
            limit={50}
          />
        </div>
      ),
    },
    {
      id: 'child-devices',
      label: 'Child Devices',
      content: (
        <RelatedItemsList<Device>
          apiEndpoint={`/api/devices?parent_device_id=${id}`}
          columns={childDeviceColumns}
          linkPattern="/devices/:id"
          addButtonLabel="Add Child Device"
          onAdd={() => router.push(`/devices/new?parent_device_id=${id}`)}
          emptyMessage="No child devices (modules/blades) for this device"
          limit={20}
        />
      ),
    },
    {
      id: 'installed-apps',
      label: 'Installed Applications',
      content: (
        <RelatedItemsList<InstalledApplication>
          apiEndpoint={`/api/installed-applications?device_id=${id}`}
          columns={installedAppColumns}
          linkPattern="/installed-applications/:id"
          emptyMessage="No applications installed on this device"
          limit={50}
        />
      ),
    },
    {
      id: 'duplicates',
      label: 'Potential Duplicates',
      content: <DeviceDuplicates deviceId={id} onDelete={() => setDevice(null)} />,
    },
    {
      id: 'attachments',
      label: 'Attachments',
      content: <AttachmentsTab objectType="device" objectId={id} canEdit={true} />,
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this device will appear here.</p>
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
        title={device.hostname || device.serial_number || 'Unnamed Device'}
        subtitle={formatDeviceType(device.device_type)}
        status={device.status}
        breadcrumbs={[
          { label: 'Devices', href: '/devices' },
          { label: device.hostname || device.serial_number || 'Device' },
        ]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
