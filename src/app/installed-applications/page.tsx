/**
 * Installed Applications List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { InstalledApplication, DeploymentStatus } from '@/types'

// Helper function to format deployment status for display
function formatDeploymentStatus(status: DeploymentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Helper function to get deployment status color
function getDeploymentStatusColor(status: DeploymentStatus): string {
  switch (status) {
    case 'production':
      return '#28C077' // Green
    case 'pilot':
      return '#ACD7FF' // Light Blue
    case 'deprecated':
      return '#FFBB5C' // Tangerine
    case 'retired':
      return 'rgba(35, 31, 32, 0.4)' // Brew Black 40%
    default:
      return '#231F20' // Brew Black
  }
}

// Define ALL possible columns for installed applications
const ALL_COLUMNS: ColumnConfig<InstalledApplication>[] = [
  {
    key: 'application_name',
    label: 'Application Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true,
    render: (app) => app.application_name,
  },
  {
    key: 'version',
    label: 'Version',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (app) => app.version || <span className="text-muted">—</span>,
  },
  {
    key: 'deployment_status',
    label: 'Deployment Status',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'pilot', label: 'Pilot' },
      { value: 'production', label: 'Production' },
      { value: 'deprecated', label: 'Deprecated' },
      { value: 'retired', label: 'Retired' },
    ],
    render: (app) =>
      app.deployment_status ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getDeploymentStatusColor(app.deployment_status),
            color: app.deployment_status === 'pilot' ? '#231F20' : '#FAF9F5',
          }}
        >
          {formatDeploymentStatus(app.deployment_status)}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'deployment_platform',
    label: 'Platform',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (app) => app.deployment_platform || <span className="text-muted">—</span>,
  },
  {
    key: 'install_date',
    label: 'Install Date',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (app) =>
      app.install_date ? (
        new Date(app.install_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'auto_update_enabled',
    label: 'Auto Update',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
    render: (app) => (app.auto_update_enabled ? 'Yes' : 'No'),
  },
  {
    key: 'install_method',
    label: 'Install Method',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (app) => app.install_method || <span className="text-muted">—</span>,
  },
  {
    key: 'package_id',
    label: 'Package ID',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (app) => app.package_id || <span className="text-muted">—</span>,
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (app) => app.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (app) => new Date(app.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (app) => new Date(app.updated_at).toLocaleDateString(),
  },
]

export default function InstalledApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<InstalledApplication[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('application_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
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

        const response = await fetch(`/api/installed-applications?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch applications')
        }

        const result = await response.json()
        setApplications(result.data?.installed_applications || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching applications:', error)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
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
    router.push('/installed-applications/new')
  }

  return (
    <>
      <GenericListView
        title="Installed Applications"
        columns={ALL_COLUMNS}
        data={applications}
        pagination={pagination}
        filterValues={filterValues}
        searchPlaceholder="Search applications..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add Application"
        emptyMessage="No installed applications found. Add your first application to get started."
        rowLink={(app) => `/installed-applications/${app.id}`}
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
