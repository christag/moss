'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JamfConfig, JamfSyncSettings } from '@/types/integrations'

type Tab = 'connection' | 'sync' | 'test'

interface FormData {
  name: string
  environment: 'development' | 'staging' | 'production'
  is_sandbox: boolean
  config: JamfConfig
  credentials: {
    jamf_client_id: string
    jamf_client_secret: string
  }
  sync_settings: JamfSyncSettings
  auto_sync_enabled: boolean
  sync_schedule: string
}

export default function NewJamfIntegrationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('connection')
  const [loading, setLoading] = useState(false)
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
      base_url: '',
      api_version: 'v1',
      timeout_ms: 30000,
    },
    credentials: {
      jamf_client_id: '',
      jamf_client_secret: '',
    },
    sync_settings: {
      sync_computers: true,
      sync_computer_groups: true,
      sync_users: false,
      sync_sections: ['GENERAL', 'HARDWARE', 'USER_AND_LOCATION', 'GROUP_MEMBERSHIPS'],
      smart_group_filter: null,
      create_missing_locations: true,
      update_existing_devices: true,
    },
    auto_sync_enabled: false,
    sync_schedule: '0 2 * * *', // Daily at 2 AM
  })

  // Helper functions to update nested state
  const updateConfig = (updates: Partial<JamfConfig>) => {
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

  const updateSyncSettings = (updates: Partial<JamfSyncSettings>) => {
    setFormData((prev) => ({
      ...prev,
      sync_settings: { ...prev.sync_settings, ...updates },
    }))
  }

  // Test connection
  async function testConnection() {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'jamf',
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
    } finally {
      setLoading(false)
    }
  }

  // Submit form
  async function handleSubmit() {
    // Validation
    if (!formData.name.trim()) {
      alert('Integration name is required')
      return
    }

    if (!formData.config.base_url.trim()) {
      alert('Jamf Pro URL is required')
      return
    }

    if (!formData.credentials.jamf_client_id || !formData.credentials.jamf_client_secret) {
      alert('Client credentials are required')
      return
    }

    setLoading(true)

    try {
      // Create integration (API will handle encryption server-side)
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'jamf',
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

      if (data.success) {
        router.push(`/admin/integrations/jamf/${data.data.id}`)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <Link
            href="/admin/integrations"
            style={{
              color: 'var(--color-morning-blue)',
              textDecoration: 'none',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            ← Back to Integrations
          </Link>
        </div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Add Jamf Pro Integration
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Connect to Jamf Pro to sync computer inventory, smart groups, and device assignments
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
          borderBottom: '2px solid var(--color-border)',
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

      {/* Tab Content */}
      <div>
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
          <TestTab
            formData={formData}
            testResult={testResult}
            onTest={testConnection}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          marginTop: 'var(--spacing-xl)',
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => router.push('/admin/integrations')}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {activeTab !== 'connection' && (
            <button
              onClick={() => setActiveTab(activeTab === 'test' ? 'sync' : 'connection')}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Previous
            </button>
          )}

          {activeTab !== 'test' && (
            <button
              onClick={() => setActiveTab(activeTab === 'connection' ? 'sync' : 'test')}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'var(--color-green)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--spacing-md)',
        border: 'none',
        backgroundColor: 'transparent',
        borderBottom: active ? '3px solid var(--color-green)' : '3px solid transparent',
        fontWeight: active ? '600' : '400',
        color: active ? 'var(--color-green)' : 'var(--color-brew-black-60)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// Connection Tab
function ConnectionTab({
  formData,
  setFormData,
  updateConfig,
  updateCredentials,
}: {
  formData: FormData
  setFormData: (data: FormData) => void
  updateConfig: (updates: Partial<JamfConfig>) => void
  updateCredentials: (updates: Partial<FormData['credentials']>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        Connection Settings
      </h2>

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
          placeholder="Production Jamf Pro"
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
          A descriptive name for this integration (e.g., &ldquo;Production Jamf Pro&rdquo;)
        </p>
      </div>

      {/* Jamf Pro URL */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Jamf Pro URL *
        </label>
        <input
          type="url"
          value={formData.config.base_url}
          onChange={(e) => updateConfig({ base_url: e.target.value })}
          placeholder="https://yourcompany.jamfcloud.com"
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
          Your Jamf Pro server URL (include https://)
        </p>
      </div>

      {/* Environment */}
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
              environment: e.target.value as 'development' | 'staging' | 'production',
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

      {/* Sandbox Mode */}
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
        <span>Sandbox Mode (test environment, limited access)</span>
      </label>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {/* OAuth Credentials */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          OAuth 2.0 Credentials
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Create API credentials in Jamf Pro: Settings → System → API Roles and Clients
        </p>

        {/* Client ID */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Client ID *
          </label>
          <input
            type="text"
            value={formData.credentials.jamf_client_id}
            onChange={(e) => updateCredentials({ jamf_client_id: e.target.value })}
            placeholder="abc123xyz..."
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Client Secret */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Client Secret *
          </label>
          <input
            type="password"
            value={formData.credentials.jamf_client_secret}
            onChange={(e) => updateCredentials({ jamf_client_secret: e.target.value })}
            placeholder="Enter client secret"
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-brew-black-60)',
              marginTop: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--color-off-white)',
              borderRadius: '4px',
            }}
          >
            <strong>Required Jamf Pro API Client Privileges:</strong>
            <ul style={{ margin: 'var(--spacing-xs) 0 0 var(--spacing-md)', paddingLeft: '0' }}>
              <li>Read Computers</li>
              <li>Read Smart Computer Groups</li>
              <li>Read Static Computer Groups</li>
              <li>Read Users</li>
              <li>Read Mobile Devices (future use)</li>
              <li>Read Mac Applications (future use)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sync Tab
function SyncTab({
  formData,
  setFormData,
  updateSyncSettings,
}: {
  formData: FormData
  setFormData: (data: FormData) => void
  updateSyncSettings: (updates: Partial<JamfSyncSettings>) => void
}) {
  const toggleSection = (section: (typeof formData.sync_settings.sync_sections)[number]) => {
    const sections = formData.sync_settings.sync_sections
    if (sections.includes(section)) {
      updateSyncSettings({ sync_sections: sections.filter((s) => s !== section) })
    } else {
      updateSyncSettings({ sync_sections: [...sections, section] })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        Sync Configuration
      </h2>

      {/* What to Sync */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          What to Sync
        </h3>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={formData.sync_settings.sync_computers}
            onChange={(e) => updateSyncSettings({ sync_computers: e.target.checked })}
          />
          <span>Sync Computers (creates/updates device records)</span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={formData.sync_settings.sync_computer_groups}
            onChange={(e) => updateSyncSettings({ sync_computer_groups: e.target.checked })}
          />
          <span>Sync Computer Groups (creates group records)</span>
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
            checked={formData.sync_settings.sync_users}
            onChange={(e) => updateSyncSettings({ sync_users: e.target.checked })}
          />
          <span>Sync User Assignments (links people to devices)</span>
        </label>
      </div>

      {/* Computer Inventory Sections */}
      {formData.sync_settings.sync_computers && (
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            Computer Inventory Sections
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-brew-black-60)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Choose which computer inventory sections to sync
          </p>

          {[
            { value: 'GENERAL', label: 'General (name, model, serial, OS)' },
            { value: 'HARDWARE', label: 'Hardware (CPU, RAM, storage)' },
            { value: 'SOFTWARE', label: 'Software (installed apps)' },
            { value: 'USER_AND_LOCATION', label: 'User & Location' },
            { value: 'GROUP_MEMBERSHIPS', label: 'Group Memberships' },
            { value: 'SECURITY', label: 'Security (FileVault, firewall)' },
          ].map((section) => (
            <label
              key={section.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.sync_settings.sync_sections.includes(
                  section.value as (typeof formData.sync_settings.sync_sections)[number]
                )}
                onChange={() =>
                  toggleSection(
                    section.value as (typeof formData.sync_settings.sync_sections)[number]
                  )
                }
              />
              <span>{section.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Smart Group Filter */}
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '500',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Smart Group Filter (Optional)
        </label>
        <input
          type="text"
          value={formData.sync_settings.smart_group_filter || ''}
          onChange={(e) =>
            updateSyncSettings({
              smart_group_filter: e.target.value || null,
            })
          }
          placeholder="Enter smart group name to filter..."
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
          Leave empty to sync all computers, or enter text to filter (e.g., only sync computers in
          &ldquo;Production Devices&rdquo; group)
        </p>
      </div>

      {/* Options */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Sync Options
        </h3>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={formData.sync_settings.create_missing_locations}
            onChange={(e) => updateSyncSettings({ create_missing_locations: e.target.checked })}
          />
          <span>Auto-create M.O.S.S. location records if missing</span>
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
            checked={formData.sync_settings.update_existing_devices}
            onChange={(e) => updateSyncSettings({ update_existing_devices: e.target.checked })}
          />
          <span>Update existing device records (recommended)</span>
        </label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {/* Sync Schedule */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Sync Schedule
        </h3>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={formData.auto_sync_enabled}
            onChange={(e) => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
          />
          <span>Enable automatic sync</span>
        </label>

        {formData.auto_sync_enabled && (
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Cron Schedule
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
              Default: 0 2 * * * (daily at 2 AM) -{' '}
              <a
                href="https://crontab.guru"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-morning-blue)' }}
              >
                Learn cron syntax
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Test Tab
function TestTab({
  formData,
  testResult,
  onTest,
  onSubmit,
  loading,
}: {
  formData: FormData
  testResult: { success: boolean; message: string; details?: string } | null
  onTest: () => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        Review & Test Connection
      </h2>

      {/* Configuration Summary */}
      <div
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Configuration Summary
        </h3>

        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Integration Name:</span>
            <span>{formData.name || '(not set)'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Jamf Pro URL:</span>
            <span>{formData.config.base_url || '(not set)'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Environment:</span>
            <span style={{ textTransform: 'capitalize' }}>{formData.environment}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Sync Schedule:</span>
            <span>{formData.auto_sync_enabled ? formData.sync_schedule : 'Manual sync only'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Sync Items:</span>
            <span>
              {[
                formData.sync_settings.sync_computers && 'Computers',
                formData.sync_settings.sync_computer_groups && 'Groups',
                formData.sync_settings.sync_users && 'Users',
              ]
                .filter(Boolean)
                .join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <button
            onClick={onTest}
            disabled={loading}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              border: '1px solid var(--color-green)',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: 'var(--color-green)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
            }}
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '1.5rem' }}>{testResult.success ? '✅' : '❌'}</span>
              <span
                style={{
                  fontWeight: '500',
                  color: testResult.success ? 'var(--color-green)' : 'var(--color-orange)',
                }}
              >
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
            </div>
          )}
        </div>

        {testResult && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: testResult.success
                ? 'var(--color-light-blue)'
                : 'var(--color-off-white)',
              border: `1px solid ${testResult.success ? 'var(--color-green)' : 'var(--color-orange)'}`,
              borderRadius: '4px',
            }}
          >
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

        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            marginTop: 'var(--spacing-sm)',
          }}
        >
          ⚠️ Test the connection before saving to ensure your credentials are correct
        </p>
      </div>

      {/* Create Button */}
      <div>
        <button
          onClick={onSubmit}
          disabled={loading || !testResult?.success}
          style={{
            padding: 'var(--spacing-md) var(--spacing-xl)',
            border: 'none',
            borderRadius: '4px',
            backgroundColor:
              loading || !testResult?.success ? 'var(--color-disabled)' : 'var(--color-green)',
            color: 'white',
            cursor: loading || !testResult?.success ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
          }}
        >
          {loading ? 'Creating...' : 'Create Jamf Integration'}
        </button>
        {!testResult?.success && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-orange)',
              marginTop: 'var(--spacing-sm)',
            }}
          >
            Please test the connection successfully before creating the integration
          </p>
        )}
      </div>
    </div>
  )
}
