/**
 * ResourceCard Component
 * Interactive card for API resource links
 */
'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ResourceCardProps {
  href: string
  name: string
  description: string
}

export function ResourceCard({ href, name, description }: ResourceCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      className="card"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        padding: 'var(--spacing-md)',
        transition: 'all 0.2s',
        border: `1px solid ${isHovered ? 'var(--color-blue)' : 'var(--color-border)'}`,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h4 style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--color-blue)' }}>{name}</h4>
      <p
        style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)', margin: 0 }}
      >
        {description}
      </p>
    </Link>
  )
}
