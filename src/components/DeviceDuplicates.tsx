/**
 * Device Duplicates Component
 *
 * Shows potential duplicate devices with confidence scoring
 * and allows user to review and delete duplicates
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface DeviceMatch {
  device_id: string
  hostname: string | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  asset_tag: string | null
  confidence: number
  confidence_level: 'definite' | 'high' | 'medium' | 'low'
  matching_fields: string[]
  match_reason: string
}

interface DuplicateResult {
  device_id: string
  has_matches: boolean
  match_count: number
  highest_confidence: number | null
  matches: DeviceMatch[]
}

interface DeviceDuplicatesProps {
  deviceId: string
  onDelete?: () => void
}

export function DeviceDuplicates({ deviceId, onDelete }: DeviceDuplicatesProps) {
  const [result, setResult] = useState<DuplicateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadDuplicates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const loadDuplicates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/devices/${deviceId}/duplicates`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load duplicates')
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load duplicates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (duplicateDeviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(duplicateDeviceId)
      const response = await fetch(`/api/devices/${duplicateDeviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete device')
      }

      // Reload duplicates
      await loadDuplicates()
      if (onDelete) onDelete()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete device')
    } finally {
      setDeleting(null)
    }
  }

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'definite':
        return '#dc2626' // red-600
      case 'high':
        return '#ea580c' // orange-600
      case 'medium':
        return '#ca8a04' // yellow-600
      case 'low':
        return '#9ca3af' // gray-400
      default:
        return '#6b7280'
    }
  }

  const getConfidenceBadgeLabel = (level: string) => {
    switch (level) {
      case 'definite':
        return 'Definite Match'
      case 'high':
        return 'High Confidence'
      case 'medium':
        return 'Medium Confidence'
      case 'low':
        return 'Low Confidence'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Searching for duplicates...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-orange)' }}>
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!result || !result.has_matches) {
    return (
      <div style={{ padding: '2rem' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '1rem',
            color: '#166534',
          }}
        >
          ✓ No potential duplicates found for this device
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#92400e',
        }}
      >
        <strong>⚠ {result.match_count} potential duplicate(s) found</strong>
        <p style={{ margin: '0.5rem 0 0', fontSize: '14px' }}>
          Review these matches and delete duplicates to clean up your data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {result.matches.map((match) => (
          <div
            key={match.device_id}
            style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              background: 'white',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {match.hostname || 'Unknown Hostname'}
                  </h3>
                  <span
                    style={{
                      background: getConfidenceBadgeColor(match.confidence_level),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {getConfidenceBadgeLabel(match.confidence_level)} ({match.confidence}%)
                  </span>
                </div>
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    fontSize: '14px',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  {match.match_reason}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  Manufacturer
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '14px' }}>
                  {match.manufacturer || '—'}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  Model
                </label>
                <p style={{ margin: '0.25rem 0 0', fontSize: '14px' }}>{match.model || '—'}</p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  Serial Number
                </label>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '14px',
                    fontWeight: match.matching_fields.includes('serial_number') ? 600 : 400,
                    color: match.matching_fields.includes('serial_number')
                      ? 'var(--color-orange)'
                      : 'inherit',
                  }}
                >
                  {match.serial_number || '—'}
                  {match.matching_fields.includes('serial_number') && ' ⚠'}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  Asset Tag
                </label>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '14px',
                    fontWeight: match.matching_fields.includes('asset_tag') ? 600 : 400,
                    color: match.matching_fields.includes('asset_tag')
                      ? 'var(--color-orange)'
                      : 'inherit',
                  }}
                >
                  {match.asset_tag || '—'}
                  {match.matching_fields.includes('asset_tag') && ' ⚠'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href={`/devices/${match.device_id}`}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-morning-blue)',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                View Device
              </Link>
              <button
                onClick={() => handleDelete(match.device_id)}
                disabled={deleting === match.device_id}
                style={{
                  padding: '0.5rem 1rem',
                  background: deleting === match.device_id ? '#d1d5db' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deleting === match.device_id ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting === match.device_id ? 'Deleting...' : 'Delete Duplicate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
