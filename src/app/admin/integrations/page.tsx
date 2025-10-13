/**
 * Admin Integrations Page
 * Manage external system integrations (IdP, MDM, RMM, etc.)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Integration } from '@/types'

export default function IntegrationsPage() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  async function fetchIntegrations() {
    try {
      const response = await fetch('/api/admin/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      const data = await response.json()
      setIntegrations(data.integrations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the integration "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/integrations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete integration')
      }

      await fetchIntegrations()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete integration')
    }
  }

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
            Manage connections to external systems (IdP, MDM, RMM, Cloud Providers)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            backgroundColor: 'var(--color-morning-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + Add Integration
        </button>
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
      ) : integrations.length === 0 ? (
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-md)' }}>
            No integrations configured yet
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: 'var(--color-morning-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onDelete={handleDelete}
              onEdit={(id) => router.push(`/admin/integrations/${id}`)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddIntegrationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchIntegrations()
          }}
        />
      )}
    </div>
  )
}

interface IntegrationCardProps {
  integration: Integration
  onDelete: (id: string, name: string) => void
  onEdit: (id: string) => void
}

function IntegrationCard({ integration, onDelete, onEdit }: IntegrationCardProps) {
  const typeColors: Record<string, string> = {
    idp: 'var(--color-orange)',
    mdm: 'var(--color-morning-blue)',
    rmm: 'var(--color-green)',
    cloud_provider: 'var(--color-light-blue)',
    ticketing: 'var(--color-tangerine)',
    monitoring: 'var(--color-lime-green)',
    backup: 'var(--color-lime-green)',
    other: 'var(--color-light-blue)',
  }

  const typeIcons: Record<string, string> = {
    idp: '🔐',
    mdm: '📱',
    rmm: '🖥️',
    cloud_provider: '☁️',
    ticketing: '🎫',
    monitoring: '📊',
    backup: '💾',
    other: '🔌',
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: 'var(--spacing-lg)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: typeColors[integration.integration_type] || 'var(--color-light-blue)',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ fontSize: '2rem' }}>
            {typeIcons[integration.integration_type] || '🔌'}
          </span>
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-brew-black)' }}
            >
              {integration.name}
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
              {integration.provider}
            </p>
          </div>
        </div>
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: integration.is_active
              ? 'var(--color-green)'
              : 'var(--color-brew-black-40)',
          }}
        />
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
            Type:
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
            {integration.integration_type}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
            Sync:
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
            {integration.sync_enabled ? integration.sync_frequency || 'Manual' : 'Disabled'}
          </span>
        </div>
        {integration.last_sync_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
              Last Sync:
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
              {new Date(integration.last_sync_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--spacing-md)',
        }}
      >
        <button
          onClick={() => onEdit(integration.id)}
          style={{
            flex: 1,
            padding: 'var(--spacing-xs)',
            backgroundColor: 'var(--color-light-blue)',
            color: 'var(--color-brew-black)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Configure
        </button>
        <button
          onClick={() => onDelete(integration.id, integration.name)}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            backgroundColor: 'transparent',
            color: 'var(--color-orange)',
            border: '1px solid var(--color-orange)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

interface AddIntegrationModalProps {
  onClose: () => void
  onSuccess: () => void
}

function AddIntegrationModal({ onClose, onSuccess }: AddIntegrationModalProps) {
  const [formData, setFormData] = useState<{
    integration_type:
      | 'idp'
      | 'mdm'
      | 'rmm'
      | 'cloud_provider'
      | 'ticketing'
      | 'monitoring'
      | 'backup'
      | 'other'
    name: string
    provider: string
    config: Record<string, unknown>
    sync_enabled: boolean
    sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
    is_active: boolean
    notes: string
  }>({
    integration_type: 'idp',
    name: '',
    provider: '',
    config: {},
    sync_enabled: false,
    sync_frequency: 'daily',
    is_active: true,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create integration')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Add Integration
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
            >
              Integration Type
            </label>
            <select
              value={formData.integration_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  integration_type: e.target.value as
                    | 'idp'
                    | 'mdm'
                    | 'rmm'
                    | 'cloud_provider'
                    | 'ticketing'
                    | 'monitoring'
                    | 'backup'
                    | 'other',
                })
              }
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            >
              <option value="idp">Identity Provider (IdP)</option>
              <option value="mdm">Mobile Device Management (MDM)</option>
              <option value="rmm">Remote Monitoring & Management (RMM)</option>
              <option value="cloud_provider">Cloud Provider</option>
              <option value="ticketing">Ticketing System</option>
              <option value="monitoring">Monitoring System</option>
              <option value="backup">Backup System</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
            >
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Corporate Okta"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
            >
              Provider
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              required
              placeholder="e.g., Okta, Jamf, AWS"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.sync_enabled}
                onChange={(e) => setFormData({ ...formData, sync_enabled: e.target.checked })}
              />
              <span>Enable automatic sync</span>
            </label>
          </div>

          {formData.sync_enabled && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label
                style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
              >
                Sync Frequency
              </label>
              <select
                value={formData.sync_frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sync_frequency: e.target.value as 'manual' | 'hourly' | 'daily' | 'weekly',
                  })
                }
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                }}
              >
                <option value="manual">Manual</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'flex-end',
              marginTop: 'var(--spacing-lg)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                backgroundColor: saving ? 'var(--color-light-blue)' : 'var(--color-morning-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {saving ? 'Creating...' : 'Create Integration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
