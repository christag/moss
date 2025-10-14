/**
 * Rooms List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Room, RoomType } from '@/types'

// Helper function to format room type for display
function formatRoomType(type: RoomType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Define ALL possible columns for rooms
const ALL_COLUMNS: ColumnConfig<Room>[] = [
  {
    key: 'room_name',
    label: 'Room Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide room name
    render: (room) => room.room_name,
  },
  {
    key: 'room_number',
    label: 'Room Number',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (room) => room.room_number || <span className="text-muted">—</span>,
  },
  {
    key: 'room_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'server_room', label: 'Server Room' },
      { value: 'office', label: 'Office' },
      { value: 'conference_room', label: 'Conference Room' },
      { value: 'storage', label: 'Storage' },
      { value: 'studio', label: 'Studio' },
      { value: 'control_room', label: 'Control Room' },
      { value: 'other', label: 'Other' },
    ],
    render: (room) =>
      room.room_type ? formatRoomType(room.room_type) : <span className="text-muted">—</span>,
  },
  {
    key: 'floor',
    label: 'Floor',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (room) => room.floor || <span className="text-muted">—</span>,
  },
  {
    key: 'capacity',
    label: 'Capacity',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: true,
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
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (room) => room.access_requirements || <span className="text-muted">—</span>,
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (room) => room.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (room) => new Date(room.created_at).toLocaleDateString(),
  },
]

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

        // Add all filter values (both column filters and legacy filters)
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
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Rooms"
          columns={ALL_COLUMNS}
          data={rooms}
          pagination={pagination}
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
