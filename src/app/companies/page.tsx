/**
 * Companies List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Company } from '@/types'

// Define ALL possible columns for companies
const ALL_COLUMNS: ColumnConfig<Company>[] = [
  {
    key: 'company_name',
    label: 'Company Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide company name
    render: (company) => company.company_name,
  },
  {
    key: 'company_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'own_organization', label: 'Own Organization' },
      { value: 'vendor', label: 'Vendor' },
      { value: 'manufacturer', label: 'Manufacturer' },
      { value: 'service_provider', label: 'Service Provider' },
      { value: 'partner', label: 'Partner' },
      { value: 'customer', label: 'Customer' },
      { value: 'other', label: 'Other' },
    ],
    render: (company) => {
      const typeLabels: Record<string, string> = {
        own_organization: 'Own Organization',
        vendor: 'Vendor',
        manufacturer: 'Manufacturer',
        service_provider: 'Service Provider',
        partner: 'Partner',
        customer: 'Customer',
        other: 'Other',
      }
      return typeLabels[company.company_type] || company.company_type
    },
  },
  {
    key: 'website',
    label: 'Website',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (company) =>
      company.website ? (
        <a href={company.website} target="_blank" rel="noopener noreferrer" className="link">
          {company.website}
        </a>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (company) => company.phone || <span className="text-muted">—</span>,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false, // Hidden by default, can be shown
    render: (company) => company.email || <span className="text-muted">—</span>,
  },
  {
    key: 'address',
    label: 'Address',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.address || <span className="text-muted">—</span>,
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.city || <span className="text-muted">—</span>,
  },
  {
    key: 'state',
    label: 'State',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.state || <span className="text-muted">—</span>,
  },
  {
    key: 'country',
    label: 'Country',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.country || <span className="text-muted">—</span>,
  },
  {
    key: 'account_number',
    label: 'Account #',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.account_number || <span className="text-muted">—</span>,
  },
  {
    key: 'support_phone',
    label: 'Support Phone',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.support_phone || <span className="text-muted">—</span>,
  },
  {
    key: 'support_email',
    label: 'Support Email',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.support_email || <span className="text-muted">—</span>,
  },
  {
    key: 'tax_id',
    label: 'Tax ID',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (company) => company.tax_id || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false, // Date filtering can be added later
    defaultVisible: true,
    render: (company) => new Date(company.created_at).toLocaleDateString(),
  },
]

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('company_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
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

        const response = await fetch(`/api/companies?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch companies')
        }

        const result = await response.json()
        setCompanies(result.data?.companies || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching companies:', error)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
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
    router.push('/companies/new')
  }

  return (
    <>
      <GenericListView
        title="Companies"
        columns={ALL_COLUMNS}
        data={companies}
        pagination={pagination}
        filterValues={filterValues}
        searchPlaceholder="Search companies..."
        searchValue={searchValue}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        addButtonLabel="Add Company"
        emptyMessage="No companies found. Create your first company to get started."
        rowLink={(company) => `/companies/${company.id}`}
        enableColumnManagement={true}
        enablePerColumnFiltering={true}
      />

      <style jsx global>{`
        .link {
          color: var(--color-morning-blue);
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
        }

        .text-muted {
          color: var(--color-brew-black-40);
        }
      `}</style>
    </>
  )
}
