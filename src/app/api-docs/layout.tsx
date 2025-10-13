/**
 * API Documentation Layout
 * Shared layout with sidebar navigation for all API doc pages
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { API_RESOURCES } from '@/lib/apiDocs'

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (slug: string) => {
    if (slug === 'overview') return pathname === '/api-docs'
    return pathname.includes(`/api-docs/${slug}`)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-off-white)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-off-white)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          transition: 'width 0.3s ease',
          flexShrink: 0,
        }}
        className="hide-scrollbar"
      >
        {sidebarOpen && (
          <nav style={{ padding: 'var(--spacing-lg)' }}>
            {/* Logo/Title */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-blue)',
                  margin: 0,
                }}
              >
                M.O.S.S. API
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-brew-black-60)',
                  margin: 'var(--spacing-xs) 0 0 0',
                }}
              >
                Documentation
              </p>
            </div>

            {/* Overview Link */}
            <Link
              href="/api-docs"
              style={{
                display: 'block',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                marginBottom: 'var(--spacing-sm)',
                borderRadius: '4px',
                textDecoration: 'none',
                color: isActive('overview') ? 'var(--color-off-white)' : 'rgba(250, 249, 245, 0.7)',
                backgroundColor: isActive('overview') ? 'var(--color-blue)' : 'transparent',
                fontWeight: isActive('overview')
                  ? 'var(--font-weight-semibold)'
                  : 'var(--font-weight-normal)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive('overview')) {
                  e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('overview')) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              📖 Overview
            </Link>

            {/* Resources Section */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'rgba(250, 249, 245, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                Resources
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {API_RESOURCES.map((resource) => (
                  <li key={resource.slug} style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <Link
                      href={`/api-docs/${resource.slug}`}
                      style={{
                        display: 'block',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        color: isActive(resource.slug)
                          ? 'var(--color-off-white)'
                          : 'rgba(250, 249, 245, 0.7)',
                        backgroundColor: isActive(resource.slug)
                          ? 'var(--color-blue)'
                          : 'transparent',
                        fontWeight: isActive(resource.slug)
                          ? 'var(--font-weight-semibold)'
                          : 'var(--font-weight-normal)',
                        fontSize: 'var(--font-size-sm)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(resource.slug)) {
                          e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(resource.slug)) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {resource.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Links */}
            <div
              style={{
                marginTop: 'var(--spacing-2xl)',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid rgba(250, 249, 245, 0.1)',
              }}
            >
              <Link
                href="/"
                style={{
                  display: 'block',
                  padding: 'var(--spacing-sm)',
                  textDecoration: 'none',
                  color: 'rgba(250, 249, 245, 0.7)',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-off-white)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(250, 249, 245, 0.7)'
                }}
              >
                ← Back to M.O.S.S.
              </Link>
            </div>
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <main
        style={{ flex: 1, padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* Toggle Sidebar Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-lg)',
            left: 'var(--spacing-lg)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-blue)',
            color: 'var(--color-off-white)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: 'var(--font-size-sm)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? '◀ Hide' : '☰ Menu'}
        </button>

        {children}
      </main>

      {/* Add noindex meta tag to prevent search engine indexing */}
      <meta name="robots" content="noindex, nofollow" />
    </div>
  )
}
