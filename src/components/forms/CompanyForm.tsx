/**
 * CompanyForm Component
 *
 * Specialized form for creating and editing companies using GenericForm
 */
'use client'

import React from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { CreateCompanySchema, UpdateCompanySchema } from '@/lib/schemas/company'
import type { Company } from '@/types'

interface CompanyFormProps {
  /** Edit mode: provide existing company data */
  company?: Company
  /** Callback after successful create/update */
  onSuccess?: (company: Company) => void
  /** Callback on cancel */
  onCancel?: () => void
}

const COMPANY_TYPE_OPTIONS = [
  { value: 'own_organization', label: 'Own Organization' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'partner', label: 'Partner' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const isEditMode = !!company

  // Field configuration for company form
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter company name',
      required: true,
      helpText: 'The official name of the company',
    },
    {
      name: 'company_type',
      label: 'Company Type',
      type: 'select',
      required: true,
      options: COMPANY_TYPE_OPTIONS,
      helpText: 'Select the type of company relationship',
    },
    {
      name: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://example.com',
      helpText: 'Company website URL (optional)',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: STATUS_OPTIONS,
      defaultValue: 'active',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes about this company...',
      rows: 4,
      helpText: 'Any additional information or notes',
    },
  ]

  // Determine API endpoint and method based on mode
  const apiEndpoint = isEditMode ? `/api/companies/${company.id}` : '/api/companies'
  const method = isEditMode ? 'PATCH' : 'POST'
  const schema = isEditMode ? UpdateCompanySchema : CreateCompanySchema

  // Prepare initial values for edit mode
  const initialValues = isEditMode
    ? {
        company_name: company.company_name,
        company_type: company.company_type,
        website: company.website || '',
        notes: company.notes || '',
      }
    : {}

  return (
    <GenericForm
      title={isEditMode ? 'Edit Company' : 'Create New Company'}
      fields={fields}
      schema={schema}
      apiEndpoint={apiEndpoint}
      method={method}
      initialValues={initialValues}
      onSuccess={onSuccess}
      onCancel={onCancel}
      submitText={isEditMode ? 'Update Company' : 'Create Company'}
      showCancel={true}
    />
  )
}
