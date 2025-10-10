/**
 * Create Company Page
 *
 * Form for creating a new company
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CompanyForm } from '@/components/forms/CompanyForm'
import type { Company } from '@/types'

export default function CreateCompanyPage() {
  const router = useRouter()

  const handleSuccess = (company: Company) => {
    // Navigate to the newly created company's detail page
    router.push(`/companies/${company.id}`)
  }

  const handleCancel = () => {
    // Navigate back to companies list
    router.push('/companies')
  }

  return (
    <div className="create-company-page">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link href="/companies" className="breadcrumb-link">
            Companies
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">New Company</span>
        </div>
      </div>

      <div className="page-content">
        <CompanyForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>

      <style jsx>{`
        .create-company-page {
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

        @media (max-width: 768px) {
          .create-company-page {
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
