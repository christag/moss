/**
 * Devices List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Device, DeviceType, DeviceStatus } from '@/types'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Helper function to format device type
function formatDeviceType(type: DeviceType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Helper function to get status color
function getStatusColor(status: DeviceStatus): string {
  switch (status) {
    case 'active':
      return '#28C077' // Green
    case 'retired':
      return 'rgba(35, 31, 32, 0.4)' // Brew Black at 40% opacity
    case 'repair':
      return '#FD6A3D' // Orange
    case 'storage':
      return '#ACD7FF' // Light Blue
    default:
      return '#231F20' // Brew Black
  }
}

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    device_type: '',
    status: '',
    manufacturer: '',
    location_id: '',
  })
  const [sortBy, setSortBy] = useState<string>('hostname')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch devices data
  useEffect(() => {
    fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, sortBy, sortOrder, filters])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (search) params.append('search', search)
      if (filters.device_type) params.append('device_type', filters.device_type)
      if (filters.status) params.append('status', filters.status)
      if (filters.manufacturer) params.append('manufacturer', filters.manufacturer)
      if (filters.location_id) params.append('location_id', filters.location_id)

      const response = await fetch(`/api/devices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch devices')
      }

      const result = await response.json()
      setDevices(result.data?.devices || [])
      setPagination(result.data?.pagination || pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchDevices()
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return

    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.message || 'Failed to delete device')
        return
      }

      // Refresh the list
      fetchDevices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const columns: Column<Device>[] = [
    {
      key: 'hostname',
      label: 'Hostname',
      sortable: true,
      render: (device) => device.hostname || <span className="text-muted">—</span>,
    },
    {
      key: 'device_type',
      label: 'Type',
      sortable: true,
      render: (device) => formatDeviceType(device.device_type),
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      sortable: true,
      render: (device) => device.manufacturer || <span className="text-muted">—</span>,
    },
    {
      key: 'model',
      label: 'Model',
      sortable: true,
      render: (device) => device.model || <span className="text-muted">—</span>,
    },
    {
      key: 'serial_number',
      label: 'Serial Number',
      sortable: true,
      render: (device) => device.serial_number || <span className="text-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (device) => (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getStatusColor(device.status),
            color: device.status === 'storage' ? '#231F20' : '#FAF9F5',
          }}
        >
          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
        </span>
      ),
    },
  ]

  if (loading && devices.length === 0) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Blue Page Header with Title and Filters */}
      <div
        style={{
          backgroundColor: 'var(--color-blue)',
          color: 'var(--color-off-white)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="container">
          <div className="p-lg">
            {/* Title and Actions Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-size-h2)',
                  fontWeight: '700',
                  color: 'var(--color-off-white)',
                  margin: '0',
                }}
              >
                Devices
              </h1>
              <button
                onClick={() => router.push('/devices/new')}
                style={{
                  backgroundColor: 'var(--color-off-white)',
                  color: 'var(--color-blue)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                }}
              >
                + Add Device
              </button>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: '0' }}>
              <form onSubmit={handleSearch} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <input
                  type="text"
                  placeholder="Search by hostname, serial number, model, or asset tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: 'var(--font-size-base)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                />
              </form>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <select
                  value={filters.device_type}
                  onChange={(e) => handleFilterChange('device_type', e.target.value)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                >
                  <option value="">All Device Types</option>
                  <option value="computer">Computer</option>
                  <option value="server">Server</option>
                  <option value="switch">Switch</option>
                  <option value="router">Router</option>
                  <option value="firewall">Firewall</option>
                  <option value="printer">Printer</option>
                  <option value="mobile">Mobile Device</option>
                  <option value="iot">IoT Device</option>
                  <option value="appliance">Appliance</option>
                  <option value="av_equipment">AV Equipment</option>
                  <option value="broadcast_equipment">Broadcast Equipment</option>
                  <option value="patch_panel">Patch Panel</option>
                  <option value="ups">UPS</option>
                  <option value="pdu">PDU</option>
                  <option value="chassis">Chassis</option>
                  <option value="module">Module</option>
                  <option value="blade">Blade</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                  <option value="repair">Repair</option>
                  <option value="storage">Storage</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by manufacturer..."
                  value={filters.manufacturer}
                  onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Off-white Data Section */}
      <div className="container">
        <div className="p-lg">
          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: '#FD6A3D',
                color: 'var(--color-off-white)',
                borderRadius: '4px',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              {error}
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'var(--color-off-white)',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      onClick={() => column.sortable && handleSort(String(column.key))}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        textAlign: 'left',
                        cursor: column.sortable ? 'pointer' : 'default',
                        fontWeight: '600',
                      }}
                    >
                      {column.label}
                      {column.sortable && sortBy === column.key && (
                        <span style={{ marginLeft: 'var(--spacing-xs)' }}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                  <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'left' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/devices/${device.id}`)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                      >
                        {column.render
                          ? column.render(device)
                          : String(device[column.key as keyof Device])}
                      </td>
                    ))}
                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/devices/${device.id}/edit`)
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--color-light-blue)',
                            color: 'var(--color-black)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(device.id)
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--color-orange)',
                            color: 'var(--color-off-white)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)',
              }}
            >
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-off-white)',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-off-white)',
                  cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === pagination.totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
