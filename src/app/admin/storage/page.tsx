/**
 * Admin Storage Settings Page
 * Configure file storage backend (local, NFS/SMB, S3)
 */

'use client'

import React, { useState, useEffect } from 'react'
import type { StorageSettings } from '@/types'

export default function StorageSettingsPage() {
  const [settings, setSettings] = useState<StorageSettings>({
    backend: 'local',
    local_path: '/var/moss/uploads',
    s3_bucket: null,
    s3_region: null,
    s3_access_key: null,
    s3_secret_key: null,
    s3_endpoint: null,
    nfs_host: null,
    nfs_path: null,
    nfs_options: null,
    smb_host: null,
    smb_share: null,
    smb_username: null,
    smb_password: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings/storage')
        if (!response.ok) throw new Error('Failed to fetch storage settings')
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
      const response = await fetch('/api/admin/settings/storage', {
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
        <h1 style={{ fontSize: '2rem', fontWeight: '600' }}>Storage Settings</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Storage Settings
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Configure file storage backend for uploads and attachments
        </p>
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

      <form onSubmit={handleSubmit}>
        {/* Backend Selection */}
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
            Storage Backend
          </h2>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
            >
              Backend Type
            </label>
            <select
              value={settings.backend}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  backend: e.target.value as 'local' | 's3' | 'nfs' | 'smb',
                })
              }
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="local">Local Filesystem</option>
              <option value="s3">Amazon S3 / Compatible</option>
              <option value="nfs">NFS Share</option>
              <option value="smb">SMB/CIFS Share</option>
            </select>
          </div>

          {/* Local Storage Settings */}
          {settings.backend === 'local' && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
              >
                Local Path
              </label>
              <input
                type="text"
                value={settings.local_path || ''}
                onChange={(e) => setSettings({ ...settings, local_path: e.target.value })}
                placeholder="/var/moss/uploads"
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
                Directory path where uploaded files will be stored
              </p>
            </div>
          )}

          {/* S3 Settings */}
          {settings.backend === 's3' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '500',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    Bucket Name
                  </label>
                  <input
                    type="text"
                    value={settings.s3_bucket || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, s3_bucket: e.target.value || null })
                    }
                    placeholder="my-bucket"
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
                    Region
                  </label>
                  <input
                    type="text"
                    value={settings.s3_region || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, s3_region: e.target.value || null })
                    }
                    placeholder="us-east-1"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '500',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    Access Key
                  </label>
                  <input
                    type="text"
                    value={settings.s3_access_key || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, s3_access_key: e.target.value || null })
                    }
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
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={settings.s3_secret_key || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, s3_secret_key: e.target.value || null })
                    }
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* NFS Settings */}
          {settings.backend === 'nfs' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <div>
                <label
                  style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
                >
                  NFS Host
                </label>
                <input
                  type="text"
                  value={settings.nfs_host || ''}
                  onChange={(e) => setSettings({ ...settings, nfs_host: e.target.value || null })}
                  placeholder="192.168.1.100"
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
                  style={{ display: 'block', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}
                >
                  NFS Path
                </label>
                <input
                  type="text"
                  value={settings.nfs_path || ''}
                  onChange={(e) => setSettings({ ...settings, nfs_path: e.target.value || null })}
                  placeholder="/exports/moss"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          )}

          {/* SMB Settings */}
          {settings.backend === 'smb' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '500',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    SMB Host
                  </label>
                  <input
                    type="text"
                    value={settings.smb_host || ''}
                    onChange={(e) => setSettings({ ...settings, smb_host: e.target.value || null })}
                    placeholder="fileserver.local"
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
                    Share Name
                  </label>
                  <input
                    type="text"
                    value={settings.smb_share || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, smb_share: e.target.value || null })
                    }
                    placeholder="moss"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-md)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '500',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.smb_username || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, smb_username: e.target.value || null })
                    }
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
                    Password
                  </label>
                  <input
                    type="password"
                    value={settings.smb_password || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, smb_password: e.target.value || null })
                    }
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

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
