'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Document, Person } from '@/types'

interface DocumentFormProps {
  initialData?: Document
  isEdit?: boolean
}

export default function DocumentForm({ initialData, isEdit = false }: DocumentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [formData, setFormData] = useState({
    author_id: initialData?.author_id || '',
    title: initialData?.title || '',
    document_type: initialData?.document_type || '',
    content: initialData?.content || '',
    version: initialData?.version || '',
    status: initialData?.status || 'draft',
    created_date: initialData?.created_date
      ? new Date(initialData.created_date).toISOString().split('T')[0]
      : '',
    updated_date: initialData?.updated_date
      ? new Date(initialData.updated_date).toISOString().split('T')[0]
      : '',
    notes: initialData?.notes || '',
  })

  useEffect(() => {
    // Fetch people for author dropdown
    fetch('/api/people?sort_by=last_name&sort_order=asc')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.people) {
          setPeople(data.data.people)
        }
      })
      .catch((err) => console.error('Error fetching people:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/documents/${initialData?.id}` : '/api/documents'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values (omit null/empty)
      const payload: Record<string, string> = {
        title: formData.title,
        status: formData.status,
      }

      // Add optional fields only if they have values
      if (formData.author_id) payload.author_id = formData.author_id
      if (formData.document_type) payload.document_type = formData.document_type
      if (formData.content) payload.content = formData.content
      if (formData.version) payload.version = formData.version
      if (formData.created_date) payload.created_date = formData.created_date
      if (formData.updated_date) payload.updated_date = formData.updated_date
      if (formData.notes) payload.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/documents')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />
      </div>

      <div>
        <label htmlFor="author_id" className="block text-sm font-medium">
          Author
        </label>
        <select
          id="author_id"
          value={formData.author_id}
          onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">-- Select Author --</option>
          {Array.isArray(people) &&
            people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label htmlFor="document_type" className="block text-sm font-medium">
          Document Type
        </label>
        <select
          id="document_type"
          value={formData.document_type}
          onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">-- Select Type --</option>
          <option value="policy">Policy</option>
          <option value="procedure">Procedure</option>
          <option value="diagram">Diagram</option>
          <option value="runbook">Runbook</option>
          <option value="architecture">Architecture</option>
          <option value="sop">SOP</option>
          <option value="network_diagram">Network Diagram</option>
          <option value="rack_diagram">Rack Diagram</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium">
          Content
        </label>
        <textarea
          id="content"
          rows={12}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
          placeholder="Document content (supports Markdown)"
        />
      </div>

      <div>
        <label htmlFor="version" className="block text-sm font-medium">
          Version
        </label>
        <input
          type="text"
          id="version"
          maxLength={50}
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g., 1.0, v2.1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="created_date" className="block text-sm font-medium">
            Created Date
          </label>
          <input
            type="date"
            id="created_date"
            value={formData.created_date}
            onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="updated_date" className="block text-sm font-medium">
            Updated Date
          </label>
          <input
            type="date"
            id="updated_date"
            value={formData.updated_date}
            onChange={(e) => setFormData({ ...formData, updated_date: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Document' : 'Create Document'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/documents')}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
