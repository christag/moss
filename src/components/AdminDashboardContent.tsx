/**
 * Admin Dashboard Content
 * Client component for admin dashboard UI with SVG icons
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { Icon, IconName } from '@/components/ui'

interface QuickAction {
  title: string
  description: string
  icon: IconName
  href: string
  color: string
  requiresSuperAdmin?: boolean
}

interface SystemInfo {
  label: string
  value: string
}

interface AdminDashboardContentProps {
  systemInfo: SystemInfo[]
  quickActions: QuickAction[]
}

export default function AdminDashboardContent({
  systemInfo,
  quickActions,
}: AdminDashboardContentProps) {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          System configuration and administrative tools
        </p>
      </div>

      {/* Current User Info */}
      <div
        style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-lg)',
          borderRadius: '8px',
          marginBottom: 'var(--spacing-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Current Session
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {systemInfo.map((info) => (
            <div key={info.label}>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-brew-black-60)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                {info.label}
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'var(--color-brew-black)',
                }}
              >
                {info.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: 'block',
                textDecoration: 'none',
                backgroundColor: 'white',
                padding: 'var(--spacing-lg)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Color accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: action.color,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={action.icon} size={32} aria-hidden="true" />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: 'var(--color-brew-black)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    {action.title}
                    {action.requiresSuperAdmin && (
                      <span
                        style={{
                          marginLeft: 'var(--spacing-xs)',
                          fontSize: '0.75rem',
                          color: 'var(--color-orange)',
                        }}
                      >
                        *
                      </span>
                    )}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-brew-black-60)',
                      lineHeight: 1.5,
                    }}
                  >
                    {action.description}
                  </p>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    color: 'var(--color-brew-black-40)',
                    fontSize: '1.25rem',
                  }}
                >
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          backgroundColor: 'var(--color-light-blue)',
          color: 'var(--color-brew-black)',
          padding: 'var(--spacing-lg)',
          borderRadius: '8px',
          border: '1px solid var(--color-morning-blue)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="circle-check" size={24} aria-hidden="true" />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Admin Panel Information
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              This admin panel provides comprehensive system configuration capabilities. Sections
              marked with * require Super Admin role. All administrative actions are logged for
              audit purposes. Please exercise caution when modifying system settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
