/**
 * Devices List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Device, DeviceType, DeviceStatus } from '@/types'

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

// Define ALL possible columns for devices
const ALL_COLUMNS: ColumnConfig<Device>[] = [
  {
    key: 'hostname',
    label: 'Hostname',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide hostname
    render: (device) => device.hostname || <span className="text-muted">—</span>,
  },
  {
    key: 'device_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'computer', label: 'Computer' },
      { value: 'server', label: 'Server' },
      { value: 'switch', label: 'Switch' },
      { value: 'router', label: 'Router' },
      { value: 'firewall', label: 'Firewall' },
      { value: 'printer', label: 'Printer' },
      { value: 'mobile', label: 'Mobile Device' },
      { value: 'iot', label: 'IoT Device' },
      { value: 'appliance', label: 'Appliance' },
      { value: 'av_equipment', label: 'AV Equipment' },
      { value: 'broadcast_equipment', label: 'Broadcast Equipment' },
      { value: 'patch_panel', label: 'Patch Panel' },
      { value: 'ups', label: 'UPS' },
      { value: 'pdu', label: 'PDU' },
      { value: 'chassis', label: 'Chassis' },
      { value: 'module', label: 'Module' },
      { value: 'blade', label: 'Blade' },
    ],
    render: (device) => formatDeviceType(device.device_type),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'active', label: 'Active' },
      { value: 'retired', label: 'Retired' },
      { value: 'repair', label: 'Repair' },
      { value: 'storage', label: 'Storage' },
    ],
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
  {
    key: 'manufacturer',
    label: 'Manufacturer',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (device) => device.manufacturer || <span className="text-muted">—</span>,
  },
  {
    key: 'model',
    label: 'Model',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (device) => device.model || <span className="text-muted">—</span>,
  },
  {
    key: 'serial_number',
    label: 'Serial Number',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (device) => device.serial_number || <span className="text-muted">—</span>,
  },
  {
    key: 'asset_tag',
    label: 'Asset Tag',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (device) => device.asset_tag || <span className="text-muted">—</span>,
  },
  {
    key: 'operating_system',
    label: 'OS',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (device) => device.operating_system || <span className="text-muted">—</span>,
  },
  {
    key: 'os_version',
    label: 'OS Version',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (device) => device.os_version || <span className="text-muted">—</span>,
  },
  {
    key: 'purchase_date',
    label: 'Purchase Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (device) =>
      device.purchase_date ? (
        new Date(device.purchase_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'warranty_expiration',
    label: 'Warranty Expiration',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (device) =>
      device.warranty_expiration ? (
        new Date(device.warranty_expiration).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'install_date',
    label: 'Install Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (device) =>
      device.install_date ? (
        new Date(device.install_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'last_audit_date',
    label: 'Last Audit',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (device) =>
      device.last_audit_date ? (
        new Date(device.last_audit_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (device) => new Date(device.created_at).toLocaleDateString(),
  },
]

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('hostname')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        params.append('limit', '50')
        params.append('sort_by', sortBy)
        params.append('sort_order', sortOrder)

        if (searchValue) {
          params.append('search', searchValue)
        }

        // Add all filter values (both column filters and legacy filters)
        Object.entries(filterValues).forEach(([key, value]) => {
          if (value && value !== '') {
            params.append(key, value)
          }
        })

        const response = await fetch(`/api/devices?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch devices')
        }

        const result = await response.json()
        setDevices(result.data?.devices || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching devices:', error)
        setDevices([])
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [currentPage, sortBy, sortOrder, searchValue, filterValues])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleAdd = () => {
    router.push('/devices/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Devices"
          columns={ALL_COLUMNS}
          data={devices}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search by hostname, serial number, model, or asset tag..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Device"
          emptyMessage="No devices found. Add your first device to get started."
          rowLink={(device) => `/devices/${device.id}`}
          enableColumnManagement={true}
          enablePerColumnFiltering={true}
          enableExport={true}
          exportObjectType="devices"
          exportObjectTypeName="Devices"
        />
      </Suspense>
      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }
      `}</style>
    </>
  )
}
