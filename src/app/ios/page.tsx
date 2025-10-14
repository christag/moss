/**
 * IOs (Interfaces & Ports) List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { IO, InterfaceType, IOStatus, MediaType } from '@/types'

// Helper function to format interface type for display
function formatInterfaceType(type: InterfaceType): string {
  const typeMap: Record<InterfaceType, string> = {
    ethernet: 'Ethernet',
    wifi: 'WiFi',
    virtual: 'Virtual',
    fiber_optic: 'Fiber Optic',
    sdi: 'SDI',
    hdmi: 'HDMI',
    xlr: 'XLR',
    usb: 'USB',
    thunderbolt: 'Thunderbolt',
    displayport: 'DisplayPort',
    coax: 'Coax',
    serial: 'Serial',
    patch_panel_port: 'Patch Panel',
    power_input: 'Power Input',
    power_output: 'Power Output',
    other: 'Other',
  }
  return typeMap[type] || type
}

// Helper function to format status for display
function formatStatus(status: IOStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Helper function to get status color
function getStatusColor(status: IOStatus): string {
  switch (status) {
    case 'active':
      return '#28C077' // Green
    case 'inactive':
      return 'rgba(35, 31, 32, 0.4)' // Brew Black 40%
    case 'monitoring':
      return '#ACD7FF' // Light Blue
    case 'reserved':
      return '#FFBB5C' // Tangerine
    default:
      return '#231F20' // Brew Black
  }
}

// Helper function to format media type
function formatMediaType(mediaType: MediaType): string {
  return mediaType.replace(/_/g, ' ')
}

// Define ALL possible columns for IOs
const ALL_COLUMNS: ColumnConfig<IO>[] = [
  {
    key: 'interface_name',
    label: 'Interface Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true,
    render: (io) => io.interface_name,
  },
  {
    key: 'interface_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'ethernet', label: 'Ethernet' },
      { value: 'wifi', label: 'WiFi' },
      { value: 'virtual', label: 'Virtual' },
      { value: 'fiber_optic', label: 'Fiber Optic' },
      { value: 'sdi', label: 'SDI' },
      { value: 'hdmi', label: 'HDMI' },
      { value: 'xlr', label: 'XLR' },
      { value: 'usb', label: 'USB' },
      { value: 'thunderbolt', label: 'Thunderbolt' },
      { value: 'displayport', label: 'DisplayPort' },
      { value: 'coax', label: 'Coax' },
      { value: 'serial', label: 'Serial' },
      { value: 'patch_panel_port', label: 'Patch Panel' },
      { value: 'power_input', label: 'Power Input' },
      { value: 'power_output', label: 'Power Output' },
    ],
    render: (io) => formatInterfaceType(io.interface_type),
  },
  {
    key: 'port_number',
    label: 'Port',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (io) => io.port_number || <span className="text-muted">—</span>,
  },
  {
    key: 'media_type',
    label: 'Media',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (io) =>
      io.media_type ? formatMediaType(io.media_type) : <span className="text-muted">—</span>,
  },
  {
    key: 'speed',
    label: 'Speed',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (io) => io.speed || <span className="text-muted">—</span>,
  },
  {
    key: 'mac_address',
    label: 'MAC Address',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (io) =>
      io.mac_address ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{io.mac_address}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
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
      { value: 'inactive', label: 'Inactive' },
      { value: 'monitoring', label: 'Monitoring' },
      { value: 'reserved', label: 'Reserved' },
    ],
    render: (io) => (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getStatusColor(io.status),
          color:
            io.status === 'inactive'
              ? '#FAF9F5'
              : io.status === 'monitoring' || io.status === 'reserved'
                ? '#231F20'
                : '#FAF9F5',
        }}
      >
        {formatStatus(io.status)}
      </span>
    ),
  },
  {
    key: 'duplex',
    label: 'Duplex',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: false,
    filterOptions: [
      { value: 'full', label: 'Full' },
      { value: 'half', label: 'Half' },
      { value: 'auto', label: 'Auto' },
      { value: 'n/a', label: 'N/A' },
    ],
    render: (io) => (io.duplex ? io.duplex.toUpperCase() : <span className="text-muted">—</span>),
  },
  {
    key: 'trunk_mode',
    label: 'Trunk Mode',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: false,
    filterOptions: [
      { value: 'access', label: 'Access' },
      { value: 'trunk', label: 'Trunk' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'n/a', label: 'N/A' },
    ],
    render: (io) =>
      io.trunk_mode ? (
        io.trunk_mode.charAt(0).toUpperCase() + io.trunk_mode.slice(1)
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'voltage',
    label: 'Voltage',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.voltage || <span className="text-muted">—</span>,
  },
  {
    key: 'amperage',
    label: 'Amperage',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.amperage || <span className="text-muted">—</span>,
  },
  {
    key: 'wattage',
    label: 'Wattage',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.wattage || <span className="text-muted">—</span>,
  },
  {
    key: 'power_connector_type',
    label: 'Power Connector',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.power_connector_type || <span className="text-muted">—</span>,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.description || <span className="text-muted">—</span>,
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (io) => io.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (io) => new Date(io.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (io) => new Date(io.updated_at).toLocaleDateString(),
  },
]

export default function IOsPage() {
  const router = useRouter()
  const [ios, setIos] = useState<IO[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('interface_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch IOs from API
  useEffect(() => {
    const fetchIOs = async () => {
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

        const response = await fetch(`/api/ios?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch IOs')
        }

        const result = await response.json()
        setIos(result.data?.ios || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching IOs:', error)
        setIos([])
      } finally {
        setLoading(false)
      }
    }

    fetchIOs()
  }, [currentPage, sortBy, sortOrder, searchValue, filterValues])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
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
    router.push('/ios/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Interfaces & Ports"
          columns={ALL_COLUMNS}
          data={ios}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search interfaces..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Interface"
          emptyMessage="No interfaces found. Add your first interface to get started."
          rowLink={(io) => `/ios/${io.id}`}
          enableColumnManagement={true}
          enablePerColumnFiltering={true}
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
