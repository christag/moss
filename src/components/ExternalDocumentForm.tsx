'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExternalDocument, ExternalDocumentType } from '@/types'

interface ExternalDocumentFormProps {
  initialData?: ExternalDocument
  isEdit?: boolean
}

export default function ExternalDocumentForm({
  initialData,
  isEdit = false,
}: ExternalDocumentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    document_type: initialData?.document_type || '',
    url: initialData?.url || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    created_date: initialData?.created_date
      ? new Date(initialData.created_date).toISOString().split('T')[0]
      : '',
    updated_date: initialData?.updated_date
      ? new Date(initialData.updated_date).toISOString().split('T')[0]
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/external-documents/${initialData?.id}` : '/api/external-documents'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values
      const payload: Record<string, string> = {
        title: formData.title,
      }

      // Add optional fields only if they have values
      if (formData.document_type) payload.document_type = formData.document_type
      if (formData.url) payload.url = formData.url
      if (formData.description) payload.description = formData.description
      if (formData.notes) payload.notes = formData.notes
      if (formData.created_date) payload.created_date = formData.created_date
      if (formData.updated_date) payload.updated_date = formData.updated_date

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to detail page after successful creation
        if (isEdit) {
          router.push(`/external-documents/${initialData?.id}`)
        } else {
          router.push(`/external-documents/${result.data.id}`)
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
      router.push(`/external-documents/${initialData.id}`)
    } else {
      router.push('/external-documents')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title (Required) */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title *
        </label>
        <input
          type="text"
          id="title"
          required
          maxLength={255}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Password Manager Login"
        />
      </div>

      {/* Document Type */}
      <div>
        <label htmlFor="document_type" className="block text-sm font-medium">
          Document Type
        </label>
        <select
          id="document_type"
          value={formData.document_type}
          onChange={(e) =>
            setFormData({ ...formData, document_type: e.target.value as ExternalDocumentType })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select type...</option>
          <option value="password_vault">Password Vault</option>
          <option value="ssl_certificate">SSL Certificate</option>
          <option value="domain_registrar">Domain Registrar</option>
          <option value="ticket">Ticket</option>
          <option value="runbook">Runbook</option>
          <option value="diagram">Diagram</option>
          <option value="wiki_page">Wiki Page</option>
          <option value="contract">Contract</option>
          <option value="invoice">Invoice</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium">
          URL
        </label>
        <input
          type="url"
          id="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="https://example.com/document"
        />
        <p className="mt-1 text-sm text-gray-500">External link to the document or resource</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Brief description of this external document..."
        />
      </div>

      {/* Created Date */}
      <div>
        <label htmlFor="created_date" className="block text-sm font-medium">
          Document Created Date
        </label>
        <input
          type="date"
          id="created_date"
          value={formData.created_date}
          onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-500">
          When the external document was originally created
        </p>
      </div>

      {/* Updated Date */}
      <div>
        <label htmlFor="updated_date" className="block text-sm font-medium">
          Document Updated Date
        </label>
        <input
          type="date"
          id="updated_date"
          value={formData.updated_date}
          onChange={(e) => setFormData({ ...formData, updated_date: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-500">When the external document was last updated</p>
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
          {loading ? 'Saving...' : isEdit ? 'Update External Document' : 'Create External Document'}
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
