/**
 * People List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Person, PersonType, PersonStatus } from '@/types'

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

export default function PeoplePage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
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
    person_type: '',
    department: '',
    status: '',
  })
  const [sortBy, setSortBy] = useState<string>('full_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch people data
  useEffect(() => {
    fetchPeople()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, sortBy, sortOrder, filters])

  const fetchPeople = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (search) params.append('search', search)
      if (filters.person_type) params.append('person_type', filters.person_type)
      if (filters.department) params.append('department', filters.department)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/people?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch people')
      }

      const result = await response.json()
      setPeople(result.data?.people || [])
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
    fetchPeople()
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
    if (!confirm('Are you sure you want to delete this person?')) return

    try {
      const response = await fetch(`/api/people/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.message || 'Failed to delete person')
        return
      }

      // Refresh the list
      fetchPeople()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const columns: Column<Person>[] = [
    {
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      render: (person) => person.full_name,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (person) => person.email || <span className="text-muted">—</span>,
    },
    {
      key: 'person_type',
      label: 'Type',
      sortable: true,
      render: (person) => formatPersonType(person.person_type),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (person) => person.department || <span className="text-muted">—</span>,
    },
    {
      key: 'job_title',
      label: 'Job Title',
      sortable: true,
      render: (person) => person.job_title || <span className="text-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
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
  ]

  if (loading && people.length === 0) {
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
                People
              </h1>
              <button
                onClick={() => router.push('/people/new')}
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
                + Add Person
              </button>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: '0' }}>
              <form onSubmit={handleSearch} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <input
                  type="text"
                  placeholder="Search by name, email, username, or employee ID..."
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
                  value={filters.person_type}
                  onChange={(e) => handleFilterChange('person_type', e.target.value)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                >
                  <option value="">All Types</option>
                  <option value="employee">Employee</option>
                  <option value="contractor">Contractor</option>
                  <option value="vendor_contact">Vendor Contact</option>
                  <option value="partner">Partner</option>
                  <option value="customer">Customer</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by department..."
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-black)',
                  }}
                />

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
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
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
                {people.map((person) => (
                  <tr
                    key={person.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/people/${person.id}`)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                      >
                        {column.render
                          ? column.render(person)
                          : String(person[column.key as keyof Person])}
                      </td>
                    ))}
                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/people/${person.id}/edit`)
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
                            handleDelete(person.id)
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
