/**
 * Person Detail Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Person, Company, Location, PersonType } from '@/types'

// Helper function to format person type
function formatPersonType(type: PersonType): string {
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

export default function PersonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [manager, setManager] = useState<Person | null>(null)
  const [directReports, setDirectReports] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!id) return

    const fetchPerson = async () => {
      try {
        const response = await fetch(`/api/people/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch person')
        }
        const result = await response.json()
        setPerson(result.data)

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

        if (result.data.manager_id) {
          const managerResponse = await fetch(`/api/people/${result.data.manager_id}`)
          if (managerResponse.ok) {
            const managerResult = await managerResponse.json()
            setManager(managerResult.data)
          }
        }

        // Fetch direct reports
        const reportsResponse = await fetch(`/api/people?manager_id=${id}`)
        if (reportsResponse.ok) {
          const reportsResult = await reportsResponse.json()
          setDirectReports(reportsResult.data?.people || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPerson()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this person?')) return

    try {
      const response = await fetch(`/api/people/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.message || 'Failed to delete person')
        return
      }

      router.push('/people')
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

  if (error || !person) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Person not found'}</div>
          <button onClick={() => router.push('/people')}>Back to People</button>
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
          <Link href="/people" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            People
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>{person.full_name}</span>
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
            <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>{person.full_name}</h1>
            <div
              style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-black)', opacity: 0.7 }}
            >
              {person.job_title || formatPersonType(person.person_type)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={() => router.push(`/people/${id}/edit`)}
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
            {['overview', 'organization', 'contact'].map((tab) => (
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
                <dt style={{ fontWeight: '600' }}>Employee ID:</dt>
                <dd>{person.employee_id || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Type:</dt>
                <dd>{formatPersonType(person.person_type)}</dd>

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
                        person.status === 'active'
                          ? '#28C077'
                          : person.status === 'inactive'
                            ? '#ACD7FF'
                            : '#FD6A3D',
                      color: person.status === 'inactive' ? '#231F20' : '#FAF9F5',
                    }}
                  >
                    {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
                  </span>
                </dd>

                <dt style={{ fontWeight: '600' }}>Department:</dt>
                <dd>{person.department || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Job Title:</dt>
                <dd>{person.job_title || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Start Date:</dt>
                <dd>{formatDate(person.start_date)}</dd>
              </dl>
            </div>

            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Organization</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
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

                <dt style={{ fontWeight: '600' }}>Manager:</dt>
                <dd>
                  {manager ? (
                    <Link
                      href={`/people/${manager.id}`}
                      style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                    >
                      {manager.full_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Direct Reports:</dt>
                <dd>{directReports.length}</dd>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'organization' && (
          <div>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
              Direct Reports ({directReports.length})
            </h3>
            {directReports.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {directReports.map((report) => (
                  <li
                    key={report.id}
                    style={{
                      padding: 'var(--spacing-sm)',
                      marginBottom: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  >
                    <Link
                      href={`/people/${report.id}`}
                      style={{
                        color: 'var(--color-blue)',
                        textDecoration: 'none',
                        fontWeight: '600',
                      }}
                    >
                      {report.full_name}
                    </Link>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-black)',
                        opacity: 0.7,
                      }}
                    >
                      {report.job_title || formatPersonType(report.person_type)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--color-black)', opacity: 0.6 }}>No direct reports</p>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Contact Information</h3>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <dt style={{ fontWeight: '600' }}>Email:</dt>
                <dd>
                  {person.email ? (
                    <a href={`mailto:${person.email}`} style={{ color: 'var(--color-blue)' }}>
                      {person.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Phone:</dt>
                <dd>
                  {person.phone ? (
                    <a href={`tel:${person.phone}`} style={{ color: 'var(--color-blue)' }}>
                      {person.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Mobile:</dt>
                <dd>
                  {person.mobile ? (
                    <a href={`tel:${person.mobile}`} style={{ color: 'var(--color-blue)' }}>
                      {person.mobile}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt style={{ fontWeight: '600' }}>Username:</dt>
                <dd>{person.username || '—'}</dd>

                <dt style={{ fontWeight: '600' }}>Preferred Contact:</dt>
                <dd>{person.preferred_contact_method || '—'}</dd>
              </dl>
            </div>

            {person.notes && (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Notes</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{person.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
