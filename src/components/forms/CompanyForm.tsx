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
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'partner', label: 'Partner' },
  { value: 'customer', label: 'Customer' },
  { value: 'other', label: 'Other' },
]

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const isEditMode = !!company

  // Field configuration for company form
  const fields: FieldConfig[] = [
    {
      name: 'company_name',
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
      helpText: 'Company website URL',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      helpText: 'Main company phone number',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'contact@company.com',
      helpText: 'General company email address',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      placeholder: '123 Main Street',
      helpText: 'Street address',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'City',
    },
    {
      name: 'state',
      label: 'State/Province',
      type: 'text',
      placeholder: 'State or Province',
    },
    {
      name: 'zip',
      label: 'ZIP/Postal Code',
      type: 'text',
      placeholder: 'ZIP or Postal Code',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Country',
    },
    {
      name: 'account_number',
      label: 'Account Number',
      type: 'text',
      placeholder: 'Customer/vendor account number',
      helpText: 'Account number for this relationship',
    },
    {
      name: 'support_url',
      label: 'Support URL',
      type: 'url',
      placeholder: 'https://support.example.com',
      helpText: 'Support portal or knowledge base URL',
    },
    {
      name: 'support_phone',
      label: 'Support Phone',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      helpText: 'Technical support phone number',
    },
    {
      name: 'support_email',
      label: 'Support Email',
      type: 'email',
      placeholder: 'support@company.com',
      helpText: 'Technical support email address',
    },
    {
      name: 'tax_id',
      label: 'Tax ID',
      type: 'text',
      placeholder: 'Tax ID or EIN',
      helpText: 'Tax identification number',
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
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip: company.zip || '',
        country: company.country || '',
        account_number: company.account_number || '',
        support_url: company.support_url || '',
        support_phone: company.support_phone || '',
        support_email: company.support_email || '',
        tax_id: company.tax_id || '',
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
