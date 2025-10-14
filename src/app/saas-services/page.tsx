/**
 * SaaS Services List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { SaaSService, SaaSStatus, SaaSEnvironment, SaaSCriticality } from '@/types'

// Helper function to format environment for display
function formatEnvironment(env: SaaSEnvironment): string {
  return env.charAt(0).toUpperCase() + env.slice(1)
}

// Helper function to format criticality for display
function formatCriticality(criticality: SaaSCriticality): string {
  return criticality.charAt(0).toUpperCase() + criticality.slice(1)
}

// Helper function to get status color
function getStatusColor(status: SaaSStatus): string {
  switch (status) {
    case 'active':
      return '#28C077' // Green
    case 'trial':
      return '#FFBB5C' // Tangerine
    case 'inactive':
      return '#ACD7FF' // Light Blue
    case 'cancelled':
      return '#FD6A3D' // Orange
    default:
      return '#231F20' // Brew Black
  }
}

// Helper function to get criticality color
function getCriticalityColor(criticality: SaaSCriticality): string {
  switch (criticality) {
    case 'critical':
      return '#FD6A3D' // Orange
    case 'high':
      return '#FFBB5C' // Tangerine
    case 'medium':
      return '#ACD7FF' // Light Blue
    case 'low':
      return '#28C077' // Green
    default:
      return '#231F20' // Brew Black
  }
}

// Define ALL possible columns for SaaS services
const ALL_COLUMNS: ColumnConfig<SaaSService>[] = [
  {
    key: 'service_name',
    label: 'Service Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true,
    render: (service) => service.service_name,
  },
  {
    key: 'environment',
    label: 'Environment',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'production', label: 'Production' },
      { value: 'staging', label: 'Staging' },
      { value: 'development', label: 'Development' },
    ],
    render: (service) =>
      service.environment ? (
        formatEnvironment(service.environment)
      ) : (
        <span className="text-muted">—</span>
      ),
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
      { value: 'trial', label: 'Trial' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    render: (service) => (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getStatusColor(service.status),
          color: service.status === 'inactive' ? '#231F20' : '#FAF9F5',
        }}
      >
        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
      </span>
    ),
  },
  {
    key: 'criticality',
    label: 'Criticality',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'critical', label: 'Critical' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
    render: (service) =>
      service.criticality ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getCriticalityColor(service.criticality),
            color: service.criticality === 'medium' ? '#231F20' : '#FAF9F5',
          }}
        >
          {formatCriticality(service.criticality)}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'seat_count',
    label: 'Seats',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: true,
    render: (service) =>
      service.seat_count !== null && service.seat_count !== undefined ? (
        service.seat_count.toString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'cost',
    label: 'Cost',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: true,
    render: (service) =>
      service.cost !== null && service.cost !== undefined ? (
        `$${service.cost.toLocaleString()}`
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'service_url',
    label: 'Service URL',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) =>
      service.service_url ? (
        <a
          href={service.service_url}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          style={{ color: 'var(--color-morning-blue)' }}
        >
          Link
        </a>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'account_id',
    label: 'Account ID',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) => service.account_id || <span className="text-muted">—</span>,
  },
  {
    key: 'subscription_start',
    label: 'Subscription Start',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (service) =>
      service.subscription_start ? (
        new Date(service.subscription_start).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'subscription_end',
    label: 'Subscription End',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (service) =>
      service.subscription_end ? (
        new Date(service.subscription_end).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'billing_frequency',
    label: 'Billing Frequency',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) => service.billing_frequency || <span className="text-muted">—</span>,
  },
  {
    key: 'sso_provider',
    label: 'SSO Provider',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) => service.sso_provider || <span className="text-muted">—</span>,
  },
  {
    key: 'sso_protocol',
    label: 'SSO Protocol',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) => service.sso_protocol || <span className="text-muted">—</span>,
  },
  {
    key: 'scim_enabled',
    label: 'SCIM Enabled',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: false,
    filterOptions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    render: (service) => (service.scim_enabled ? 'Yes' : 'No'),
  },
  {
    key: 'provisioning_type',
    label: 'Provisioning Type',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) => service.provisioning_type || <span className="text-muted">—</span>,
  },
  {
    key: 'api_access_enabled',
    label: 'API Access',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: false,
    filterOptions: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
    render: (service) => (service.api_access_enabled ? 'Enabled' : 'Disabled'),
  },
  {
    key: 'api_documentation_url',
    label: 'API Documentation',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (service) =>
      service.api_documentation_url ? (
        <a
          href={service.api_documentation_url}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          style={{ color: 'var(--color-morning-blue)' }}
        >
          Link
        </a>
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
    render: (service) => service.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (service) => new Date(service.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (service) => new Date(service.updated_at).toLocaleDateString(),
  },
]

export default function SaaSServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<SaaSService[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('service_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
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

        const response = await fetch(`/api/saas-services?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch services')
        }

        const result = await response.json()
        setServices(result.data?.saas_services || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching services:', error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
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
    router.push('/saas-services/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="SaaS Services"
          columns={ALL_COLUMNS}
          data={services}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search SaaS services..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Service"
          emptyMessage="No SaaS services found. Add your first service to get started."
          rowLink={(service) => `/saas-services/${service.id}`}
          enableColumnManagement={true}
          enablePerColumnFiltering={true}
        />
      </Suspense>

      <style jsx global>{`
        .text-muted {
          color: var(--color-brew-black-40);
        }
        .link {
          color: var(--color-morning-blue);
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}
