/**
 * External Documents List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import { Icon } from '@/components/ui'
import type { ExternalDocument, ExternalDocumentType } from '@/types'

// Helper function to format document type for display
function formatDocumentType(type: ExternalDocumentType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return formatted
}

// Helper function to get type color (using design system)
// Uses Morning Blue as default, secondary colors only for semantic meaning
function getTypeColor(type: ExternalDocumentType): string {
  const typeColors: Record<string, string> = {
    password_vault: '#FD6A3D', // Orange - high security/critical
    ssl_certificate: '#28C077', // Green - valid/active certificate
    domain_registrar: '#1C7FF2', // Morning Blue
    ticket: '#1C7FF2', // Morning Blue
    runbook: '#1C7FF2', // Morning Blue
    diagram: '#1C7FF2', // Morning Blue
    wiki_page: '#1C7FF2', // Morning Blue
    contract: '#1C7FF2', // Morning Blue
    invoice: '#FFBB5C', // Tangerine - attention/payment needed
    other: '#231F20', // Brew Black
  }
  return typeColors[type] || '#231F20'
}

// Define ALL possible columns for external documents
const ALL_COLUMNS: ColumnConfig<ExternalDocument>[] = [
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
      { value: 'password_vault', label: 'Password Vault' },
      { value: 'ssl_certificate', label: 'SSL Certificate' },
      { value: 'domain_registrar', label: 'Domain Registrar' },
      { value: 'ticket', label: 'Ticket' },
      { value: 'runbook', label: 'Runbook' },
      { value: 'diagram', label: 'Diagram' },
      { value: 'wiki_page', label: 'Wiki Page' },
      { value: 'contract', label: 'Contract' },
      { value: 'invoice', label: 'Invoice' },
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
            // Off White text for dark backgrounds (orange, blue, black), Brew Black for light backgrounds
            color:
              doc.document_type === 'password_vault' || // Orange background
              doc.document_type === 'ssl_certificate' || // Green background
              doc.document_type === 'other' || // Black background
              doc.document_type === 'domain_registrar' || // Morning Blue background
              doc.document_type === 'ticket' || // Morning Blue background
              doc.document_type === 'runbook' || // Morning Blue background
              doc.document_type === 'diagram' || // Morning Blue background
              doc.document_type === 'wiki_page' || // Morning Blue background
              doc.document_type === 'contract' // Morning Blue background
                ? '#FAF9F5'
                : '#231F20', // Brew Black for Tangerine (invoice)
          }}
        >
          {formatDocumentType(doc.document_type)}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'url',
    label: 'URL',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (doc) =>
      doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1C7FF2',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          Link
          <Icon name="external_link" size={12} aria-label="Opens in new tab" />
        </a>
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
    render: (doc) =>
      doc.description ? (
        <span
          style={{
            display: 'inline-block',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={doc.description}
        >
          {doc.description}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
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
    render: (doc) =>
      doc.notes ? (
        <span
          style={{
            display: 'inline-block',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={doc.notes}
        >
          {doc.notes}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
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

export default function ExternalDocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<ExternalDocument[]>([])
  const [pagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch external documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchValue) {
        params.set('search', searchValue)
      }

      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      })

      const response = await fetch(`/api/external-documents?${params}`)
      const result = await response.json()

      if (result.success) {
        setDocuments(result.data)
      } else {
        console.error('Failed to fetch external documents:', result.message)
      }
    } catch (error) {
      console.error('Error fetching external documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [searchValue, filterValues, sortBy, sortOrder])

  const handleAdd = () => {
    router.push('/external-documents/new')
  }

  const handleRowClick = (doc: ExternalDocument) => {
    router.push(`/external-documents/${doc.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this external document?')) {
      return
    }

    try {
      const response = await fetch(`/api/external-documents/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        await fetchDocuments()
      } else {
        alert(`Failed to delete: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting external document:', error)
      alert('An error occurred while deleting the external document')
    }
  }

  return (
    <GenericListView<ExternalDocument>
      title="External Documents"
      description="Links to external systems, password vaults, tickets, wikis, and contracts"
      data={documents}
      columns={ALL_COLUMNS}
      pagination={pagination}
      loading={loading}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      sortBy={sortBy}
      onSortChange={setSortBy}
      sortOrder={sortOrder}
      onSortOrderChange={setSortOrder}
      onAdd={handleAdd}
      onRowClick={handleRowClick}
      onDelete={handleDelete}
      searchPlaceholder="Search external documents by title or description..."
      emptyMessage="No external documents found. Add your first external document to get started."
    />
  )
}
