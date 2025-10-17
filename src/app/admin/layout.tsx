/**
 * Admin Panel Layout
 * Simple layout wrapper for admin pages
 * Navigation is handled by the main Navigation component dropdown
 */

import React from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--spacing-xl)',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      {children}
    </main>
  )
}
