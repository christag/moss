/**
 * StatWidget Component
 * Reusable widget for displaying quick stats
 */

'use client'

import Link from 'next/link'
import { Icon, IconName } from '@/components/ui'

interface StatWidgetProps {
  title: string
  value: number | string
  icon?: string | IconName
  color?: string
  link?: string
  description?: string
}

export default function StatWidget({
  title,
  value,
  icon,
  color = 'var(--color-morning-blue)',
  link,
  description,
}: StatWidgetProps) {
  const content = (
    <div
      style={{
        backgroundColor: 'white',
        padding: 'var(--spacing-lg)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: link ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: color,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--color-brew-black-60)',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: 'var(--color-brew-black)',
            }}
          >
            {value}
          </div>
        </div>
        {icon && (
          <div
            style={{
              fontSize: '2rem',
              opacity: 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {typeof icon === 'string' && /[\u{1F000}-\u{1F9FF}]/u.test(icon) ? (
              // Emoji string (detected by Unicode range)
              icon
            ) : (
              // IconName - render Icon component
              <Icon name={icon as IconName} size={32} aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {description && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-brew-black-60)',
          }}
        >
          {description}
        </div>
      )}
    </div>
  )

  if (link) {
    return (
      <Link href={link} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return content
}
