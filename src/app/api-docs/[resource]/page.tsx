/**
 * API Documentation - Dynamic Resource Page
 * Displays detailed documentation for a specific API resource
 */
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getResourceBySlug, getAllResourceSlugs } from '@/lib/apiDocs'
import { CollapsibleEndpoint } from '@/components/CollapsibleEndpoint'

interface PageProps {
  params: Promise<{ resource: string }>
}

export async function generateStaticParams() {
  const slugs = getAllResourceSlugs()
  return slugs.map((slug) => ({
    resource: slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { resource } = await params
  const resourceData = getResourceBySlug(resource)

  if (!resourceData) {
    return {
      title: 'Resource Not Found',
    }
  }

  return {
    title: `${resourceData.name} API - M.O.S.S. Documentation`,
    description: resourceData.description,
    robots: 'noindex, nofollow',
  }
}

export default async function ResourcePage({ params }: PageProps) {
  const { resource } = await params
  const resourceData = getResourceBySlug(resource)

  if (!resourceData) {
    notFound()
  }

  return (
    <div>
      {/* Header */}
      <header style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-black)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          {resourceData.name} API
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-brew-black-60)',
            maxWidth: '800px',
          }}
        >
          {resourceData.description}
        </p>
      </header>

      {/* Endpoints */}
      {resourceData.endpoints.length > 0 ? (
        <>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-black)',
            }}
          >
            Endpoints
          </h2>
          {resourceData.endpoints.map((endpoint, index) => (
            <CollapsibleEndpoint
              key={`${endpoint.method}-${endpoint.path}-${index}`}
              endpoint={endpoint}
              defaultExpanded={index === 0}
            />
          ))}
        </>
      ) : (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-2xl)',
            textAlign: 'center',
            backgroundColor: 'rgba(172, 215, 255, 0.1)',
            border: '1px solid var(--color-light-blue)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-brew-black-60)',
              margin: 0,
            }}
          >
            📝 Documentation for this resource is coming soon.
          </p>
        </div>
      )}
    </div>
  )
}
