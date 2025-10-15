'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, IconName } from '@/components/ui'

/**
 * Admin Panel Layout
 * Provides consistent layout with sidebar navigation for all admin pages
 * Mobile-responsive with drawer navigation on small screens
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
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
              onClick={() => setMobileMenuOpen(false)}
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
                    fontSize: '0.875rem',
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
    </>
  )

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--color-off-white)',
        position: 'relative',
      }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle admin menu"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-morning-blue)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          zIndex: 1001,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-off-white)',
        }}
        className="mobile-admin-menu-button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          className="mobile-admin-drawer-overlay"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : '-100%',
          height: '100vh',
          width: '280px',
          maxWidth: '85vw',
          backgroundColor: 'var(--color-brew-black)',
          color: 'var(--color-off-white)',
          padding: 'var(--spacing-lg)',
          overflowY: 'auto',
          zIndex: 1001,
          transition: 'left 0.3s ease',
        }}
        className="mobile-admin-drawer"
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar Navigation */}
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
        className="desktop-admin-sidebar"
      >
        <SidebarContent />
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
