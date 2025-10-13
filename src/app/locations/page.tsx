/**
 * Locations List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Location } from '@/types'

// Define ALL possible columns for locations
const ALL_COLUMNS: ColumnConfig<Location>[] = [
  {
    key: 'location_name',
    label: 'Location Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide location name
    render: (location) => location.location_name,
  },
  {
    key: 'location_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'office', label: 'Office' },
      { value: 'datacenter', label: 'Data Center' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'remote', label: 'Remote' },
      { value: 'other', label: 'Other' },
    ],
    render: (location) => location.location_type || <span className="text-muted">—</span>,
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (location) => location.city || <span className="text-muted">—</span>,
  },
  {
    key: 'state',
    label: 'State/Province',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (location) => location.state || <span className="text-muted">—</span>,
  },
  {
    key: 'country',
    label: 'Country',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (location) => location.country || <span className="text-muted">—</span>,
  },
  {
    key: 'address',
    label: 'Address',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (location) => location.address || <span className="text-muted">—</span>,
  },
  {
    key: 'zip',
    label: 'ZIP/Postal Code',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (location) => location.zip || <span className="text-muted">—</span>,
  },
  {
    key: 'timezone',
    label: 'Timezone',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (location) => location.timezone || <span className="text-muted">—</span>,
  },
  {
    key: 'contact_phone',
    label: 'Contact Phone',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (location) => location.contact_phone || <span className="text-muted">—</span>,
  },
  {
    key: 'access_instructions',
    label: 'Access Instructions',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (location) => location.access_instructions || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (location) => new Date(location.created_at).toLocaleDateString(),
  },
]

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('location_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
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

        const response = await fetch(`/api/locations?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch locations')
        }

        const result = await response.json()
        setLocations(result.data?.locations || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
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
    router.push('/locations/new')
  }

  return (
    <>
      <GenericListView
        title="Locations"
        columns={ALL_COLUMNS}
        data={locations}
        pagination={pagination}
        filterValues={filterValues}
        searchPlaceholder="Search locations..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add Location"
        emptyMessage="No locations found. Create your first location to get started."
        rowLink={(location) => `/locations/${location.id}`}
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
