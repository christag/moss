'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavDropdownItem {
  label: string
  href: string
  description?: string
}

interface NavDropdownProps {
  label: string
  items: NavDropdownItem[]
}

/**
 * Navigation Dropdown Component
 * Displays a dropdown menu with navigation items
 */
export function NavDropdown({ label, items }: NavDropdownProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Check if any item in the dropdown is active
  const isActive = () => {
    return items.some((item) => {
      if (item.href === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(item.href)
    })
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const handleItemClick = () => {
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={`dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isActive() ? 'var(--color-blue)' : 'var(--color-black)',
          fontWeight: isActive() ? '600' : '400',
          fontSize: 'var(--font-size-base)',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={(e) => {
          if (!isActive()) {
            e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={`dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`}
          role="menu"
          aria-label={`${label} menu`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-off-white)',
            border: '1px solid #E5E5E5',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '220px',
            overflow: 'hidden',
            zIndex: 1001,
          }}
        >
          {items.map((item, index) => {
            const itemIsActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            return (
              <React.Fragment key={item.href}>
                {index > 0 && (
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--color-border)',
                      margin: '0 var(--spacing-sm)',
                    }}
                  />
                )}
                <Link
                  href={item.href}
                  role="menuitem"
                  style={{
                    display: 'block',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    textDecoration: 'none',
                    color: itemIsActive ? 'var(--color-blue)' : 'var(--color-black)',
                    fontWeight: itemIsActive ? '600' : '400',
                    fontSize: 'var(--font-size-base)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-light-blue)'
                    e.currentTarget.style.outline = '2px solid var(--color-blue)'
                    e.currentTarget.style.outlineOffset = '-2px'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.outline = 'none'
                  }}
                  onClick={handleItemClick}
                >
                  <div style={{ fontWeight: itemIsActive ? '600' : '500' }}>{item.label}</div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-black)',
                        opacity: 0.6,
                        marginTop: '2px',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </Link>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
