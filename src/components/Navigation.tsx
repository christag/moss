'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { NavDropdown, NavDropdownItem } from './NavDropdown'
import GlobalSearch from './GlobalSearch'

/**
 * Top Navigation Bar Component
 * Displays logo, navigation items (with dropdowns), and user menu
 */
export function Navigation() {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-mobile-menu-button]')
      ) {
        setMobileMenuOpen(false)
      }
    }

    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen, mobileMenuOpen])

  // Standalone nav items (no dropdown)
  const standaloneNavItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'People', href: '/people' },
    { label: 'Import', href: '/import' }, // CSV bulk import
    { label: 'Admin', href: '/admin' }, // Admin panel (visible to all, protected by middleware)
  ]

  // Dropdown menu items grouped by category
  const placesItems: NavDropdownItem[] = [
    { label: 'Companies', href: '/companies', description: 'Vendors & manufacturers' },
    { label: 'Locations', href: '/locations', description: 'Buildings & sites' },
    { label: 'Rooms', href: '/rooms', description: 'Spaces & areas' },
  ]

  const assetsItems: NavDropdownItem[] = [
    { label: 'Devices', href: '/devices', description: 'Hardware & equipment' },
    { label: 'Groups', href: '/groups', description: 'Device & user groups' },
  ]

  const itServicesItems: NavDropdownItem[] = [
    { label: 'Networks', href: '/networks', description: 'VLANs & subnets' },
    { label: 'IOs', href: '/ios', description: 'Interfaces & ports' },
    { label: 'IP Addresses', href: '/ip-addresses', description: 'IP management' },
    { label: 'Software', href: '/software', description: 'Product catalog' },
    { label: 'Software Licenses', href: '/software-licenses', description: 'License tracking' },
    {
      label: 'Installed Applications',
      href: '/installed-applications',
      description: 'Deployed software',
    },
    { label: 'SaaS Services', href: '/saas-services', description: 'Cloud services' },
    { label: 'Documents', href: '/documents', description: 'Runbooks & policies' },
    {
      label: 'External Documents',
      href: '/external-documents',
      description: 'Links to external systems',
    },
    { label: 'Contracts', href: '/contracts', description: 'Vendor agreements' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Main navigation"
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
            height: '56px',
            paddingLeft: 'var(--spacing-sm)',
            paddingRight: 'var(--spacing-sm)',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="M.O.S.S. Home"
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

          {/* Mobile Hamburger Button */}
          <button
            data-mobile-menu-button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-haspopup="true"
            style={{
              display: 'none',
              width: '40px',
              height: '40px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '8px',
              marginLeft: 'auto',
              marginRight: 'var(--spacing-sm)',
            }}
            className="mobile-menu-button"
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
                stroke="var(--color-black)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Desktop Navigation Items */}
          <div
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              flex: 1,
              justifyContent: 'flex-end',
              marginRight: 'var(--spacing-xl)',
            }}
          >
            {/* Standalone nav items */}
            {standaloneNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
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
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid var(--color-blue)'
                  e.currentTarget.style.outlineOffset = '2px'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none'
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Dropdown menus */}
            <NavDropdown label="Places" items={placesItems} />
            <NavDropdown label="Assets" items={assetsItems} />
            <NavDropdown label="IT Services" items={itServicesItems} />
          </div>

          {/* Global Search */}
          <div style={{ marginRight: 'var(--spacing-md)' }}>
            <GlobalSearch />
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-controls="user-menu-dropdown"
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
            >
              U
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                id="user-menu-dropdown"
                role="menu"
                aria-label="User menu"
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
                  role="menuitem"
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
                  role="menuitem"
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
                    role="menuitem"
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
                      // Use window.location.origin to ensure we redirect to the current FQDN
                      const callbackUrl = `${window.location.origin}/login`
                      signOut({ callbackUrl })
                      setUserMenuOpen(false)
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          role="navigation"
          aria-label="Mobile navigation"
          style={{
            display: 'none',
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(var(--color-off-white-rgb), 0.9)',
            borderBottom: '1px solid var(--color-border)',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 999,
            backdropFilter: 'blur(8px)',
          }}
          className="mobile-menu-panel"
        >
          <div style={{ padding: 'var(--spacing-md)' }}>
            {/* Standalone items */}
            {standaloneNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: 'var(--spacing-md)',
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--color-blue)' : 'var(--color-black)',
                  fontWeight: isActive(item.href) ? '600' : '400',
                  borderRadius: '4px',
                  marginBottom: 'var(--spacing-xs)',
                  backgroundColor: isActive(item.href) ? 'var(--color-light-blue)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Places Section */}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontWeight: '600',
                  color: 'var(--color-brew-black-60)',
                  fontSize: 'var(--font-size-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Places
              </div>
              {placesItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    paddingLeft: 'var(--spacing-xl)',
                    textDecoration: 'none',
                    color: isActive(item.href) ? 'var(--color-blue)' : 'var(--color-black)',
                    fontWeight: isActive(item.href) ? '600' : '400',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {item.label}
                  {item.description && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-brew-black-60)',
                        marginTop: '2px',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Assets Section */}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontWeight: '600',
                  color: 'var(--color-brew-black-60)',
                  fontSize: 'var(--font-size-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Assets
              </div>
              {assetsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    paddingLeft: 'var(--spacing-xl)',
                    textDecoration: 'none',
                    color: isActive(item.href) ? 'var(--color-blue)' : 'var(--color-black)',
                    fontWeight: isActive(item.href) ? '600' : '400',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {item.label}
                  {item.description && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-brew-black-60)',
                        marginTop: '2px',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* IT Services Section */}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontWeight: '600',
                  color: 'var(--color-brew-black-60)',
                  fontSize: 'var(--font-size-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                IT Services
              </div>
              {itServicesItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    paddingLeft: 'var(--spacing-xl)',
                    textDecoration: 'none',
                    color: isActive(item.href) ? 'var(--color-blue)' : 'var(--color-black)',
                    fontWeight: isActive(item.href) ? '600' : '400',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {item.label}
                  {item.description && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-brew-black-60)',
                        marginTop: '2px',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
