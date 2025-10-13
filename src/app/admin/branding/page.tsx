/**
 * Admin Branding Settings Page
 * Configure site branding including colors and logo
 */

'use client'

import React, { useState, useEffect } from 'react'
import type { BrandingSettings } from '@/types'

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<BrandingSettings>({
    site_name: 'M.O.S.S.',
    logo_url: null,
    favicon_url: null,
    primary_color: '#1C7FF2',
    background_color: '#FAF9F5',
    text_color: '#231F20',
    accent_color: '#28C077',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings/branding')
        if (!response.ok) {
          throw new Error('Failed to fetch branding settings')
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
      const response = await fetch('/api/admin/settings/branding', {
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

  const handleColorChange = (field: keyof BrandingSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Branding Settings
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
          Branding Settings
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Customize the appearance of your M.O.S.S. installation
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
          Settings saved successfully!
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
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
            Site Identity
          </h2>

          {/* Site Name */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Site Name
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
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
              The name displayed in the navigation bar and page titles
            </p>
          </div>

          {/* Logo URL */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Logo URL (Optional)
            </label>
            <input
              type="url"
              value={settings.logo_url || ''}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })}
              placeholder="https://example.com/logo.png"
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
              URL to your custom logo image (leave empty to use default)
            </p>
          </div>

          {/* Favicon URL */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--color-brew-black)',
              }}
            >
              Favicon URL (Optional)
            </label>
            <input
              type="url"
              value={settings.favicon_url || ''}
              onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value || null })}
              placeholder="https://example.com/favicon.ico"
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
              URL to your custom favicon (leave empty to use default)
            </p>
          </div>
        </div>

        {/* Color Settings */}
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
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Color Scheme
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-brew-black-60)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            Customize the color palette for your M.O.S.S. installation. These colors will be applied
            site-wide.
          </p>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}
          >
            {/* Primary Color */}
            <ColorPicker
              label="Primary Color"
              value={settings.primary_color}
              onChange={(value) => handleColorChange('primary_color', value)}
              description="Main brand color for buttons and highlights"
            />

            {/* Background Color */}
            <ColorPicker
              label="Background Color"
              value={settings.background_color}
              onChange={(value) => handleColorChange('background_color', value)}
              description="Main background color"
            />

            {/* Text Color */}
            <ColorPicker
              label="Text Color"
              value={settings.text_color}
              onChange={(value) => handleColorChange('text_color', value)}
              description="Primary text color"
            />

            {/* Accent Color */}
            <ColorPicker
              label="Accent Color"
              value={settings.accent_color}
              onChange={(value) => handleColorChange('accent_color', value)}
              description="Secondary accent color"
            />
          </div>
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

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  description: string
}

function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontWeight: '500',
          marginBottom: 'var(--spacing-xs)',
          color: 'var(--color-brew-black)',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '60px',
            height: '40px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#[0-9A-Fa-f]{6}$"
          style={{
            flex: 1,
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'monospace',
          }}
        />
      </div>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-brew-black-60)',
          marginTop: 'var(--spacing-xs)',
        }}
      >
        {description}
      </p>
    </div>
  )
}
