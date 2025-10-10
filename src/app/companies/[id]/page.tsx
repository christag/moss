/**
 * Company Detail Page
 *
 * Shows detailed information about a specific company
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import type { Company } from '@/types'

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch company data
  useEffect(() => {
    if (!id) return

    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch company')
        }
        const result = await response.json()
        setCompany(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [id])

  const handleEdit = () => {
    router.push(`/companies/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete company')
      }

      router.push('/companies')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete company')
    }
  }

  const handleBack = () => {
    router.push('/companies')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Company not found'}</p>
        <button onClick={handleBack}>Back to Companies</button>
      </div>
    )
  }

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Company Name', value: company.company_name },
        {
          label: 'Company Type',
          value:
            {
              own_organization: 'Own Organization',
              vendor: 'Vendor',
              manufacturer: 'Manufacturer',
              partner: 'Partner',
            }[company.company_type] || company.company_type,
        },
        {
          label: 'Website',
          value: company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-morning-blue)' }}
            >
              {company.website}
            </a>
          ) : (
            '—'
          ),
        },
      ],
    },
    {
      title: 'Additional Information',
      fields: [{ label: 'Notes', value: company.notes || '—' }],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Company ID', value: company.id },
        {
          label: 'Created',
          value: new Date(company.created_at).toLocaleString(),
        },
        {
          label: 'Last Updated',
          value: new Date(company.updated_at).toLocaleString(),
        },
      ],
    },
  ]

  // Define tabs
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <div>Overview content is rendered by GenericDetailView</div>,
    },
    {
      id: 'locations',
      label: 'Locations',
      content: (
        <div className="tab-content">
          <p className="text-muted">Locations associated with this company will appear here.</p>
          <p className="text-muted">
            <em>Location functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'contacts',
      label: 'Contacts',
      content: (
        <div className="tab-content">
          <p className="text-muted">People associated with this company will appear here.</p>
          <p className="text-muted">
            <em>Contact management functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'contracts',
      label: 'Contracts',
      content: (
        <div className="tab-content">
          <p className="text-muted">Contracts with this company will appear here.</p>
          <p className="text-muted">
            <em>Contract management functionality coming soon...</em>
          </p>
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this company will appear here.</p>
          <p className="text-muted">
            <em>Audit log functionality coming soon...</em>
          </p>
        </div>
      ),
    },
  ]

  return (
    <>
      <GenericDetailView
        title={company.company_name}
        subtitle="Company"
        breadcrumbs={[{ label: 'Companies', href: '/companies' }, { label: company.company_name }]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />

      <style jsx global>{`
        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: var(--color-brew-black-60);
        }

        .error-container h1 {
          color: var(--color-orange);
          margin-bottom: 1rem;
        }

        .error-container p {
          margin-bottom: 1.5rem;
          color: var(--color-brew-black-60);
        }

        .error-container button {
          padding: 0.75rem 1.5rem;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .error-container button:hover {
          opacity: 0.9;
        }

        .tab-content {
          padding: 2rem;
        }

        .text-muted {
          color: var(--color-brew-black-60);
          line-height: 1.6;
        }
      `}</style>
    </>
  )
}
