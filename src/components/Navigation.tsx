'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Top Navigation Bar Component
 * Displays logo, navigation items, and user menu
 */
export function Navigation() {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Companies', href: '/companies' },
    { label: 'Locations', href: '/locations' },
    { label: 'Rooms', href: '/rooms' },
    { label: 'People', href: '/people' },
    { label: 'Devices', href: '/devices' },
    { label: 'Networks', href: '/networks' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--color-off-white)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            paddingLeft: 'var(--spacing-md)',
            paddingRight: 'var(--spacing-md)',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'var(--color-black)',
              fontWeight: '700',
              fontSize: '1.5rem',
            }}
          >
            {/* Placeholder for logo - user can add their own PNG */}
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--color-blue)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-off-white)',
                fontWeight: 'bold',
                marginRight: 'var(--spacing-sm)',
              }}
            >
              M
            </div>
            <span>M.O.S.S.</span>
          </Link>

          {/* Navigation Items */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              flex: 1,
              justifyContent: 'flex-end',
              marginRight: 'var(--spacing-xl)',
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--color-blue)' : 'var(--color-black)',
                  fontWeight: isActive(item.href) ? '600' : '400',
                  fontSize: 'var(--font-size-base)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blue)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-off-white)',
                fontWeight: '600',
                fontSize: '1rem',
              }}
              aria-label="User menu"
            >
              U
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  backgroundColor: 'var(--color-off-white)',
                  border: '1px solid #E5E5E5',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  zIndex: 1001,
                }}
              >
                <div
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
                    Admin User
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-black)',
                      opacity: 0.6,
                    }}
                  >
                    admin@moss.local
                  </div>
                </div>

                <Link
                  href="/profile"
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    textDecoration: 'none',
                    color: 'var(--color-black)',
                    fontSize: 'var(--font-size-base)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  User Preferences
                </Link>

                <Link
                  href="/admin"
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    textDecoration: 'none',
                    color: 'var(--color-black)',
                    fontSize: 'var(--font-size-base)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  Admin Settings
                </Link>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--color-orange)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onClick={() => {
                      // TODO: Implement logout
                      alert('Logout functionality will be implemented with authentication')
                      setUserMenuOpen(false)
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
