/**
 * Rooms List Page
 *
 * Lists all rooms with filtering, search, and pagination
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, Column, Filter, Pagination } from '@/components/GenericListView'
import type { Room } from '@/types'

const COLUMNS: Column<Room>[] = [
  {
    key: 'room_name',
    label: 'Room Name',
    sortable: true,
    render: (room) => room.room_name,
  },
  {
    key: 'room_type',
    label: 'Type',
    sortable: true,
    render: (room) =>
      room.room_type ? formatRoomType(room.room_type) : <span className="text-muted">—</span>,
  },
  {
    key: 'floor',
    label: 'Floor',
    sortable: true,
    render: (room) => room.floor || <span className="text-muted">—</span>,
  },
  {
    key: 'capacity',
    label: 'Capacity',
    sortable: true,
    render: (room) =>
      room.capacity !== null && room.capacity !== undefined ? (
        room.capacity.toString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'access_requirements',
    label: 'Access Requirements',
    sortable: false,
    render: (room) => room.access_requirements || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (room) => new Date(room.created_at).toLocaleDateString(),
  },
]

const FILTERS: Filter[] = [
  {
    key: 'room_type',
    label: 'Room Type',
    type: 'select',
    options: [
      { value: 'server_room', label: 'Server Room' },
      { value: 'office', label: 'Office' },
      { value: 'conference_room', label: 'Conference Room' },
      { value: 'storage', label: 'Storage' },
      { value: 'studio', label: 'Studio' },
      { value: 'control_room', label: 'Control Room' },
      { value: 'other', label: 'Other' },
    ],
  },
]

// Helper function to format room type for display
function formatRoomType(type: string): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('room_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
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

        const response = await fetch(`/api/rooms?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch rooms')
        }

        const result = await response.json()
        setRooms(result.data?.rooms || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching rooms:', error)
        setRooms([])
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
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
    router.push('/rooms/new')
  }

  return (
    <>
      <GenericListView
        title="Rooms"
        columns={COLUMNS}
        data={rooms}
        pagination={pagination}
        filters={FILTERS}
        filterValues={filterValues}
        searchPlaceholder="Search rooms..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add Room"
        emptyMessage="No rooms found. Create your first room to get started."
        rowLink={(room) => `/rooms/${room.id}`}
      />

      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }
      `}</style>
    </>
  )
}
