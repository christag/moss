'use client'

import React from 'react'

/**
 * Props for PageHeader component
 */
export interface PageHeaderProps {
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

/**
 * Page Header Component
 * Blue section that contains page title, filters, and actions
 * Appears below the navigation bar
 */
export function PageHeader({ title, children, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-blue)', // Morning Blue
        color: 'var(--color-off-white)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="container">
        <div className="p-lg">
          {/* Title and Actions Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: children ? 'var(--spacing-lg)' : '0',
            }}
          >
            <h1
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: '700',
                color: 'var(--color-off-white)',
                margin: '0',
              }}
            >
              {title}
            </h1>
            {actions && <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>{actions}</div>}
          </div>

          {/* Filters and Additional Content */}
          {children && <div>{children}</div>}
        </div>
      </div>
    </div>
  )
}
