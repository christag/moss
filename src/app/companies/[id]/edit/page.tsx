/**
 * Edit Company Page
 *
 * Form for editing an existing company
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CompanyForm } from '@/components/forms/CompanyForm'
import type { Company } from '@/types'

interface EditCompanyPageProps {
  params: {
    id: string
  }
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`)
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
  }, [params.id])

  const handleSuccess = (updatedCompany: Company) => {
    // Navigate back to the company's detail page
    router.push(`/companies/${updatedCompany.id}`)
  }

  const handleCancel = () => {
    // Navigate back to the company's detail page
    router.push(`/companies/${params.id}`)
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
        <button onClick={() => router.push('/companies')}>Back to Companies</button>
      </div>
    )
  }

  return (
    <div className="edit-company-page">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link href="/companies" className="breadcrumb-link">
            Companies
          </Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/companies/${company.id}`} className="breadcrumb-link">
            {company.company_name}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Edit</span>
        </div>
      </div>

      <div className="page-content">
        <CompanyForm company={company} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>

      <style jsx>{`
        .edit-company-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .breadcrumb-link {
          color: var(--color-morning-blue);
          text-decoration: none;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: var(--color-brew-black-40);
        }

        .breadcrumb-current {
          color: var(--color-brew-black);
          font-weight: 500;
        }

        .page-content {
          background: var(--color-off-white);
          border-radius: 8px;
          padding: 2rem;
        }

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

        @media (max-width: 768px) {
          .edit-company-page {
            padding: 1rem;
          }

          .page-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
