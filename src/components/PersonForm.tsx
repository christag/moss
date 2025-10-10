/**
 * PersonForm Component
 * Reusable form for creating and editing people
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { Person, PersonType, PersonStatus, Company, Location } from '@/types'

interface PersonFormProps {
  person?: Person
  onSuccess: (person: Person) => void
  onCancel: () => void
}

export function PersonForm({ person, onSuccess, onCancel }: PersonFormProps) {
  const isEditMode = !!person

  const [formData, setFormData] = useState({
    company_id: person?.company_id || '',
    location_id: person?.location_id || '',
    full_name: person?.full_name || '',
    email: person?.email || '',
    username: person?.username || '',
    employee_id: person?.employee_id || '',
    person_type: (person?.person_type || 'employee') as PersonType,
    department: person?.department || '',
    job_title: person?.job_title || '',
    phone: person?.phone || '',
    mobile: person?.mobile || '',
    start_date: person?.start_date ? new Date(person.start_date).toISOString().split('T')[0] : '',
    status: (person?.status || 'active') as PersonStatus,
    manager_id: person?.manager_id || '',
    preferred_contact_method: person?.preferred_contact_method || '',
    notes: person?.notes || '',
  })

  const [companies, setCompanies] = useState<Company[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [managers, setManagers] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch companies, locations, and managers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, locationsRes, managersRes] = await Promise.all([
          fetch('/api/companies?limit=200&sort_by=company_name&sort_order=asc'),
          fetch('/api/locations?limit=200&sort_by=location_name&sort_order=asc'),
          fetch('/api/people?limit=200&sort_by=full_name&sort_order=asc'),
        ])

        if (companiesRes.ok) {
          const result = await companiesRes.json()
          setCompanies(result.data?.companies || [])
        }

        if (locationsRes.ok) {
          const result = await locationsRes.json()
          setLocations(result.data?.locations || [])
        }

        if (managersRes.ok) {
          const result = await managersRes.json()
          // Filter out current person from managers list if editing
          const allPeople = result.data?.people || []
          setManagers(isEditMode ? allPeople.filter((p: Person) => p.id !== person?.id) : allPeople)
        }
      } catch (err) {
        console.error('Error fetching form data:', err)
      }
    }

    fetchData()
  }, [isEditMode, person?.id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Clean up empty strings to null for optional fields
      const payload = {
        ...formData,
        company_id: formData.company_id || undefined,
        location_id: formData.location_id || undefined,
        email: formData.email || undefined,
        username: formData.username || undefined,
        employee_id: formData.employee_id || undefined,
        department: formData.department || undefined,
        job_title: formData.job_title || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        start_date: formData.start_date || undefined,
        manager_id: formData.manager_id || undefined,
        preferred_contact_method: formData.preferred_contact_method || undefined,
        notes: formData.notes || undefined,
      }

      const url = isEditMode ? `/api/people/${person.id}` : '/api/people'
      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save person')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2>{isEditMode ? 'Edit Person' : 'Create New Person'}</h2>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#FD6A3D',
            color: 'var(--color-off-white)',
            borderRadius: '4px',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          {error}
        </div>
      )}

      {/* Basic Information */}
      <fieldset style={{ border: 'none', padding: 0, marginBottom: 'var(--spacing-lg)' }}>
        <legend style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Basic Information
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <label
              htmlFor="full_name"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Full Name <span style={{ color: 'var(--color-orange)' }}>*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="person_type"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Type <span style={{ color: 'var(--color-orange)' }}>*</span>
            </label>
            <select
              id="person_type"
              name="person_type"
              value={formData.person_type}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="vendor_contact">Vendor Contact</option>
              <option value="partner">Partner</option>
              <option value="customer">Customer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="employee_id"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Employee ID
            </label>
            <input
              type="text"
              id="employee_id"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="start_date"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
        </div>
      </fieldset>

      {/* Job Information */}
      <fieldset style={{ border: 'none', padding: 0, marginBottom: 'var(--spacing-lg)' }}>
        <legend style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Job Information
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <label
              htmlFor="department"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="job_title"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Job Title
            </label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="company_id"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Company
            </label>
            <select
              id="company_id"
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">None</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="location_id"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Location
            </label>
            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">None</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.location_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="manager_id"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Manager
            </label>
            <select
              id="manager_id"
              name="manager_id"
              value={formData.manager_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">None</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Contact Information */}
      <fieldset style={{ border: 'none', padding: 0, marginBottom: 'var(--spacing-lg)' }}>
        <legend style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Contact Information
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label htmlFor="phone" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label htmlFor="mobile" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
              Mobile
            </label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="preferred_contact_method"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
            >
              Preferred Contact Method
            </label>
            <select
              id="preferred_contact_method"
              name="preferred_contact_method"
              value={formData.preferred_contact_method}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">None</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset style={{ border: 'none', padding: 0, marginBottom: 'var(--spacing-lg)' }}>
        <legend style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Notes</legend>

        <div>
          <label htmlFor="notes" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
      </fieldset>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-black)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-blue)',
            color: 'var(--color-off-white)',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Person' : 'Create Person'}
        </button>
      </div>
    </form>
  )
}
