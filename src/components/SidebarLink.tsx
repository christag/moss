/**
 * SidebarLink Component
 * Interactive sidebar navigation link with hover effects
 */
'use client'

import Link from 'next/link'
import { useState } from 'react'

interface SidebarLinkProps {
  href: string
  isActive: boolean
  children: React.ReactNode
}

export function SidebarLink({ href, isActive, children }: SidebarLinkProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        marginBottom: 'var(--spacing-sm)',
        borderRadius: '4px',
        textDecoration: 'none',
        color: isActive ? 'var(--color-off-white)' : 'rgba(250, 249, 245, 0.7)',
        backgroundColor: isActive
          ? 'var(--color-blue)'
          : isHovered
            ? 'rgba(250, 249, 245, 0.05)'
            : 'transparent',
        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  )
}

interface SidebarResourceLinkProps {
  href: string
  isActive: boolean
  children: React.ReactNode
}

export function SidebarResourceLink({ href, isActive, children }: SidebarResourceLinkProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: '4px',
        textDecoration: 'none',
        color: isActive ? 'var(--color-off-white)' : 'rgba(250, 249, 245, 0.7)',
        backgroundColor: isActive
          ? 'var(--color-blue)'
          : isHovered
            ? 'rgba(250, 249, 245, 0.05)'
            : 'transparent',
        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        fontSize: 'var(--font-size-sm)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  )
}

interface SidebarBottomLinkProps {
  href: string
  children: React.ReactNode
}

export function SidebarBottomLink({ href, children }: SidebarBottomLinkProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 'var(--spacing-sm)',
        textDecoration: 'none',
        color: isHovered ? 'var(--color-off-white)' : 'rgba(250, 249, 245, 0.7)',
        fontSize: 'var(--font-size-sm)',
        transition: 'color 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  )
}
