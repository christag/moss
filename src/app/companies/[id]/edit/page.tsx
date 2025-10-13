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
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/companies" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Companies
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <Link
            href={`/companies/${params.id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {company.company_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <CompanyForm company={company} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
