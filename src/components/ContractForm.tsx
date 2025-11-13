'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Contract, ContractType, Company } from '@/types'

interface ContractFormProps {
  initialData?: Contract
  isEdit?: boolean
}

export default function ContractForm({ initialData, isEdit = false }: ContractFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    company_id: initialData?.company_id || '',
    contract_name: initialData?.contract_name || '',
    contract_number: initialData?.contract_number || '',
    contract_type: initialData?.contract_type || '',
    start_date: initialData?.start_date
      ? new Date(initialData.start_date).toISOString().split('T')[0]
      : '',
    end_date: initialData?.end_date
      ? new Date(initialData.end_date).toISOString().split('T')[0]
      : '',
    cost: initialData?.cost?.toString() || '',
    billing_frequency: initialData?.billing_frequency || '',
    auto_renew: initialData?.auto_renew || false,
    renewal_notice_days: initialData?.renewal_notice_days?.toString() || '',
    terms: initialData?.terms || '',
    notes: initialData?.notes || '',
  })

  useEffect(() => {
    // Fetch companies for dropdown
    fetch('/api/companies?sort_by=company_name&sort_order=asc')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.companies) {
          setCompanies(data.data.companies)
        }
      })
      .catch((err) => console.error('Error fetching companies:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/contracts/${initialData?.id}` : '/api/contracts'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values
      const payload: Record<string, string | number | boolean> = {
        contract_name: formData.contract_name,
      }

      // Add optional fields only if they have values
      if (formData.company_id) payload.company_id = formData.company_id
      if (formData.contract_number) payload.contract_number = formData.contract_number
      if (formData.contract_type) payload.contract_type = formData.contract_type
      if (formData.start_date) payload.start_date = formData.start_date
      if (formData.end_date) payload.end_date = formData.end_date
      if (formData.cost) payload.cost = parseFloat(formData.cost)
      if (formData.billing_frequency) payload.billing_frequency = formData.billing_frequency
      payload.auto_renew = formData.auto_renew
      if (formData.renewal_notice_days)
        payload.renewal_notice_days = parseInt(formData.renewal_notice_days)
      if (formData.terms) payload.terms = formData.terms
      if (formData.notes) payload.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to detail page after successful creation
        if (isEdit) {
          router.push(`/contracts/${initialData?.id}`)
        } else {
          router.push(`/contracts/${result.data.id}`)
        }
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('An error occurred while submitting the form')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (isEdit && initialData?.id) {
      router.push(`/contracts/${initialData.id}`)
    } else {
      router.push('/contracts')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contract Name (Required) */}
      <div>
        <label htmlFor="contract_name" className="block text-sm font-medium">
          Contract Name *
        </label>
        <input
          type="text"
          id="contract_name"
          required
          maxLength={255}
          value={formData.contract_name}
          onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Annual Support Agreement"
        />
      </div>

      {/* Company */}
      <div>
        <label htmlFor="company_id" className="block text-sm font-medium">
          Company
        </label>
        <select
          id="company_id"
          value={formData.company_id}
          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select company...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>

      {/* Contract Number */}
      <div>
        <label htmlFor="contract_number" className="block text-sm font-medium">
          Contract Number
        </label>
        <input
          type="text"
          id="contract_number"
          maxLength={100}
          value={formData.contract_number}
          onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="CTR-2024-001"
        />
      </div>

      {/* Contract Type */}
      <div>
        <label htmlFor="contract_type" className="block text-sm font-medium">
          Contract Type
        </label>
        <select
          id="contract_type"
          value={formData.contract_type}
          onChange={(e) =>
            setFormData({ ...formData, contract_type: e.target.value as ContractType })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select type...</option>
          <option value="support">Support</option>
          <option value="license">License</option>
          <option value="service">Service</option>
          <option value="lease">Lease</option>
          <option value="maintenance">Maintenance</option>
          <option value="consulting">Consulting</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="start_date" className="block text-sm font-medium">
          Start Date
        </label>
        <input
          type="date"
          id="start_date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="end_date" className="block text-sm font-medium">
          End Date
        </label>
        <input
          type="date"
          id="end_date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium">
          Cost
        </label>
        <input
          type="number"
          id="cost"
          min="0"
          step="0.01"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="0.00"
        />
        <p className="mt-1 text-sm text-gray-500">Total contract value</p>
      </div>

      {/* Billing Frequency */}
      <div>
        <label htmlFor="billing_frequency" className="block text-sm font-medium">
          Billing Frequency
        </label>
        <input
          type="text"
          id="billing_frequency"
          maxLength={50}
          value={formData.billing_frequency}
          onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Monthly, Quarterly, Annually"
        />
      </div>

      {/* Auto Renew */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="auto_renew"
          checked={formData.auto_renew}
          onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="auto_renew" className="ml-2 block text-sm font-medium">
          Auto Renew
        </label>
      </div>

      {/* Renewal Notice Days */}
      {formData.auto_renew && (
        <div>
          <label htmlFor="renewal_notice_days" className="block text-sm font-medium">
            Renewal Notice Days
          </label>
          <input
            type="number"
            id="renewal_notice_days"
            min="1"
            value={formData.renewal_notice_days}
            onChange={(e) => setFormData({ ...formData, renewal_notice_days: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="30"
          />
          <p className="mt-1 text-sm text-gray-500">Days before end date to send renewal notice</p>
        </div>
      )}

      {/* Terms */}
      <div>
        <label htmlFor="terms" className="block text-sm font-medium">
          Terms
        </label>
        <textarea
          id="terms"
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Contract terms and conditions..."
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Additional notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400"
          style={{ height: '44px' }}
        >
          {loading ? 'Saving...' : isEdit ? 'Update Contract' : 'Create Contract'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50"
          style={{ height: '44px' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
