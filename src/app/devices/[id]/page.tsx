/**
 * Device Detail Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Device, DeviceType, Company, Location, Room, Person } from '@/types'

// Helper function to format device type
function formatDeviceType(type: DeviceType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to format date
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function DeviceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [device, setDevice] = useState<Device | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [assignedTo, setAssignedTo] = useState<Person | null>(null)
  const [parentDevice, setParentDevice] = useState<Device | null>(null)
  const [childDevices, setChildDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!id) return

    const fetchDevice = async () => {
      try {
        const response = await fetch(`/api/devices/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch device')
        }
        const result = await response.json()
        setDevice(result.data)

        // Fetch related data
        if (result.data.company_id) {
          const companyResponse = await fetch(`/api/companies/${result.data.company_id}`)
          if (companyResponse.ok) {
            const companyResult = await companyResponse.json()
            setCompany(companyResult.data)
          }
        }

        if (result.data.location_id) {
          const locationResponse = await fetch(`/api/locations/${result.data.location_id}`)
          if (locationResponse.ok) {
            const locationResult = await locationResponse.json()
            setLocation(locationResult.data)
          }
        }

        if (result.data.room_id) {
          const roomResponse = await fetch(`/api/rooms/${result.data.room_id}`)
          if (roomResponse.ok) {
            const roomResult = await roomResponse.json()
            setRoom(roomResult.data)
          }
        }

        if (result.data.assigned_to_id) {
          const personResponse = await fetch(`/api/people/${result.data.assigned_to_id}`)
          if (personResponse.ok) {
            const personResult = await personResponse.json()
            setAssignedTo(personResult.data)
          }
        }

        if (result.data.parent_device_id) {
          const parentResponse = await fetch(`/api/devices/${result.data.parent_device_id}`)
          if (parentResponse.ok) {
            const parentResult = await parentResponse.json()
            setParentDevice(parentResult.data)
          }
        }

        // Fetch child devices
        const childrenResponse = await fetch(`/api/devices?parent_device_id=${id}`)
        if (childrenResponse.ok) {
          const childrenResult = await childrenResponse.json()
          setChildDevices(childrenResult.data?.devices || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDevice()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this device?')) return

    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.message || 'Failed to delete device')
        return
      }

      router.push('/devices')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Device not found'}</div>
          <button onClick={() => router.push('/devices')}>Back to Devices</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        {/* Breadcrumbs */}
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/devices" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Devices
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>{device.hostname || device.serial_number || 'Device'}</span>
        </nav>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div>
            <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>
              {device.hostname || device.serial_number || 'Unnamed Device'}
            </h1>
            <div
              style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-black)', opacity: 0.7 }}
            >
              {formatDeviceType(device.device_type)}
              {device.manufacturer && ` - ${device.manufacturer}`}
              {device.model && ` ${device.model}`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={() => router.push(`/devices/${id}/edit`)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-blue)',
                color: 'var(--color-off-white)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-off-white)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              borderBottom: '2px solid var(--color-border)',
            }}
          >
            {['overview', 'hardware', 'assignment', 'dates'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--color-blue)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? 'var(--color-blue)' : 'var(--color-black)',
                  marginBottom: '-2px',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Basic Information</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Hostname:</dt>
                <dd>{device.hostname || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Device Type:</dt>
                <dd>{formatDeviceType(device.device_type)}</dd>

                <dt style={{ fontWeight: '600' }}>Status:</dt>
                <dd>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor:
                        device.status === 'active'
                          ? '#28C077'
                          : device.status === 'retired'
                            ? 'rgba(35, 31, 32, 0.4)'
                            : device.status === 'repair'
                              ? '#FD6A3D'
                              : '#ACD7FF',
                      color: device.status === 'storage' ? '#231F20' : '#FAF9F5',
                    }}
                  >
                    {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                  </span>
                </dd>

                <dt style={{ fontWeight: '600' }}>Asset Tag:</dt>
                <dd>{device.asset_tag || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Operating System:</dt>
                <dd>{device.operating_system || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>OS Version:</dt>
                <dd>{device.os_version || '—'}</dd>
              </dl>
            </div>

            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Assignment</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Assigned To:</dt>
                <dd>
                  {assignedTo ? (
                    <Link
                      href={`/people/${assignedTo.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {assignedTo.full_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Company:</dt>
                <dd>
                  {company ? (
                    <Link
                      href={`/companies/${company.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {company.company_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Location:</dt>
                <dd>
                  {location ? (
                    <Link
                      href={`/locations/${location.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {location.location_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Room:</dt>
                <dd>
                  {room ? (
                    <Link
                      href={`/rooms/${room.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {room.room_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Parent Device:</dt>
                <dd>
                  {parentDevice ? (
                    <Link
                      href={`/devices/${parentDevice.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {parentDevice.hostname || parentDevice.serial_number || 'Parent Device'}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Child Devices:</dt>
                <dd>{childDevices.length}</dd>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'hardware' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Hardware Details</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Manufacturer:</dt>
                <dd>{device.manufacturer || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Model:</dt>
                <dd>{device.model || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Serial Number:</dt>
                <dd>{device.serial_number || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Asset Tag:</dt>
                <dd>{device.asset_tag || '—'}</dd>
              </dl>
            </div>

            {device.notes && (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Notes</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{device.notes}</p>
              </div>
            )}

            {childDevices.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
                  Child Devices ({childDevices.length})
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {childDevices.map((child) => (
                    <li
                      key={child.id}
                      style={{
                        padding: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-sm)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                      }}
                    >
                      <Link
                        href={`/devices/${child.id}`}
                        style={{
                          color: 'var(--color-blue)',
                          textDecoration: 'none',
                          fontWeight: '600',
                        }}
                      >
                        {child.hostname || child.serial_number || 'Unnamed Device'}
                      </Link>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-black)',
                          opacity: 0.7,
                        }}
                      >
                        {formatDeviceType(child.device_type)}
                        {child.model && ` - ${child.model}`}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignment' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Assignment Information</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Assigned To:</dt>
                <dd>
                  {assignedTo ? (
                    <Link
                      href={`/people/${assignedTo.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {assignedTo.full_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Company:</dt>
                <dd>
                  {company ? (
                    <Link
                      href={`/companies/${company.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {company.company_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Location:</dt>
                <dd>
                  {location ? (
                    <Link
                      href={`/locations/${location.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {location.location_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Room:</dt>
                <dd>
                  {room ? (
                    <Link
                      href={`/rooms/${room.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {room.room_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
            </div>

            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Device Hierarchy</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Parent Device:</dt>
                <dd>
                  {parentDevice ? (
                    <Link
                      href={`/devices/${parentDevice.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {parentDevice.hostname || parentDevice.serial_number || 'Parent Device'}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Child Devices:</dt>
                <dd>{childDevices.length}</dd>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'dates' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Important Dates</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Purchase Date:</dt>
                <dd>{formatDate(device.purchase_date)}</dd>

                <dt style={{ fontWeight: '600' }}>Warranty Expires:</dt>
                <dd>{formatDate(device.warranty_expiration)}</dd>

                <dt style={{ fontWeight: '600' }}>Install Date:</dt>
                <dd>{formatDate(device.install_date)}</dd>

                <dt style={{ fontWeight: '600' }}>Last Audit:</dt>
                <dd>{formatDate(device.last_audit_date)}</dd>

                <dt style={{ fontWeight: '600' }}>Created:</dt>
                <dd>{formatDate(device.created_at)}</dd>

                <dt style={{ fontWeight: '600' }}>Last Updated:</dt>
                <dd>{formatDate(device.updated_at)}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
