/**
 * IP Addresses List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { IPAddress, IPAddressType } from '@/types'

// Helper function to format IP type for display
function formatIPType(type: IPAddressType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Helper function to get type color
function getTypeColor(type: IPAddressType): string {
  switch (type) {
    case 'static':
      return '#1C7FF2' // Morning Blue
    case 'dhcp':
      return '#28C077' // Green
    case 'reserved':
      return '#FFBB5C' // Tangerine
    case 'floating':
      return '#ACD7FF' // Light Blue
    default:
      return '#231F20' // Brew Black
  }
}

// Define ALL possible columns for IP addresses
const ALL_COLUMNS: ColumnConfig<IPAddress>[] = [
  {
    key: 'ip_address',
    label: 'IP Address',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true,
    render: (ip) => (
      <span style={{ fontFamily: 'monospace', fontSize: '0.95em', fontWeight: '500' }}>
        {ip.ip_address}
      </span>
    ),
  },
  {
    key: 'ip_version',
    label: 'Version',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'v4', label: 'IPv4' },
      { value: 'v6', label: 'IPv6' },
    ],
    render: (ip) =>
      ip.ip_version ? (
        <span style={{ fontWeight: '500' }}>{ip.ip_version.toUpperCase()}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'static', label: 'Static' },
      { value: 'dhcp', label: 'DHCP' },
      { value: 'reserved', label: 'Reserved' },
      { value: 'floating', label: 'Floating' },
    ],
    render: (ip) =>
      ip.type ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getTypeColor(ip.type),
            color: ip.type === 'floating' ? '#231F20' : '#FAF9F5',
          }}
        >
          {formatIPType(ip.type)}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'dns_name',
    label: 'DNS Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (ip) => ip.dns_name || <span className="text-muted">—</span>,
  },
  {
    key: 'assignment_date',
    label: 'Assignment Date',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (ip) =>
      ip.assignment_date ? (
        new Date(ip.assignment_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (ip) => ip.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (ip) => new Date(ip.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (ip) => new Date(ip.updated_at).toLocaleDateString(),
  },
]

export default function IPAddressesPage() {
  const router = useRouter()
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('ip_address')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch IP addresses from API
  useEffect(() => {
    const fetchIPAddresses = async () => {
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

        const response = await fetch(`/api/ip-addresses?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch IP addresses')
        }

        const result = await response.json()
        setIPAddresses(result.data?.ip_addresses || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching IP addresses:', error)
        setIPAddresses([])
      } finally {
        setLoading(false)
      }
    }

    fetchIPAddresses()
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
    router.push('/ip-addresses/new')
  }

  const handleViewConflicts = () => {
    router.push('/ip-addresses/conflicts')
  }

  const handleAllocate = () => {
    router.push('/ip-addresses/allocate')
  }

  return (
    <>
      <div className="page-header-with-actions">
        <h1 className="page-title">IP Addresses</h1>
        <div className="header-actions">
          <button
            onClick={handleViewConflicts}
            className="conflicts-button"
            aria-label="View IP conflicts"
          >
            View Conflicts
          </button>
          <button onClick={handleAllocate} className="allocate-button" aria-label="Allocate IP">
            Allocate IP
          </button>
          <button onClick={handleAdd} className="add-button" aria-label="Add IP Address">
            Add IP Address
          </button>
        </div>
      </div>
      <GenericListView
        title="IP Addresses"
        columns={ALL_COLUMNS}
        data={ipAddresses}
        pagination={pagination}
        filterValues={filterValues}
        searchPlaceholder="Search IP addresses..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add IP Address"
        emptyMessage="No IP addresses found. Add your first IP address to get started."
        rowLink={(ip) => `/ip-addresses/${ip.id}`}
        enableColumnManagement={true}
        enablePerColumnFiltering={true}
        hideTitle={true}
        hideAddButton={true}
      />

      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }

        .page-header-with-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 2rem 1rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .conflicts-button {
          padding: 0.5rem 1rem;
          background: var(--color-tangerine);
          color: var(--color-brew-black);
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .conflicts-button:hover {
          opacity: 0.9;
        }

        .allocate-button {
          padding: 0.5rem 1rem;
          background: var(--color-green);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .allocate-button:hover {
          opacity: 0.9;
        }

        .add-button {
          padding: 0.5rem 1rem;
          background: var(--color-morning-blue);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .add-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  )
}
