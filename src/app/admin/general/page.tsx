/**
 * Admin General Settings Page
 * Configure general system settings including site URL, timezone, backups, etc.
 */

'use client'

import React, { useState, useEffect } from 'react'

interface GeneralSettings {
  site_url?: string
  timezone?: string
  date_format?: string
  items_per_page?: number
  backup_enabled?: boolean
  backup_frequency?: 'daily' | 'weekly'
  backup_retention_days?: number
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>({
    site_url: 'http://localhost:3000',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    items_per_page: 50,
    backup_enabled: false,
    backup_frequency: 'daily',
    backup_retention_days: 30,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings/general')
        if (!response.ok) {
          throw new Error('Failed to fetch general settings')
        }
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          General Settings
        </h1>
        <p>Loading...</p>
      </div>
    )
  }

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
          General Settings
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Configure general system settings and defaults
        </p>
      </div>

      {/* Success/Error Messages */}
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

      {success && (
        <div
          style={{
            backgroundColor: '#E8F5E9',
            color: 'var(--color-green)',
            padding: 'var(--spacing-md)',
            borderRadius: '8px',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid var(--color-green)',
          }}
        >
          Settings saved successfully! Note: Site URL changes may require a page refresh to take
          effect.
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        {/* Site Configuration */}
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-brew-black)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            Site Configuration
          </h2>

          {/* Site URL */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Site URL (FQDN) <span style={{ color: 'var(--color-orange)' }}>*</span>
            </label>
            <input
              type="url"
              value={settings.site_url || ''}
              onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
              placeholder="https://moss.example.com"
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
              }}
            />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Full URL of your M.O.S.S. installation including protocol (e.g.,
              https://moss.example.com). This is used for authentication redirects and URL
              generation. Environment variable NEXTAUTH_URL or NEXT_PUBLIC_SITE_URL takes priority
              over this setting.
            </p>
          </div>

          {/* Timezone */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Default Timezone
            </label>
            <select
              value={settings.timezone || 'UTC'}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New York (EST/EDT)</option>
              <option value="America/Chicago">America/Chicago (CST/CDT)</option>
              <option value="America/Denver">America/Denver (MST/MDT)</option>
              <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Default timezone for date/time display
            </p>
          </div>

          {/* Date Format */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Date Format
            </label>
            <select
              value={settings.date_format || 'YYYY-MM-DD'}
              onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-13)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/13/2025)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (13/10/2025)</option>
              <option value="DD.MM.YYYY">DD.MM.YYYY (13.10.2025)</option>
            </select>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Default date format for display
            </p>
          </div>

          {/* Items Per Page */}
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Items Per Page
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={settings.items_per_page || 50}
              onChange={(e) =>
                setSettings({ ...settings, items_per_page: parseInt(e.target.value) })
              }
              style={{
                width: '200px',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
              }}
            />
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Default number of items to display per page in list views
            </p>
          </div>
        </div>

        {/* Backup Settings */}
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-brew-black)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            Backup Configuration
          </h2>

          {/* Enable Backups */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.backup_enabled || false}
                onChange={(e) => setSettings({ ...settings, backup_enabled: e.target.checked })}
                style={{ marginRight: 'var(--spacing-sm)' }}
              />
              <span style={{ fontWeight: '500', color: 'var(--color-brew-black)' }}>
                Enable Automatic Backups
              </span>
            </label>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
                marginTop: 'var(--spacing-xs)',
                marginLeft: 'calc(var(--spacing-sm) + 16px)',
              }}
            >
              Automatically backup database on a schedule
            </p>
          </div>

          {settings.backup_enabled && (
            <>
              {/* Backup Frequency */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '500',
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--color-brew-black)',
                  }}
                >
                  Backup Frequency
                </label>
                <select
                  value={settings.backup_frequency || 'daily'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backup_frequency: e.target.value as 'daily' | 'weekly',
                    })
                  }
                  style={{
                    width: '200px',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Retention Days */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '500',
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--color-brew-black)',
                  }}
                >
                  Retention Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.backup_retention_days || 30}
                  onChange={(e) =>
                    setSettings({ ...settings, backup_retention_days: parseInt(e.target.value) })
                  }
                  style={{
                    width: '200px',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-brew-black-60)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  Number of days to keep backup files
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base)',
            }}
          >
            Reset
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
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
