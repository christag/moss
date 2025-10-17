/**
 * Software License Form Component
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { SoftwareLicense, Software, Company, LicenseType } from '@/types'

interface SoftwareLicenseFormProps {
  /** Edit mode: provide existing license data */
  license?: SoftwareLicense
  /** Initial values for create mode (e.g., from query params) */
  initialValues?: Record<string, unknown>
  /** Callback after successful create/update */
  onSuccess: (license: SoftwareLicense) => void
  /** Callback on cancel */
  onCancel: () => void
}

export function SoftwareLicenseForm({
  license,
  initialValues: passedInitialValues,
  onSuccess,
  onCancel,
}: SoftwareLicenseFormProps) {
  const isEdit = !!license

  // Prepare initial form data: merge passed values with existing license data
  const initialFormData = isEdit
    ? {
        software_id: license.software_id || '',
        purchased_from_id: license.purchased_from_id || '',
        license_key: license.license_key || '',
        license_type: (license.license_type || '') as LicenseType | '',
        purchase_date: license.purchase_date
          ? new Date(license.purchase_date).toISOString().split('T')[0]
          : '',
        expiration_date: license.expiration_date
          ? new Date(license.expiration_date).toISOString().split('T')[0]
          : '',
        seat_count: license.seat_count?.toString() || '',
        seats_used: license.seats_used?.toString() || '',
        cost: license.cost?.toString() || '',
        renewal_date: license.renewal_date
          ? new Date(license.renewal_date).toISOString().split('T')[0]
          : '',
        auto_renew: license.auto_renew ?? false,
        notes: license.notes || '',
      }
    : {
        software_id: (passedInitialValues?.software_id as string) || '',
        purchased_from_id: (passedInitialValues?.purchased_from_id as string) || '',
        license_key: (passedInitialValues?.license_key as string) || '',
        license_type: (passedInitialValues?.license_type as LicenseType) || '',
        purchase_date: (passedInitialValues?.purchase_date as string) || '',
        expiration_date: (passedInitialValues?.expiration_date as string) || '',
        seat_count: (passedInitialValues?.seat_count as string) || '',
        seats_used: (passedInitialValues?.seats_used as string) || '',
        cost: (passedInitialValues?.cost as string) || '',
        renewal_date: (passedInitialValues?.renewal_date as string) || '',
        auto_renew: (passedInitialValues?.auto_renew as boolean) ?? false,
        notes: (passedInitialValues?.notes as string) || '',
      }

  const [formData, setFormData] = useState(initialFormData)

  const [software, setSoftware] = useState<Software[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch dropdowns
    Promise.all([
      fetch('/api/software?sort_by=product_name&sort_order=asc').then((r) => r.json()),
      fetch('/api/companies?sort_by=company_name&sort_order=asc').then((r) => r.json()),
    ]).then(([swRes, compRes]) => {
      if (swRes.success && Array.isArray(swRes.data)) setSoftware(swRes.data)
      if (compRes.success && compRes.data?.companies) setCompanies(compRes.data.companies)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/software-licenses/${license.id}` : '/api/software-licenses'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values (omit null/empty)
      const requestBody: Record<string, string | number | boolean> = {
        auto_renew: formData.auto_renew,
      }

      // Add optional fields only if they have values
      if (formData.software_id) requestBody.software_id = formData.software_id
      if (formData.purchased_from_id) requestBody.purchased_from_id = formData.purchased_from_id
      if (formData.license_key) requestBody.license_key = formData.license_key
      if (formData.license_type) requestBody.license_type = formData.license_type
      if (formData.purchase_date) requestBody.purchase_date = formData.purchase_date
      if (formData.expiration_date) requestBody.expiration_date = formData.expiration_date
      if (formData.seat_count) requestBody.seat_count = parseInt(formData.seat_count)
      if (formData.seats_used) requestBody.seats_used = parseInt(formData.seats_used)
      if (formData.cost) requestBody.cost = parseFloat(formData.cost)
      if (formData.renewal_date) requestBody.renewal_date = formData.renewal_date
      if (formData.notes) requestBody.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save software license')
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
        {/* Software */}
        <div>
          <label htmlFor="software_id" className="block mb-2 font-bold">
            Software Product
          </label>
          <select
            id="software_id"
            value={formData.software_id}
            onChange={(e) => setFormData({ ...formData, software_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Software</option>
            {software &&
              software.map((sw) => (
                <option key={sw.id} value={sw.id}>
                  {sw.product_name}
                </option>
              ))}
          </select>
        </div>

        {/* Purchased From */}
        <div>
          <label htmlFor="purchased_from_id" className="block mb-2 font-bold">
            Purchased From
          </label>
          <select
            id="purchased_from_id"
            value={formData.purchased_from_id}
            onChange={(e) => setFormData({ ...formData, purchased_from_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Vendor</option>
            {companies &&
              companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
          </select>
        </div>

        {/* License Type */}
        <div>
          <label htmlFor="license_type" className="block mb-2 font-bold">
            License Type
          </label>
          <select
            id="license_type"
            value={formData.license_type}
            onChange={(e) =>
              setFormData({ ...formData, license_type: e.target.value as LicenseType })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">Select Type</option>
            <option value="perpetual">Perpetual</option>
            <option value="subscription">Subscription</option>
            <option value="free">Free</option>
            <option value="volume">Volume</option>
            <option value="site">Site</option>
            <option value="concurrent">Concurrent</option>
          </select>
        </div>

        {/* Purchase Date */}
        <div>
          <label htmlFor="purchase_date" className="block mb-2 font-bold">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchase_date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Expiration Date */}
        <div>
          <label htmlFor="expiration_date" className="block mb-2 font-bold">
            Expiration Date
          </label>
          <input
            type="date"
            id="expiration_date"
            value={formData.expiration_date}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Renewal Date */}
        <div>
          <label htmlFor="renewal_date" className="block mb-2 font-bold">
            Renewal Date
          </label>
          <input
            type="date"
            id="renewal_date"
            value={formData.renewal_date}
            onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Seat Count */}
        <div>
          <label htmlFor="seat_count" className="block mb-2 font-bold">
            Seat Count
          </label>
          <input
            type="number"
            id="seat_count"
            value={formData.seat_count}
            onChange={(e) => setFormData({ ...formData, seat_count: e.target.value })}
            className="w-full p-2 border rounded"
            min="0"
          />
        </div>

        {/* Seats Used */}
        <div>
          <label htmlFor="seats_used" className="block mb-2 font-bold">
            Seats Used
          </label>
          <input
            type="number"
            id="seats_used"
            value={formData.seats_used}
            onChange={(e) => setFormData({ ...formData, seats_used: e.target.value })}
            className="w-full p-2 border rounded"
            min="0"
          />
        </div>

        {/* Cost */}
        <div>
          <label htmlFor="cost" className="block mb-2 font-bold">
            Cost
          </label>
          <input
            type="number"
            id="cost"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            className="w-full p-2 border rounded"
            step="0.01"
            min="0"
          />
        </div>

        {/* Auto Renew */}
        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.auto_renew}
              onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
            />
            <span className="font-bold">Auto Renew</span>
          </label>
        </div>
      </div>

      {/* License Key */}
      <div>
        <label htmlFor="license_key" className="block mb-2 font-bold">
          License Key
        </label>
        <textarea
          id="license_key"
          value={formData.license_key}
          onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
          rows={2}
          className="w-full p-2 border rounded font-mono text-sm"
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
          {loading ? 'Saving...' : isEdit ? 'Update License' : 'Create License'}
        </button>
      </div>
    </form>
  )
}
