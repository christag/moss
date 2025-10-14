/**
 * Groups List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Group, GroupType } from '@/types'

// Helper function to format group type for display
function formatGroupType(type: GroupType): string {
  const typeMap: Record<string, string> = {
    active_directory: 'Active Directory',
    okta: 'Okta',
    google_workspace: 'Google Workspace',
    jamf_smart_group: 'Jamf Smart Group',
    intune: 'Intune',
    custom: 'Custom',
    distribution_list: 'Distribution List',
    security: 'Security',
  }
  return typeMap[type] || type
}

// Define ALL possible columns for groups
const ALL_COLUMNS: ColumnConfig<Group>[] = [
  {
    key: 'group_name',
    label: 'Group Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide group name
    render: (group) => group.group_name,
  },
  {
    key: 'group_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'active_directory', label: 'Active Directory' },
      { value: 'okta', label: 'Okta' },
      { value: 'google_workspace', label: 'Google Workspace' },
      { value: 'jamf_smart_group', label: 'Jamf Smart Group' },
      { value: 'intune', label: 'Intune' },
      { value: 'custom', label: 'Custom' },
      { value: 'distribution_list', label: 'Distribution List' },
      { value: 'security', label: 'Security' },
    ],
    render: (group) => formatGroupType(group.group_type),
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (group) => group.description || <span className="text-muted">—</span>,
  },
  {
    key: 'group_id_external',
    label: 'External ID',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (group) => group.group_id_external || <span className="text-muted">—</span>,
  },
  {
    key: 'created_date',
    label: 'Group Created Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (group) =>
      group.created_date ? (
        new Date(group.created_date).toLocaleDateString()
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
    render: (group) => group.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (group) => new Date(group.created_at).toLocaleDateString(),
  },
]

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('group_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
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

        const response = await fetch(`/api/groups?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch groups')
        }

        const result = await response.json()
        setGroups(result.data?.groups || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
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
    router.push('/groups/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Groups"
          columns={ALL_COLUMNS}
          data={groups}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search groups..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Group"
          emptyMessage="No groups found. Create your first group to get started."
          rowLink={(group) => `/groups/${group.id}`}
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
