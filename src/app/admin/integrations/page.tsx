/**
 * Admin Integrations Page
 * Manage Okta and Jamf integrations for directory sync and MDM data
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { IntegrationConfig } from '@/types/integrations'
import { Icon } from '@/components/ui'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  async function fetchIntegrations() {
    try {
      const response = await fetch('/api/admin/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const oktaIntegrations = integrations.filter((i) => i.integration_type === 'okta')
  const jamfIntegrations = integrations.filter((i) => i.integration_type === 'jamf')

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: 'var(--color-brew-black)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Integrations
          </h1>
          <p style={{ color: 'var(--color-brew-black-60)' }}>
            Connect external systems to sync directory data and device information into M.O.S.S.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FEE',
            color: 'var(--color-orange)',
            padding: 'var(--spacing-md)',
            borderRadius: '8px',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid var(--color-orange)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          Loading integrations...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Okta Section */}
          <IntegrationSection
            title="Okta Directory Sync"
            description="Sync groups, users, and application assignments from Okta into M.O.S.S. for enriched user profiles and relationship management."
            iconName="lock-security"
            color="var(--color-morning-blue)"
            integrations={oktaIntegrations}
            addUrl="/admin/integrations/okta/new"
            loading={loading}
          />

          {/* Jamf Section */}
          <IntegrationSection
            title="Jamf MDM Sync"
            description="Sync computer inventory, smart groups, and user assignments from Jamf Pro to automatically populate and update device records."
            iconName="mobile-phone"
            color="var(--color-green)"
            integrations={jamfIntegrations}
            addUrl="/admin/integrations/jamf/new"
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}

interface IntegrationSectionProps {
  title: string
  description: string
  iconName: 'lock-security' | 'mobile-phone'
  color: string
  integrations: IntegrationConfig[]
  addUrl: string
  loading: boolean
}

function IntegrationSection({
  title,
  description,
  iconName,
  color,
  integrations,
  addUrl,
}: IntegrationSectionProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: 'var(--spacing-xl)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              backgroundColor: `${color}20`,
              padding: 'var(--spacing-md)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={iconName} size={32} style={{ color }} aria-label={`${title} icon`} />
          </div>
          <div>
            <h2
              style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}
            >
              {title}
            </h2>
            <p style={{ color: 'var(--color-brew-black-60)', fontSize: 'var(--font-size-sm)' }}>
              {description}
            </p>
          </div>
        </div>
        <Link
          href={addUrl}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          + Add Connection
        </Link>
      </div>

      {integrations.length === 0 ? (
        <div
          style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            backgroundColor: 'var(--color-off-white)',
            borderRadius: '8px',
            border: '1px dashed var(--color-border)',
          }}
        >
          <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-md)' }}>
            No connections configured yet
          </p>
          <Link
            href={addUrl}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: color,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Connect Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} color={color} />
          ))}
        </div>
      )}
    </div>
  )
}

interface IntegrationCardProps {
  integration: IntegrationConfig
  color: string
}

function IntegrationCard({ integration, color }: IntegrationCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString()
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'var(--color-green)'
      case 'failed':
        return 'var(--color-orange)'
      case 'in_progress':
        return 'var(--color-morning-blue)'
      default:
        return 'var(--color-brew-black-40)'
    }
  }

  return (
    <Link
      href={`/admin/integrations/${integration.integration_type}/${integration.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          padding: 'var(--spacing-lg)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          borderLeft: `4px solid ${color}`,
          backgroundColor: 'white',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{integration.name}</h3>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: integration.is_enabled
                    ? 'var(--color-green)'
                    : 'var(--color-brew-black-40)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                {integration.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
              {integration.is_sandbox && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: 'var(--color-tangerine)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}
                >
                  Sandbox
                </span>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-brew-black-60)' }}>Environment: </span>
                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {integration.environment}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--color-brew-black-60)' }}>Last Sync: </span>
                <span style={{ fontWeight: '500' }}>{formatDate(integration.last_sync_at)}</span>
              </div>

              {integration.last_sync_status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-brew-black-60)' }}>Status: </span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(integration.last_sync_status),
                    }}
                  />
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {integration.last_sync_status.replace('_', ' ')}
                  </span>
                </div>
              )}

              {integration.auto_sync_enabled && (
                <div>
                  <span style={{ color: 'var(--color-brew-black-60)' }}>Schedule: </span>
                  <span style={{ fontWeight: '500' }}>{integration.sync_schedule || 'Manual'}</span>
                </div>
              )}
            </div>

            {integration.last_sync_error && (
              <div
                style={{
                  marginTop: 'var(--spacing-sm)',
                  padding: 'var(--spacing-xs)',
                  backgroundColor: '#FEE',
                  borderRadius: '4px',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-orange)',
                }}
              >
                Error: {integration.last_sync_error}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'var(--spacing-lg)' }}>
            <span
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                backgroundColor: 'var(--color-light-blue)',
                color: 'var(--color-brew-black)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
              }}
            >
              Configure →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
