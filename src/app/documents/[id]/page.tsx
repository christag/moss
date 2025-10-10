import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Document } from '@/types'

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let document: Document | null = null

  try {
    const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
      cache: 'no-store',
    })
    const data = await response.json()
    if (data.success) {
      document = data.data
    }
  } catch (error) {
    console.error('Error fetching document:', error)
  }

  if (!document) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-orange-100 text-orange-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-200 text-gray-800'
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/documents" className="text-sm text-gray-500 hover:underline">
              Documents
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-sm text-gray-700">{document.title}</span>
          </div>
          <h1 className="text-3xl font-bold">{document.title}</h1>
        </div>
        <Link
          href={`/documents/${document.id}/edit`}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Edit Document
        </Link>
      </div>

      <div className="space-y-6">
        {/* Status and Type */}
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Overview</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(document.status)}`}
              >
                {document.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Document Type</p>
              <p className="mt-1">
                {document.document_type ? document.document_type.replace(/_/g, ' ') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Version</p>
              <p className="mt-1">{document.version || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Author ID</p>
              <p className="mt-1">{document.author_id || '-'}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Dates</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p className="mt-1">
                {document.created_date ? new Date(document.created_date).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Updated Date</p>
              <p className="mt-1">
                {document.updated_date ? new Date(document.updated_date).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="mt-1">{new Date(document.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="mt-1">{new Date(document.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {document.content && (
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Content</h2>
            <pre className="whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm">
              {document.content}
            </pre>
          </div>
        )}

        {/* Notes */}
        {document.notes && (
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Notes</h2>
            <p className="text-gray-700">{document.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
