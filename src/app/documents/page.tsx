/**
 * Documents List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Document, DocumentType, DocumentStatus } from '@/types'

// Helper function to format document type for display
function formatDocumentType(type: DocumentType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Helper function to get status color (using design system)
function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'published':
      return '#28C077' // Green
    case 'draft':
      return '#ACD7FF' // Light Blue
    case 'archived':
      return '#FD6A3D' // Orange
    default:
      return '#231F20' // Brew Black
  }
}

// Helper function to get type color (using Morning Blue variations)
function getTypeColor(type: DocumentType): string {
  const typeColors: Record<string, string> = {
    policy: '#1C7FF2', // Morning Blue
    procedure: '#ACD7FF', // Light Blue
    diagram: '#28C077', // Green
    runbook: '#FFBB5C', // Tangerine
    architecture: '#1C7FF2', // Morning Blue
    sop: '#ACD7FF', // Light Blue
    network_diagram: '#28C077', // Green
    rack_diagram: '#28C077', // Green
    other: '#231F20', // Brew Black
  }
  return typeColors[type] || '#231F20'
}

// Define ALL possible columns for documents
const ALL_COLUMNS: ColumnConfig<Document>[] = [
  {
    key: 'title',
    label: 'Title',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide title
    render: (doc) => doc.title,
  },
  {
    key: 'document_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'policy', label: 'Policy' },
      { value: 'procedure', label: 'Procedure' },
      { value: 'diagram', label: 'Diagram' },
      { value: 'runbook', label: 'Runbook' },
      { value: 'architecture', label: 'Architecture' },
      { value: 'sop', label: 'SOP' },
      { value: 'network_diagram', label: 'Network Diagram' },
      { value: 'rack_diagram', label: 'Rack Diagram' },
      { value: 'other', label: 'Other' },
    ],
    render: (doc) =>
      doc.document_type ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getTypeColor(doc.document_type),
            color:
              doc.document_type === 'other' ||
              doc.document_type === 'policy' ||
              doc.document_type === 'architecture'
                ? '#FAF9F5'
                : '#231F20',
          }}
        >
          {formatDocumentType(doc.document_type)}
        </span>
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
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ],
    render: (doc) => (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getStatusColor(doc.status),
          color: doc.status === 'draft' ? '#231F20' : '#FAF9F5',
        }}
      >
        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
      </span>
    ),
  },
  {
    key: 'version',
    label: 'Version',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (doc) => doc.version || <span className="text-muted">—</span>,
  },
  {
    key: 'created_date',
    label: 'Document Created Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (doc) =>
      doc.created_date ? (
        new Date(doc.created_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'updated_date',
    label: 'Document Updated Date',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (doc) =>
      doc.updated_date ? (
        new Date(doc.updated_date).toLocaleDateString()
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
    render: (doc) => doc.notes || <span className="text-muted">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (doc) => new Date(doc.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (doc) => new Date(doc.updated_at).toLocaleDateString(),
  },
]

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [pagination, setPagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
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

        const response = await fetch(`/api/documents?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch documents')
        }

        const result = await response.json()
        setDocuments(result.data?.documents || result.data || [])
        setPagination(result.data?.pagination)
      } catch (error) {
        console.error('Error fetching documents:', error)
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
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
    router.push('/documents/new')
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <GenericListView
          title="Documents"
          columns={ALL_COLUMNS}
          data={documents}
          pagination={pagination}
          filterValues={filterValues}
          searchPlaceholder="Search documents..."
          searchValue={searchValue}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onAdd={handleAdd}
          addButtonLabel="Add Document"
          emptyMessage="No documents found. Create your first document to get started."
          rowLink={(doc) => `/documents/${doc.id}`}
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
