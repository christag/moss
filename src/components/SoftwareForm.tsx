/**
 * Software Form Component
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { Software, Company, SoftwareCategory } from '@/types'

interface SoftwareFormProps {
  software?: Software
  onSuccess: (software: Software) => void
  onCancel: () => void
}

export function SoftwareForm({ software, onSuccess, onCancel }: SoftwareFormProps) {
  const isEdit = !!software

  const [formData, setFormData] = useState({
    company_id: software?.company_id || '',
    product_name: software?.product_name || '',
    description: software?.description || '',
    website: software?.website || '',
    software_category: (software?.software_category || '') as SoftwareCategory | '',
    notes: software?.notes || '',
  })

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/companies?sort_by=company_name&sort_order=asc')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data?.companies) {
          setCompanies(result.data.companies)
        }
      })
      .catch(() => setCompanies([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/software/${software.id}` : '/api/software'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values (omit null/empty)
      const requestBody: Record<string, string> = {
        product_name: formData.product_name,
      }

      // Add optional fields only if they have values
      if (formData.company_id) requestBody.company_id = formData.company_id
      if (formData.description) requestBody.description = formData.description
      if (formData.website) requestBody.website = formData.website
      if (formData.software_category) requestBody.software_category = formData.software_category
      if (formData.notes) requestBody.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save software')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="error-message">{error}</div>}

      <div className="grid grid-2 gap-4">
        {/* Product Name */}
        <div>
          <label htmlFor="product_name" className="block mb-2 font-bold">
            Product Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="product_name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
            className="w-full p-2 border rounded"
            placeholder="Microsoft Office 365"
          />
        </div>

        {/* Software Category */}
        <div>
          <label htmlFor="software_category" className="block mb-2 font-bold">
            Category
          </label>
          <select
            id="software_category"
            value={formData.software_category}
            onChange={(e) =>
              setFormData({ ...formData, software_category: e.target.value as SoftwareCategory })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">Select Category</option>
            <option value="productivity">Productivity</option>
            <option value="security">Security</option>
            <option value="development">Development</option>
            <option value="communication">Communication</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="collaboration">Collaboration</option>
            <option value="broadcast">Broadcast</option>
            <option value="media">Media</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Vendor Company */}
        <div>
          <label htmlFor="company_id" className="block mb-2 font-bold">
            Vendor/Company
          </label>
          <select
            id="company_id"
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Company</option>
            {companies &&
              companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
          </select>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block mb-2 font-bold">
            Website
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block mb-2 font-bold">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block mb-2 font-bold">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Software' : 'Create Software'}
        </button>
      </div>
    </form>
  )
}
