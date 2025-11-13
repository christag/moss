/**
 * Okta Integration Setup Wizard
 * Create new Okta directory sync integration
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OktaConfig, OktaSyncSettings } from '@/types/integrations'

type Tab = 'connection' | 'sync' | 'test'

interface FormData {
  name: string
  environment: 'development' | 'staging' | 'production'
  is_sandbox: boolean
  config: OktaConfig
  credentials: {
    okta_api_token?: string
    okta_client_id?: string
    okta_client_secret?: string
  }
  sync_settings: OktaSyncSettings
  auto_sync_enabled: boolean
  sync_schedule: string
}

export default function NewOktaIntegrationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('connection')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    environment: 'production',
    is_sandbox: false,
    config: {
      domain: '',
      api_version: 'v1',
      timeout_ms: 30000,
      auth_method: 'oauth',
    },
    credentials: {},
    sync_settings: {
      sync_groups: true,
      sync_group_members: true,
      sync_user_metadata: true,
      sync_app_assignments: false,
      user_match_strategy: 'email',
      create_missing_users: false,
      custom_field_mappings: {
        lastLogin: 'last_okta_login',
        status: 'okta_status',
        activated: 'okta_activated_date',
      },
    },
    auto_sync_enabled: false,
    sync_schedule: '0 2 * * *', // Daily at 2 AM
  })

  const updateConfig = (updates: Partial<OktaConfig>) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }))
  }

  const updateCredentials = (updates: Partial<FormData['credentials']>) => {
    setFormData((prev) => ({
      ...prev,
      credentials: { ...prev.credentials, ...updates },
    }))
  }

  const updateSyncSettings = (updates: Partial<OktaSyncSettings>) => {
    setFormData((prev) => ({
      ...prev,
      sync_settings: { ...prev.sync_settings, ...updates },
    }))
  }

  async function testConnection() {
    setTestResult(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'okta',
          config: formData.config,
          credentials: formData.credentials,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setTestResult({
          success: false,
          message: data.error || 'Connection test failed',
          details: data.details || JSON.stringify(data, null, 2),
        })
        return
      }

      setTestResult(data)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to test connection',
        details: err instanceof Error ? err.stack : undefined,
      })
    }
  }

  async function handleSubmit() {
    // Validation
    if (!formData.name.trim()) {
      setError('Integration name is required')
      return
    }

    if (!formData.config.domain.trim()) {
      setError('Okta domain is required')
      return
    }

    if (formData.config.auth_method === 'api_token' && !formData.credentials.okta_api_token) {
      setError('API token is required')
      return
    }

    if (
      formData.config.auth_method === 'oauth' &&
      (!formData.credentials.okta_client_id || !formData.credentials.okta_client_secret)
    ) {
      setError('OAuth client ID and secret are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create integration (API will handle encryption server-side)
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'okta',
          name: formData.name,
          is_enabled: true,
          environment: formData.environment,
          is_sandbox: formData.is_sandbox,
          config: formData.config,
          credentials: formData.credentials, // Send plain credentials - API will encrypt
          sync_settings: formData.sync_settings,
          auto_sync_enabled: formData.auto_sync_enabled,
          sync_schedule: formData.auto_sync_enabled ? formData.sync_schedule : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create integration')
      }

      // Redirect to integration detail page
      router.push(`/admin/integrations/okta/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Add Okta Integration
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Connect to Okta to sync groups, users, and application assignments into M.O.S.S.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <TabButton active={activeTab === 'connection'} onClick={() => setActiveTab('connection')}>
          1. Connection
        </TabButton>
        <TabButton active={activeTab === 'sync'} onClick={() => setActiveTab('sync')}>
          2. Sync Settings
        </TabButton>
        <TabButton active={activeTab === 'test'} onClick={() => setActiveTab('test')}>
          3. Test & Save
        </TabButton>
      </div>

      {/* Error Message */}
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

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        {activeTab === 'connection' && (
          <ConnectionTab
            formData={formData}
            setFormData={setFormData}
            updateConfig={updateConfig}
            updateCredentials={updateCredentials}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            formData={formData}
            setFormData={setFormData}
            updateSyncSettings={updateSyncSettings}
          />
        )}

        {activeTab === 'test' && (
          <TestTab formData={formData} testResult={testResult} onTest={testConnection} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-xl)',
        }}
      >
        <button
          onClick={() => router.push('/admin/integrations')}
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

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {activeTab !== 'connection' && (
            <button
              onClick={() => {
                const tabs: Tab[] = ['connection', 'sync', 'test']
                const currentIndex = tabs.indexOf(activeTab)
                setActiveTab(tabs[currentIndex - 1])
              }}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ← Previous
            </button>
          )}

          {activeTab !== 'test' ? (
            <button
              onClick={() => {
                const tabs: Tab[] = ['connection', 'sync', 'test']
                const currentIndex = tabs.indexOf(activeTab)
                setActiveTab(tabs[currentIndex + 1])
              }}
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
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                backgroundColor: saving ? 'var(--color-light-blue)' : 'var(--color-green)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {saving ? 'Creating...' : 'Create Integration'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tab Components
// ============================================================================

interface ConnectionTabProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  updateConfig: (updates: Partial<OktaConfig>) => void
  updateCredentials: (updates: Partial<FormData['credentials']>) => void
}

function ConnectionTab({
  formData,
  setFormData,
  updateConfig,
  updateCredentials,
}: ConnectionTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Connection Settings</h2>

      {/* SSO Clarification Banner */}
      <div
        style={{
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '8px',
          padding: 'var(--spacing-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <span style={{ fontSize: '1.25rem' }}>📘</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
              About This Integration
            </strong>
            <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-sm)' }}>
              This integration syncs <strong>users, groups, and app assignments</strong> from Okta
              into M.O.S.S. for asset management purposes.
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              <strong>Note:</strong> SSO/SAML configuration for logging into M.O.S.S. with Okta is
              configured separately in <strong>Admin → Authentication</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Name */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Integration Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Corporate Okta Production"
          required
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        />
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          A friendly name to identify this integration
        </p>
      </div>

      {/* Okta Domain */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Okta Domain *
        </label>
        <input
          type="text"
          value={formData.config.domain}
          onChange={(e) => updateConfig({ domain: e.target.value })}
          placeholder="yourcompany.okta.com"
          required
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        />
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          Your Okta organization domain (without https://)
        </p>
      </div>

      {/* Environment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Environment
          </label>
          <select
            value={formData.environment}
            onChange={(e) =>
              setFormData({
                ...formData,
                environment: e.target.value as FormData['environment'],
              })
            }
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
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
              checked={formData.is_sandbox}
              onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
            />
            <span>Sandbox / Testing Mode</span>
          </label>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {/* Authentication Method */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Authentication Method
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor:
                formData.config.auth_method === 'oauth' ? 'var(--color-light-blue)' : 'white',
            }}
          >
            <input
              type="radio"
              name="auth_method"
              value="oauth"
              checked={formData.config.auth_method === 'oauth'}
              onChange={() => {
                updateConfig({ auth_method: 'oauth' })
                updateCredentials({ okta_api_token: undefined })
              }}
              style={{ marginTop: '2px' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>OAuth 2.0 (Recommended)</div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-brew-black-60)',
                }}
              >
                More secure, supports fine-grained permissions
              </div>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor:
                formData.config.auth_method === 'api_token' ? 'var(--color-light-blue)' : 'white',
            }}
          >
            <input
              type="radio"
              name="auth_method"
              value="api_token"
              checked={formData.config.auth_method === 'api_token'}
              onChange={() => {
                updateConfig({ auth_method: 'api_token' })
                updateCredentials({
                  okta_client_id: undefined,
                  okta_client_secret: undefined,
                })
              }}
              style={{ marginTop: '2px' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>API Token (SSWS)</div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-brew-black-60)',
                }}
              >
                Simpler setup, good for development and testing
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Credentials */}
      {formData.config.auth_method === 'oauth' ? (
        <>
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              OAuth Client ID *
            </label>
            <input
              type="text"
              value={formData.credentials.okta_client_id || ''}
              onChange={(e) => updateCredentials({ okta_client_id: e.target.value })}
              placeholder="0oa1abc2def3ghi4jkl5"
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              OAuth Client Secret *
            </label>
            <input
              type="password"
              value={formData.credentials.okta_client_secret || ''}
              onChange={(e) => updateCredentials({ okta_client_secret: e.target.value })}
              placeholder="Enter client secret"
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Required scopes: okta.groups.read, okta.users.read, okta.apps.read
            </p>
          </div>
        </>
      ) : (
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            API Token *
          </label>
          <input
            type="password"
            value={formData.credentials.okta_api_token || ''}
            onChange={(e) => updateCredentials({ okta_api_token: e.target.value })}
            placeholder="Enter API token"
            required
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          />
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-brew-black-60)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Create an API token in Okta Admin Console → Security → API → Tokens
          </p>
        </div>
      )}
    </div>
  )
}

interface SyncTabProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  updateSyncSettings: (updates: Partial<OktaSyncSettings>) => void
}

function SyncTab({ formData, setFormData, updateSyncSettings }: SyncTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Sync Settings</h2>

      {/* What to Sync */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          What to Sync
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
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
              checked={formData.sync_settings.sync_groups}
              onChange={(e) => updateSyncSettings({ sync_groups: e.target.checked })}
            />
            <span>Groups (creates records in M.O.S.S. groups table)</span>
          </label>

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
              checked={formData.sync_settings.sync_group_members}
              onChange={(e) => updateSyncSettings({ sync_group_members: e.target.checked })}
            />
            <span>Group Memberships (updates group_members table)</span>
          </label>

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
              checked={formData.sync_settings.sync_user_metadata}
              onChange={(e) => updateSyncSettings({ sync_user_metadata: e.target.checked })}
            />
            <span>User Metadata Enrichment (adds Okta fields to existing M.O.S.S. people)</span>
          </label>

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
              checked={formData.sync_settings.sync_app_assignments}
              onChange={(e) => updateSyncSettings({ sync_app_assignments: e.target.checked })}
            />
            <span>Application Assignments (which apps each user has access to)</span>
          </label>
        </div>
      </div>

      {/* Group Filter */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Group Filter (Optional)
        </label>
        <input
          type="text"
          value={formData.sync_settings.group_filter || ''}
          onChange={(e) =>
            updateSyncSettings({
              group_filter: e.target.value || null,
            })
          }
          placeholder="e.g., MOSS (only sync groups containing this text)"
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        />
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          Leave empty to sync all groups, or enter text to filter (e.g., only sync groups with
          &ldquo;MOSS&rdquo; in the name)
        </p>
      </div>

      {/* User Matching */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          User Matching Strategy
        </label>
        <select
          value={formData.sync_settings.user_match_strategy}
          onChange={(e) =>
            updateSyncSettings({
              user_match_strategy: e.target.value as 'email' | 'username' | 'employee_id',
            })
          }
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        >
          <option value="email">Match by Email Address</option>
          <option value="username">Match by Username</option>
          <option value="employee_id">Match by Employee ID</option>
        </select>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          How to match Okta users with existing M.O.S.S. people records
        </p>
      </div>

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
          checked={formData.sync_settings.create_missing_users}
          onChange={(e) => updateSyncSettings({ create_missing_users: e.target.checked })}
        />
        <span>Create M.O.S.S. person record if no match found (use with caution)</span>
      </label>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {/* Sync Schedule */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          <input
            type="checkbox"
            checked={formData.auto_sync_enabled}
            onChange={(e) => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
          />
          <span>Enable Automatic Sync</span>
        </label>

        {formData.auto_sync_enabled && (
          <div style={{ marginLeft: 'var(--spacing-xl)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Sync Schedule (Cron Expression)
            </label>
            <input
              type="text"
              value={formData.sync_schedule}
              onChange={(e) => setFormData({ ...formData, sync_schedule: e.target.value })}
              placeholder="0 2 * * *"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Default: 0 2 * * * (daily at 2 AM). Use{' '}
              <a
                href="https://crontab.guru"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-morning-blue)' }}
              >
                crontab.guru
              </a>{' '}
              to create custom schedules.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface TestTabProps {
  formData: FormData
  testResult: { success: boolean; message: string; details?: string } | null
  onTest: () => void
}

function TestTab({ formData, testResult, onTest }: TestTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Review & Test Connection</h2>

      {/* Summary */}
      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          padding: 'var(--spacing-lg)',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Configuration Summary
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Name:</span>
            <span style={{ fontWeight: '500' }}>{formData.name || '(not set)'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Okta Domain:</span>
            <span style={{ fontWeight: '500' }}>{formData.config.domain || '(not set)'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Environment:</span>
            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
              {formData.environment}
              {formData.is_sandbox && ' (Sandbox)'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Auth Method:</span>
            <span style={{ fontWeight: '500' }}>
              {formData.config.auth_method === 'oauth' ? 'OAuth 2.0' : 'API Token'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Sync Schedule:</span>
            <span style={{ fontWeight: '500' }}>
              {formData.auto_sync_enabled ? formData.sync_schedule : 'Manual Only'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
            <span style={{ color: 'var(--color-brew-black-60)' }}>Sync Items:</span>
            <span style={{ fontWeight: '500' }}>
              {[
                formData.sync_settings.sync_groups && 'Groups',
                formData.sync_settings.sync_group_members && 'Memberships',
                formData.sync_settings.sync_user_metadata && 'User Metadata',
                formData.sync_settings.sync_app_assignments && 'App Assignments',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div>
        <button
          onClick={onTest}
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
          Test Connection to Okta
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          style={{
            padding: 'var(--spacing-lg)',
            backgroundColor: testResult.success ? '#E6F7ED' : '#FEE',
            border: `1px solid ${testResult.success ? 'var(--color-green)' : 'var(--color-orange)'}`,
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{testResult.success ? '✅' : '❌'}</span>
            <span
              style={{
                fontWeight: '600',
                color: testResult.success ? 'var(--color-green)' : 'var(--color-orange)',
              }}
            >
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </span>
          </div>
          <p style={{ marginBottom: testResult.details ? 'var(--spacing-sm)' : 0 }}>
            {testResult.message}
          </p>
          {testResult.details && (
            <details style={{ marginTop: 'var(--spacing-sm)' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: 'var(--color-brew-black-60)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                Technical Details
              </summary>
              <pre
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: '4px',
                  fontSize: 'var(--font-size-sm)',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                {testResult.details}
              </pre>
            </details>
          )}
        </div>
      )}

      {!testResult && (
        <div
          style={{
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--color-light-blue)',
            borderRadius: '8px',
          }}
        >
          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
            <strong>Before saving:</strong> Test your connection to ensure credentials are correct
            and M.O.S.S. can reach Okta.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brew-black-60)' }}>
            The test will attempt to list groups from your Okta organization.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--spacing-md) var(--spacing-lg)',
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: active ? '3px solid var(--color-morning-blue)' : '3px solid transparent',
        color: active ? 'var(--color-morning-blue)' : 'var(--color-brew-black-60)',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}
