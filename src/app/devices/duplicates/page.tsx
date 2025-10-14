/**
 * Device Duplicates Dashboard
 *
 * Shows all devices in the system that have potential duplicates
 * for easy review and cleanup
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DeviceWithDuplicates {
  device_id: string
  hostname: string | null
  match_count: number
  highest_confidence: number
}

export default function DeviceDuplicatesDashboard() {
  const router = useRouter()
  const [devices, setDevices] = useState<DeviceWithDuplicates[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDevicesWithDuplicates()
  }, [])

  const loadDevicesWithDuplicates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/devices/duplicates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load devices with duplicates')
      }

      setDevices(data.data.devices || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 95) return '#dc2626' // definite
    if (confidence >= 80) return '#ea580c' // high
    if (confidence >= 60) return '#ca8a04' // medium
    return '#9ca3af' // low
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 95) return 'Definite'
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <h1>Device Duplicates</h1>
          <p>Loading devices with potential duplicates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="p-lg">
          <h1>Device Duplicates</h1>
          <div style={{ color: 'var(--color-orange)', marginTop: '1rem' }}>Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <nav
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-black)',
              opacity: 0.6,
              marginBottom: '1rem',
            }}
          >
            <Link href="/devices" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
              Devices
            </Link>
            <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
            <span>Potential Duplicates</span>
          </nav>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem' }}>Device Duplicates</h1>
              <p style={{ margin: 0, color: 'var(--color-brew-black-60)' }}>
                {devices.length > 0
                  ? `Found ${devices.length} device${devices.length !== 1 ? 's' : ''} with potential duplicates`
                  : 'No devices with potential duplicates found'}
              </p>
            </div>
            <button
              onClick={() => router.push('/devices')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--color-morning-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Devices
            </button>
          </div>
        </div>

        {/* Info Banner */}
        {devices.length > 0 && (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem',
              color: '#92400e',
            }}
          >
            <strong>⚠ Duplicate Detection</strong>
            <p style={{ margin: '0.5rem 0 0', fontSize: '14px' }}>
              These devices have potential duplicates based on serial numbers, asset tags, MAC
              addresses, or other identifying information. Click on a device to review and manage
              its duplicates.
            </p>
          </div>
        )}

        {/* Empty State */}
        {devices.length === 0 ? (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              color: '#166534',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '20px' }}>No Duplicates Found</h2>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
              All devices have unique identifiers. Great job keeping your data clean!
            </p>
          </div>
        ) : (
          /* Devices List */
          <div style={{ display: 'grid', gap: '1rem' }}>
            {devices.map((device) => (
              <Link
                key={device.device_id}
                href={`/devices/${device.device_id}?tab=duplicates`}
                style={{
                  display: 'block',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-morning-blue)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {device.hostname || 'Unknown Hostname'}
                      </h3>
                      <span
                        style={{
                          background: getConfidenceBadgeColor(device.highest_confidence),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {getConfidenceLabel(device.highest_confidence)} ({device.highest_confidence}
                        %)
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-brew-black-60)' }}>
                      {device.match_count} potential duplicate{device.match_count !== 1 ? 's' : ''}{' '}
                      found
                    </p>
                  </div>
                  <div
                    style={{
                      color: 'var(--color-morning-blue)',
                      fontSize: '24px',
                    }}
                  >
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
