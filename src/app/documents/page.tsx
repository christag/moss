import Link from 'next/link'
import type { Document } from '@/types'

export default async function DocumentsPage() {
  let documents: Document[] = []

  try {
    const response = await fetch('http://localhost:3000/api/documents', {
      cache: 'no-store',
    })
    const data = await response.json()
    if (data.success && Array.isArray(data.data)) {
      documents = data.data
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-orange-100 text-orange-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-200 text-gray-800'
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      policy: 'bg-blue-100 text-blue-800',
      procedure: 'bg-purple-100 text-purple-800',
      diagram: 'bg-indigo-100 text-indigo-800',
      runbook: 'bg-teal-100 text-teal-800',
      architecture: 'bg-cyan-100 text-cyan-800',
      sop: 'bg-violet-100 text-violet-800',
      network_diagram: 'bg-sky-100 text-sky-800',
      rack_diagram: 'bg-slate-100 text-slate-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Link
          href="/documents/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No documents found. Create your first document to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/documents/${doc.id}`} className="text-blue-600 hover:underline">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {doc.document_type ? (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getTypeBadge(doc.document_type)}`}
                      >
                        {doc.document_type.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {doc.version || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/documents/${doc.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
