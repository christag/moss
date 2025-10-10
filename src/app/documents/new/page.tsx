import DocumentForm from '@/components/DocumentForm'

export default function NewDocumentPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Create New Document</h1>
      <div className="rounded-md border border-gray-200 bg-white p-6">
        <DocumentForm />
      </div>
    </div>
  )
}
