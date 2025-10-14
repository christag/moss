/**
 * Software Licenses List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { SoftwareLicense, LicenseType } from '@/types'

// Helper function to format license type for display
function formatLicenseType(type: LicenseType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Helper function to check if license is expired
function isExpired(expirationDate: Date | null): boolean {
  if (!expirationDate) return false
  return new Date(expirationDate) < new Date()
}

// Helper function to check if license is expiring soon (within 90 days)
function isExpiringSoon(expirationDate: Date | null): boolean {
  if (!expirationDate) return false
  const today = new Date()
  const expiry = new Date(expirationDate)
  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry >= 0 && daysUntilExpiry <= 90
}

// Define ALL possible columns for software licenses
const ALL_COLUMNS: ColumnConfig<SoftwareLicense>[] = [
  {
    key: 'license_type',
    label: 'License Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    alwaysVisible: true,
    filterOptions: [
      { value: 'perpetual', label: 'Perpetual' },
      { value: 'subscription', label: 'Subscription' },
      { value: 'free', label: 'Free' },
      { value: 'volume', label: 'Volume' },
      { value: 'site', label: 'Site' },
      { value: 'concurrent', label: 'Concurrent' },
    ],
    render: (license) =>
      license.license_type ? (
        formatLicenseType(license.license_type)
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'license_key',
    label: 'License Key',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (license) =>
      license.license_key ? (
        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{license.license_key}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'expiration_date',
    label: 'Expiration Date',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (license) => {
      if (!license.expiration_date) {
        return <span className="text-muted">—</span>
      }
      const dateStr = new Date(license.expiration_date).toLocaleDateString()
      const expired = isExpired(license.expiration_date)
      const expiringSoon = isExpiringSoon(license.expiration_date)

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{dateStr}</span>
          {expired && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: '#FD6A3D',
                color: '#FAF9F5',
              }}
            >
              Expired
            </span>
          )}
          {!expired && expiringSoon && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: '#FFBB5C',
                color: '#231F20',
              }}
            >
              Expiring Soon
            </span>
          )}
        </div>
      )
    },
  },
  {
    key: 'seat_count',
    label: 'Seats',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: true,
    render: (license) => {
      if (license.seat_count !== null && license.seat_count !== undefined) {
        const used = license.seats_used || 0
        return (
          <span>
            {used} / {license.seat_count}
          </span>
        )
      }
      return <span className="text-muted">—</span>
    },
  },
  {
    key: 'seats_used',
    label: 'Seats Used',
    sortable: true,
    filterable: true,
    filterType: 'number',
    defaultVisible: false,
    render: (license) =>
      license.seats_used !== null && license.seats_used !== undefined ? (
        license.seats_used.toString()
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
    render: (license) =>
      license.cost !== null && license.cost !== undefined ? (
        `$${license.cost.toLocaleString()}`
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'auto_renew',
    label: 'Auto Renew',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    render: (license) => (license.auto_renew ? 'Yes' : 'No'),
  },
  {
    key: 'purchase_date',
    label: 'Purchase Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (license) =>
      license.purchase_date ? (
        new Date(license.purchase_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'renewal_date',
    label: 'Renewal Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (license) =>
      license.renewal_date ? (
        new Date(license.renewal_date).toLocaleDateString()
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
    render: (license) => license.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (license) => new Date(license.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (license) => new Date(license.updated_at).toLocaleDateString(),
  },
]

export default function SoftwareLicensesPage() {
  const router = useRouter()
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('expiration_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch licenses from API
  useEffect(() => {
    const fetchLicenses = async () => {
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

        const response = await fetch(`/api/software-licenses?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch licenses')
        }

        const result = await response.json()
        setLicenses(result.data?.software_licenses || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching licenses:', error)
        setLicenses([])
      } finally {
        setLoading(false)
      }
    }

    fetchLicenses()
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
    router.push('/software-licenses/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Software Licenses"
          columns={ALL_COLUMNS}
          data={licenses}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search licenses..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add License"
          emptyMessage="No software licenses found. Add your first license to get started."
          rowLink={(license) => `/software-licenses/${license.id}`}
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
