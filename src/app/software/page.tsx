/**
 * Software List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Software, SoftwareCategory } from '@/types'

// Helper function to format software category for display
function formatSoftwareCategory(category: SoftwareCategory): string {
  const formatted = category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Define ALL possible columns for software
const ALL_COLUMNS: ColumnConfig<Software>[] = [
  {
    key: 'product_name',
    label: 'Product Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide product name
    render: (software) => software.product_name,
  },
  {
    key: 'software_category',
    label: 'Category',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'productivity', label: 'Productivity' },
      { value: 'security', label: 'Security' },
      { value: 'development', label: 'Development' },
      { value: 'communication', label: 'Communication' },
      { value: 'infrastructure', label: 'Infrastructure' },
      { value: 'collaboration', label: 'Collaboration' },
      { value: 'broadcast', label: 'Broadcast' },
      { value: 'media', label: 'Media' },
      { value: 'other', label: 'Other' },
    ],
    render: (software) =>
      software.software_category ? (
        formatSoftwareCategory(software.software_category)
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (software) => software.description || <span className="text-muted">—</span>,
  },
  {
    key: 'website',
    label: 'Website',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (software) =>
      software.website ? (
        <a
          href={software.website}
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
    render: (software) => software.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (software) => new Date(software.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (software) => new Date(software.updated_at).toLocaleDateString(),
  },
]

export default function SoftwarePage() {
  const router = useRouter()
  const [software, setSoftware] = useState<Software[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('product_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch software from API
  useEffect(() => {
    const fetchSoftware = async () => {
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

        const response = await fetch(`/api/software?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch software')
        }

        const result = await response.json()
        setSoftware(result.data?.software || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching software:', error)
        setSoftware([])
      } finally {
        setLoading(false)
      }
    }

    fetchSoftware()
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
    router.push('/software/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Software Catalog"
          columns={ALL_COLUMNS}
          data={software}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search software..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Software"
          emptyMessage="No software found. Add your first software to get started."
          rowLink={(sw) => `/software/${sw.id}`}
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
