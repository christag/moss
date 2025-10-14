/**
 * LocationForm Component
 *
 * Specialized form for creating and editing locations using GenericForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/schemas/location'
import type { Location, LocationType, Company } from '@/types'

interface LocationFormProps {
  /** Edit mode: provide existing location data */
  location?: Location
  /** Callback after successful create/update */
  onSuccess?: (location: unknown) => void
  /** Callback on cancel */
  onCancel?: () => void
}

const LOCATION_TYPE_OPTIONS = [
  { value: 'office', label: 'Office' },
  { value: 'datacenter', label: 'Data Center' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'remote', label: 'Remote' },
  { value: 'other', label: 'Other' },
]

export function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const isEditMode = !!location
  const [companies, setCompanies] = useState<Company[]>([])

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies?sort_by=company_name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.companies) {
            setCompanies(result.data.companies)
          }
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
      name: 'location_name',
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
      name: 'location_type',
      label: 'Location Type',
      type: 'select',
      required: true,
      options: LOCATION_TYPE_OPTIONS,
      helpText: 'The type of location',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      placeholder: 'Street address',
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
      placeholder: 'ZIP or postal code',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Country',
    },
    {
      name: 'timezone',
      label: 'Timezone',
      type: 'text',
      placeholder: 'America/New_York',
      helpText: 'IANA timezone identifier (e.g., America/New_York, Europe/London)',
    },
    {
      name: 'contact_phone',
      label: 'Contact Phone',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      helpText: 'Main phone number for this location',
    },
    {
      name: 'access_instructions',
      label: 'Access Instructions',
      type: 'textarea',
      placeholder: 'Building access codes, parking instructions, etc.',
      rows: 3,
      helpText: 'Instructions for accessing this location',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes about this location...',
      rows: 4,
      helpText: 'Any additional information or notes',
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
        location_type: (location.location_type || null) as LocationType | null,
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
