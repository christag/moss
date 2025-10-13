import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocumentForm from '@/components/DocumentForm'
import type { Document } from '@/types'

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let document: Document | null = null

  try {
    const response = await fetch(`http://localhost:3001/api/documents/${id}`, {
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

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/documents" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Documents
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <Link
            href={`/documents/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {document.title}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <h1 className="mb-6 text-3xl font-bold">Edit Document</h1>
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <DocumentForm initialData={document} isEdit />
        </div>
      </div>
    </div>
  )
}
