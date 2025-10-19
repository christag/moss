/**
 * Create Company Page
 *
 * Form for creating a new company
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CompanyForm } from '@/components/CompanyForm'

export default function CreateCompanyPage() {
  const router = useRouter()

  const handleSuccess = (company: unknown) => {
    // Navigate to the newly created company's detail page
    const companyData = company as { id: string }
    router.push(`/companies/${companyData.id}`)
  }

  const handleCancel = () => {
    // Navigate back to companies list
    router.push('/companies')
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
          <span>New</span>
        </nav>

        <CompanyForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
