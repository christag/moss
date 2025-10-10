/**
 * SaaS Service Form Component
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { SaaSService, Software, SaaSEnvironment, SaaSStatus, SaaSCriticality } from '@/types'

interface SaaSServiceFormProps {
  service?: SaaSService
  onSuccess: (service: SaaSService) => void
  onCancel: () => void
}

export function SaaSServiceForm({ service, onSuccess, onCancel }: SaaSServiceFormProps) {
  const isEdit = !!service

  const [formData, setFormData] = useState({
    software_id: service?.software_id || '',
    company_id: service?.company_id || '',
    business_owner_id: service?.business_owner_id || '',
    technical_contact_id: service?.technical_contact_id || '',
    service_name: service?.service_name || '',
    service_url: service?.service_url || '',
    account_id: service?.account_id || '',
    environment: (service?.environment || 'production') as SaaSEnvironment,
    status: (service?.status || 'active') as SaaSStatus,
    subscription_start: service?.subscription_start
      ? new Date(service.subscription_start).toISOString().split('T')[0]
      : '',
    subscription_end: service?.subscription_end
      ? new Date(service.subscription_end).toISOString().split('T')[0]
      : '',
    seat_count: service?.seat_count?.toString() || '',
    cost: service?.cost?.toString() || '',
    billing_frequency: service?.billing_frequency || '',
    criticality: (service?.criticality || '') as SaaSCriticality | '',
    sso_provider: service?.sso_provider || '',
    sso_protocol: service?.sso_protocol || '',
    scim_enabled: service?.scim_enabled ?? false,
    provisioning_type: service?.provisioning_type || '',
    api_access_enabled: service?.api_access_enabled ?? false,
    api_documentation_url: service?.api_documentation_url || '',
    notes: service?.notes || '',
  })

  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch dropdowns
    Promise.all([
      fetch('/api/software?limit=100&sort_by=product_name&sort_order=asc').then((r) => r.json()),
    ]).then(([swRes]) => {
      if (swRes.success && Array.isArray(swRes.data)) setSoftware(swRes.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/saas-services/${service.id}` : '/api/saas-services'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values (omit null/empty)
      const requestBody: Record<string, string | number | boolean> = {
        service_name: formData.service_name,
        environment: formData.environment,
        status: formData.status,
        scim_enabled: formData.scim_enabled,
        api_access_enabled: formData.api_access_enabled,
      }

      // Add optional fields only if they have values
      if (formData.software_id) requestBody.software_id = formData.software_id
      if (formData.company_id) requestBody.company_id = formData.company_id
      if (formData.business_owner_id) requestBody.business_owner_id = formData.business_owner_id
      if (formData.technical_contact_id)
        requestBody.technical_contact_id = formData.technical_contact_id
      if (formData.service_url) requestBody.service_url = formData.service_url
      if (formData.account_id) requestBody.account_id = formData.account_id
      if (formData.subscription_start) requestBody.subscription_start = formData.subscription_start
      if (formData.subscription_end) requestBody.subscription_end = formData.subscription_end
      if (formData.seat_count) requestBody.seat_count = parseInt(formData.seat_count)
      if (formData.cost) requestBody.cost = parseFloat(formData.cost)
      if (formData.billing_frequency) requestBody.billing_frequency = formData.billing_frequency
      if (formData.criticality) requestBody.criticality = formData.criticality
      if (formData.sso_provider) requestBody.sso_provider = formData.sso_provider
      if (formData.sso_protocol) requestBody.sso_protocol = formData.sso_protocol
      if (formData.provisioning_type) requestBody.provisioning_type = formData.provisioning_type
      if (formData.api_documentation_url)
        requestBody.api_documentation_url = formData.api_documentation_url
      if (formData.notes) requestBody.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save SaaS service')
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
        {/* Service Name */}
        <div>
          <label htmlFor="service_name" className="block mb-2 font-bold">
            Service Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="service_name"
            value={formData.service_name}
            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Software */}
        <div>
          <label htmlFor="software_id" className="block mb-2 font-bold">
            Software
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

        {/* Environment */}
        <div>
          <label htmlFor="environment" className="block mb-2 font-bold">
            Environment
          </label>
          <select
            id="environment"
            value={formData.environment}
            onChange={(e) =>
              setFormData({ ...formData, environment: e.target.value as SaaSEnvironment })
            }
            className="w-full p-2 border rounded"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="dev">Development</option>
            <option value="sandbox">Sandbox</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block mb-2 font-bold">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as SaaSStatus })}
            className="w-full p-2 border rounded"
          >
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Criticality */}
        <div>
          <label htmlFor="criticality" className="block mb-2 font-bold">
            Criticality
          </label>
          <select
            id="criticality"
            value={formData.criticality}
            onChange={(e) =>
              setFormData({ ...formData, criticality: e.target.value as SaaSCriticality })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">Select Criticality</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Service URL */}
        <div>
          <label htmlFor="service_url" className="block mb-2 font-bold">
            Service URL
          </label>
          <input
            type="url"
            id="service_url"
            value={formData.service_url}
            onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Subscription Start */}
        <div>
          <label htmlFor="subscription_start" className="block mb-2 font-bold">
            Subscription Start
          </label>
          <input
            type="date"
            id="subscription_start"
            value={formData.subscription_start}
            onChange={(e) => setFormData({ ...formData, subscription_start: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Subscription End */}
        <div>
          <label htmlFor="subscription_end" className="block mb-2 font-bold">
            Subscription End
          </label>
          <input
            type="date"
            id="subscription_end"
            value={formData.subscription_end}
            onChange={(e) => setFormData({ ...formData, subscription_end: e.target.value })}
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

        {/* SSO Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.scim_enabled}
              onChange={(e) => setFormData({ ...formData, scim_enabled: e.target.checked })}
            />
            <span>SCIM Enabled</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.api_access_enabled}
              onChange={(e) => setFormData({ ...formData, api_access_enabled: e.target.checked })}
            />
            <span>API Access</span>
          </label>
        </div>
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
          {loading ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
        </button>
      </div>
    </form>
  )
}
