'use client'

import Link from 'next/link'
import DocumentForm from '@/components/DocumentForm'

export default function NewDocumentPage() {
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
          <span>New</span>
        </nav>

        <h1 className="mb-6 text-3xl font-bold">Create New Document</h1>
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <DocumentForm />
        </div>
      </div>
    </div>
  )
}
