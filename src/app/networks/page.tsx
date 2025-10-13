/**
 * Networks List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Network, NetworkType } from '@/types'

// Helper function to format network type for display
function formatNetworkType(type: NetworkType): string {
  const typeMap: Record<string, string> = {
    lan: 'LAN',
    wan: 'WAN',
    dmz: 'DMZ',
    guest: 'Guest',
    management: 'Management',
    storage: 'Storage',
    production: 'Production',
    broadcast: 'Broadcast',
  }
  return typeMap[type] || type
}

// Define ALL possible columns for networks
const ALL_COLUMNS: ColumnConfig<Network>[] = [
  {
    key: 'network_name',
    label: 'Network Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide network name
    render: (network) => network.network_name,
  },
  {
    key: 'network_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'lan', label: 'LAN' },
      { value: 'wan', label: 'WAN' },
      { value: 'dmz', label: 'DMZ' },
      { value: 'guest', label: 'Guest' },
      { value: 'management', label: 'Management' },
      { value: 'storage', label: 'Storage' },
      { value: 'production', label: 'Production' },
      { value: 'broadcast', label: 'Broadcast' },
    ],
    render: (network) =>
      network.network_type ? (
        formatNetworkType(network.network_type)
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'network_address',
    label: 'Network Address',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (network) =>
      network.network_address ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
          {network.network_address}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'vlan_id',
    label: 'VLAN ID',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: true,
    render: (network) =>
      network.vlan_id !== null && network.vlan_id !== undefined ? (
        network.vlan_id.toString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'gateway',
    label: 'Gateway',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (network) =>
      network.gateway ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{network.gateway}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'dhcp_enabled',
    label: 'DHCP',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
    render: (network) =>
      network.dhcp_enabled ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: '#28C077',
            color: '#FAF9F5',
          }}
        >
          Enabled
        </span>
      ) : (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: 'rgba(35, 31, 32, 0.4)',
            color: '#FAF9F5',
          }}
        >
          Disabled
        </span>
      ),
  },
  {
    key: 'dns_servers',
    label: 'DNS Servers',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (network) => network.dns_servers || <span className="text-muted">—</span>,
  },
  {
    key: 'dhcp_range_start',
    label: 'DHCP Range Start',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (network) =>
      network.dhcp_range_start ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
          {network.dhcp_range_start}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'dhcp_range_end',
    label: 'DHCP Range End',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (network) =>
      network.dhcp_range_end ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{network.dhcp_range_end}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (network) => network.description || <span className="text-muted">—</span>,
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (network) => network.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (network) => new Date(network.created_at).toLocaleDateString(),
  },
]

export default function NetworksPage() {
  const router = useRouter()
  const [networks, setNetworks] = useState<Network[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('network_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch networks from API
  useEffect(() => {
    const fetchNetworks = async () => {
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

        const response = await fetch(`/api/networks?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch networks')
        }

        const result = await response.json()
        setNetworks(result.data?.networks || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching networks:', error)
        setNetworks([])
      } finally {
        setLoading(false)
      }
    }

    fetchNetworks()
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
    router.push('/networks/new')
  }

  return (
    <>
      <GenericListView
        title="Networks"
        columns={ALL_COLUMNS}
        data={networks}
        pagination={pagination}
        filterValues={filterValues}
        searchPlaceholder="Search networks..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add Network"
        emptyMessage="No networks found. Create your first network to get started."
        rowLink={(network) => `/networks/${network.id}`}
        enableColumnManagement={true}
        enablePerColumnFiltering={true}
      />

      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }
      `}</style>
    </>
  )
}
