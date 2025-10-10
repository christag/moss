/**
 * Locations List Page
 *
 * Lists all locations with filtering, search, and pagination
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, Column, Filter, Pagination } from '@/components/GenericListView'
import type { Location } from '@/types'

const COLUMNS: Column<Location>[] = [
  {
    key: 'location_name',
    label: 'Location Name',
    sortable: true,
    render: (location) => location.location_name,
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    render: (location) => location.city || <span className="text-muted">—</span>,
  },
  {
    key: 'state',
    label: 'State/Province',
    sortable: true,
    render: (location) => location.state || <span className="text-muted">—</span>,
  },
  {
    key: 'country',
    label: 'Country',
    sortable: true,
    render: (location) => location.country || <span className="text-muted">—</span>,
  },
  {
    key: 'location_type',
    label: 'Type',
    sortable: true,
    render: (location) => location.location_type || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (location) => new Date(location.created_at).toLocaleDateString(),
  },
]

const FILTERS: Filter[] = [
  {
    key: 'location_type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'office', label: 'Office' },
      { value: 'datacenter', label: 'Data Center' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'remote', label: 'Remote' },
      { value: 'other', label: 'Other' },
    ],
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

        // Only add filter values that are not empty
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
        columns={COLUMNS}
        data={locations}
        pagination={pagination}
        filters={FILTERS}
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
      />

      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }
      `}</style>
    </>
  )
}
