/**
 * People List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Person, PersonType, PersonStatus } from '@/types'

// Helper function to format person type
function formatPersonType(type: PersonType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Helper function to get status color
function getStatusColor(status: PersonStatus): string {
  switch (status) {
    case 'active':
      return '#28C077' // Green
    case 'inactive':
      return '#ACD7FF' // Light Blue
    case 'terminated':
      return '#FD6A3D' // Orange
    default:
      return '#231F20' // Brew Black
  }
}

// Define ALL possible columns for people
const ALL_COLUMNS: ColumnConfig<Person>[] = [
  {
    key: 'full_name',
    label: 'Full Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide full name
    render: (person) => person.full_name,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (person) => person.email || <span className="text-muted">—</span>,
  },
  {
    key: 'person_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'employee', label: 'Employee' },
      { value: 'contractor', label: 'Contractor' },
      { value: 'vendor_contact', label: 'Vendor Contact' },
      { value: 'partner', label: 'Partner' },
      { value: 'customer', label: 'Customer' },
      { value: 'other', label: 'Other' },
    ],
    render: (person) => formatPersonType(person.person_type),
  },
  {
    key: 'department',
    label: 'Department',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (person) => person.department || <span className="text-muted">—</span>,
  },
  {
    key: 'job_title',
    label: 'Job Title',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (person) => person.job_title || <span className="text-muted">—</span>,
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
      { value: 'terminated', label: 'Terminated' },
    ],
    render: (person) => (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getStatusColor(person.status),
          color: person.status === 'inactive' ? '#231F20' : '#FAF9F5',
        }}
      >
        {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
      </span>
    ),
  },
  {
    key: 'username',
    label: 'Username',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (person) => person.username || <span className="text-muted">—</span>,
  },
  {
    key: 'employee_id',
    label: 'Employee ID',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (person) => person.employee_id || <span className="text-muted">—</span>,
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (person) => person.phone || <span className="text-muted">—</span>,
  },
  {
    key: 'mobile',
    label: 'Mobile',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (person) => person.mobile || <span className="text-muted">—</span>,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (person) =>
      person.start_date ? (
        new Date(person.start_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'preferred_contact_method',
    label: 'Preferred Contact',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (person) => person.preferred_contact_method || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (person) => new Date(person.created_at).toLocaleDateString(),
  },
]

export default function PeoplePage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('full_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch people from API
  useEffect(() => {
    const fetchPeople = async () => {
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

        const response = await fetch(`/api/people?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch people')
        }

        const result = await response.json()
        setPeople(result.data?.people || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching people:', error)
        setPeople([])
      } finally {
        setLoading(false)
      }
    }

    fetchPeople()
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
    router.push('/people/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="People"
          columns={ALL_COLUMNS}
          data={people}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search by name, email, username, or employee ID..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Person"
          emptyMessage="No people found. Add your first person to get started."
          rowLink={(person) => `/people/${person.id}`}
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
