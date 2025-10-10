/**
 * LocationForm Component
 *
 * Specialized form for creating and editing locations using GenericForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/schemas/location'
import type { Location, Company } from '@/types'

interface LocationFormProps {
  /** Edit mode: provide existing location data */
  location?: Location
  /** Callback after successful create/update */
  onSuccess?: (location: Location) => void
  /** Callback on cancel */
  onCancel?: () => void
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
]

export function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const isEditMode = !!location
  const [companies, setCompanies] = useState<Company[]>([])

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies?limit=200&sort_by=name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          setCompanies(result.data?.companies || [])
        }
      } catch (error) {
        console.error('Error fetching companies:', error)
      }
    }
    fetchCompanies()
  }, [])

  // Field configuration for location form
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Location Name',
      type: 'text',
      placeholder: 'Enter location name',
      required: true,
      helpText: 'The name of this location',
    },
    {
      name: 'company_id',
      label: 'Company',
      type: 'select',
      options: [
        { value: '', label: 'No Company' },
        ...companies.map((company) => ({
          value: company.id,
          label: company.company_name,
        })),
      ],
      helpText: 'The company that owns or manages this location',
    },
    {
      name: 'address_line1',
      label: 'Address Line 1',
      type: 'text',
      placeholder: 'Street address',
      helpText: 'Street address',
    },
    {
      name: 'address_line2',
      label: 'Address Line 2',
      type: 'text',
      placeholder: 'Apartment, suite, unit, etc.',
      helpText: 'Additional address information',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'City',
    },
    {
      name: 'state_province',
      label: 'State/Province',
      type: 'text',
      placeholder: 'State or Province',
    },
    {
      name: 'postal_code',
      label: 'Postal Code',
      type: 'text',
      placeholder: 'ZIP or postal code',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Country',
    },
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      placeholder: '37.7749',
      helpText: 'Geographic latitude (-90 to 90)',
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      placeholder: '-122.4194',
      helpText: 'Geographic longitude (-180 to 180)',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: STATUS_OPTIONS,
      defaultValue: 'active',
    },
  ]

  // Determine API endpoint and method based on mode
  const apiEndpoint = isEditMode ? `/api/locations/${location.id}` : '/api/locations'
  const method = isEditMode ? 'PATCH' : 'POST'
  const schema = isEditMode ? UpdateLocationSchema : CreateLocationSchema

  // Prepare initial values for edit mode
  const initialValues = isEditMode
    ? {
        location_name: location.location_name,
        company_id: location.company_id || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        zip: location.zip || '',
        country: location.country || '',
        location_type: location.location_type || '',
        timezone: location.timezone || '',
        contact_phone: location.contact_phone || '',
        access_instructions: location.access_instructions || '',
        notes: location.notes || '',
      }
    : {}

  return (
    <GenericForm
      title={isEditMode ? 'Edit Location' : 'Create New Location'}
      fields={fields}
      schema={schema}
      apiEndpoint={apiEndpoint}
      method={method}
      initialValues={initialValues}
      onSuccess={onSuccess}
      onCancel={onCancel}
      submitText={isEditMode ? 'Update Location' : 'Create Location'}
      showCancel={true}
    />
  )
}
