'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, IconName } from '@/components/ui'

/**
 * Admin Panel Layout
 * Provides consistent layout with sidebar navigation for all admin pages
 */

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: IconName
  description: string
  requiresSuperAdmin?: boolean
}

const adminNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/admin',
    icon: 'table_chart',
    description: 'Admin dashboard',
  },
  {
    label: 'Branding',
    href: '/admin/branding',
    icon: 'palette_paint_creative',
    description: 'Site appearance & logo',
  },
  {
    label: 'Storage',
    href: '/admin/storage',
    icon: 'shopping-bag-purse',
    description: 'File storage configuration',
  },
  {
    label: 'Authentication',
    href: '/admin/authentication',
    icon: 'key',
    description: 'Auth settings & SSO',
    requiresSuperAdmin: true,
  },
  {
    label: 'Integrations',
    href: '/admin/integrations',
    icon: 'target_bullseye',
    description: 'External system connections',
  },
  {
    label: 'Fields',
    href: '/admin/fields',
    icon: 'folder_drawer_category',
    description: 'Custom fields & dropdowns',
  },
  {
    label: 'RBAC',
    href: '/admin/rbac',
    icon: 'people-group',
    description: 'Roles & permissions',
    requiresSuperAdmin: true,
  },
  {
    label: 'Import/Export',
    href: '/admin/import-export',
    icon: 'folder_drawer_category',
    description: 'CSV data management',
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: 'bookmark',
    description: 'Admin action history',
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: 'envelope-closed-email',
    description: 'Email & alerts',
  },
  {
    label: 'Backup',
    href: '/admin/backup',
    icon: 'circle-check',
    description: 'Backup & restore',
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)', // Account for main nav height
        backgroundColor: 'var(--color-off-white)',
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '280px',
          backgroundColor: 'var(--color-brew-black)',
          color: 'var(--color-off-white)',
          padding: 'var(--spacing-lg)',
          borderRight: '1px solid var(--color-border)',
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
      >
        {/* Admin Panel Header */}
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            paddingBottom: 'var(--spacing-md)',
            borderBottom: '1px solid rgba(250, 249, 245, 0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--color-morning-blue)',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Admin Panel
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgba(250, 249, 245, 0.7)',
            }}
          >
            System Configuration
          </p>
        </div>

        {/* Navigation Items */}
        <nav>
          {adminNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  marginBottom: 'var(--spacing-xs)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: active ? 'var(--color-brew-black)' : 'var(--color-off-white)',
                  backgroundColor: active ? 'var(--color-morning-blue)' : 'transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon name={item.icon} size={20} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: active ? '600' : '500',
                    }}
                  >
                    {item.label}
                    {item.requiresSuperAdmin && (
                      <span
                        style={{
                          marginLeft: 'var(--spacing-xs)',
                          fontSize: '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      opacity: active ? 0.9 : 0.6,
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer Note */}
        <div
          style={{
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid rgba(250, 249, 245, 0.2)',
            fontSize: '0.75rem',
            color: 'rgba(250, 249, 245, 0.5)',
          }}
        >
          <p>* Requires Super Admin role</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: 'var(--spacing-xl)',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  )
}
