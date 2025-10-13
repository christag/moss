/**
 * Software License Detail Page with Tabs
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SoftwareLicense, Person, Group } from '@/types'
import { JunctionTableManager } from '@/components/JunctionTableManager'

interface LicenseAssignments {
  people: Person[]
  groups: Group[]
  seats_total: number
  seats_assigned: number
  seats_available: number
}

type TabName = 'overview' | 'assignments'

export default function SoftwareLicenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [license, setLicense] = useState<SoftwareLicense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabName>('overview')

  // Assignments tab state
  const [assignments, setAssignments] = useState<LicenseAssignments | null>(null)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/software-licenses/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch license')
        setLicense(result.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Load assignments when tab is selected
  useEffect(() => {
    if (activeTab === 'assignments' && !assignments) {
      loadAssignments()
    }
  }, [activeTab, id])

  const loadAssignments = async () => {
    try {
      setAssignmentsLoading(true)
      setAssignmentsError(null)

      const response = await fetch(`/api/software-licenses/${id}/assignments`)
      if (!response.ok) throw new Error('Failed to fetch assignments')

      const result = await response.json()
      if (!result.success) throw new Error(result.message || 'Failed to fetch assignments')

      setAssignments(result.data)
    } catch (err) {
      setAssignmentsError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setAssignmentsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!license || !confirm(`Are you sure you want to delete this software license?`)) return
    try {
      const response = await fetch(`/api/software-licenses/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete license')
      }
      toast.success('Software license deleted successfully')
      router.push('/software-licenses')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete license')
    }
  }

  const handleAssignPerson = async (person: Person) => {
    const response = await fetch(`/api/software-licenses/${id}/assign-person`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_id: person.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to assign person')
    }

    // Reload assignments
    await loadAssignments()
    // Reload license to update seat counts
    const licenseResponse = await fetch(`/api/software-licenses/${id}`)
    const licenseResult = await licenseResponse.json()
    if (licenseResult.success) {
      setLicense(licenseResult.data)
    }
  }

  const handleUnassignPerson = async (personId: string) => {
    const response = await fetch(`/api/software-licenses/${id}/assign-person/${personId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to unassign person')
    }

    // Reload assignments
    await loadAssignments()
    // Reload license to update seat counts
    const licenseResponse = await fetch(`/api/software-licenses/${id}`)
    const licenseResult = await licenseResponse.json()
    if (licenseResult.success) {
      setLicense(licenseResult.data)
    }
  }

  const handleAssignGroup = async (group: Group) => {
    const response = await fetch(`/api/software-licenses/${id}/assign-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: group.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to assign group')
    }

    // Reload assignments
    await loadAssignments()
  }

  const handleUnassignGroup = async (groupId: string) => {
    const response = await fetch(`/api/software-licenses/${id}/assign-group/${groupId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to unassign group')
    }

    // Reload assignments
    await loadAssignments()
  }

  const formatType = (type: string | null) => {
    if (!type) return '-'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const isExpired = (expirationDate: Date | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  const isExpiringSoon = (expirationDate: Date | null) => {
    if (!expirationDate) return false
    const today = new Date()
    const expiry = new Date(expirationDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90
  }

  if (loading)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )

  if (error || !license)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'License not found'}</div>
          <Link href="/software-licenses" className="btn btn-secondary mt-4">
            Back to Licenses
          </Link>
        </div>
      </div>
    )

  return (
    <>
      <div className="container">
        <div className="p-lg">
          {/* Breadcrumbs */}
          <nav
            className="mb-md"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-black)',
              opacity: 0.6,
              marginBottom: '1rem',
            }}
          >
            <span>
              <Link
                href="/software-licenses"
                style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
              >
                Software Licenses
              </Link>
              <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
            </span>
            <span>{formatType(license.license_type)} License</span>
          </nav>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-h1">{formatType(license.license_type)} License</h1>
              <p className="text-gray-600">
                {license.expiration_date && (
                  <>
                    Expires: {new Date(license.expiration_date).toLocaleDateString()}
                    {isExpired(license.expiration_date) ? (
                      <span className="badge badge-danger ml-2">Expired</span>
                    ) : isExpiringSoon(license.expiration_date) ? (
                      <span className="badge badge-warning ml-2">Expiring Soon</span>
                    ) : null}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/software-licenses/${id}/edit`} className="btn btn-primary">
                Edit
              </Link>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
                onClick={() => setActiveTab('assignments')}
              >
                Assignments
                {assignments && (
                  <span className="ml-2 badge badge-small">
                    {assignments.people.length + assignments.groups.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="card mb-6">
                  <h2 className="text-h3 mb-4">License Information</h2>
                  <div className="grid grid-2 gap-4">
                    <div>
                      <p className="font-bold">License Type</p>
                      <p>{formatType(license.license_type)}</p>
                    </div>
                    <div>
                      <p className="font-bold">Purchase Date</p>
                      <p>
                        {license.purchase_date
                          ? new Date(license.purchase_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">Expiration Date</p>
                      <p>
                        {license.expiration_date
                          ? new Date(license.expiration_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">Renewal Date</p>
                      <p>
                        {license.renewal_date
                          ? new Date(license.renewal_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">Auto Renew</p>
                      <p>{license.auto_renew ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="font-bold">Cost</p>
                      <p>{license.cost ? `$${license.cost}` : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="card mb-6">
                  <h2 className="text-h3 mb-4">Seat Usage</h2>
                  <div className="grid grid-2 gap-4">
                    <div>
                      <p className="font-bold">Seats Purchased</p>
                      <p>{license.seats_purchased || '-'}</p>
                    </div>
                    <div>
                      <p className="font-bold">Seats Assigned</p>
                      <p>{license.seats_assigned || 0}</p>
                    </div>
                    <div>
                      <p className="font-bold">Available Seats</p>
                      <p>
                        {license.seats_purchased
                          ? license.seats_purchased - (license.seats_assigned || 0)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">Utilization</p>
                      <p>
                        {license.seats_purchased && license.seats_purchased > 0
                          ? `${Math.round(((license.seats_assigned || 0) / license.seats_purchased) * 100)}%`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {license.license_key && (
                  <div className="card mb-6">
                    <h2 className="text-h3 mb-4">License Key</h2>
                    <pre className="p-4 bg-gray-100 rounded font-mono text-sm overflow-x-auto">
                      {license.license_key}
                    </pre>
                  </div>
                )}

                {license.notes && (
                  <div className="card mb-6">
                    <h2 className="text-h3 mb-4">Notes</h2>
                    <p className="whitespace-pre-wrap">{license.notes}</p>
                  </div>
                )}

                <div className="card">
                  <h2 className="text-h3 mb-4">System Information</h2>
                  <div className="grid grid-2 gap-4">
                    <div>
                      <p className="font-bold">Created</p>
                      <p>{new Date(license.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-bold">Last Updated</p>
                      <p>{new Date(license.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="assignments-tab">
                {assignmentsLoading && (
                  <div className="loading-spinner">Loading assignments...</div>
                )}

                {assignmentsError && <div className="error-message mb-4">{assignmentsError}</div>}

                {assignments && (
                  <>
                    {/* Seat availability summary */}
                    <div className="card mb-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-h4 mb-2">Seat Availability</h3>
                          <p className="text-gray-600">
                            {assignments.seats_assigned} of {assignments.seats_total} seats assigned
                            ({assignments.seats_available} available)
                          </p>
                        </div>
                        <div className="seat-progress">
                          <div className="seat-progress-bar">
                            <div
                              className="seat-progress-fill"
                              style={{
                                width: `${assignments.seats_total > 0 ? (assignments.seats_assigned / assignments.seats_total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignments.seats_total > 0
                              ? `${Math.round((assignments.seats_assigned / assignments.seats_total) * 100)}%`
                              : '0%'}{' '}
                            utilized
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned People */}
                    <div className="card mb-6">
                      <h3 className="text-h4 mb-4">Assigned to People</h3>
                      <JunctionTableManager<Person>
                        currentItems={assignments.people}
                        availableItemsEndpoint="/api/people?limit=200&sort_by=full_name&sort_order=asc"
                        getItemLabel={(person) =>
                          `${person.full_name}${person.email ? ` (${person.email})` : ''}`
                        }
                        onAdd={handleAssignPerson}
                        onRemove={handleUnassignPerson}
                        placeholder="Search people to assign..."
                        emptyMessage="No people assigned to this license"
                        disabled={assignments.seats_available <= 0}
                      />
                      {assignments.seats_available <= 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                          No available seats. Remove assignments or purchase more seats to assign to
                          additional people.
                        </p>
                      )}
                    </div>

                    {/* Assigned Groups */}
                    <div className="card">
                      <h3 className="text-h4 mb-4">Assigned to Groups</h3>
                      <JunctionTableManager<Group>
                        currentItems={assignments.groups}
                        availableItemsEndpoint="/api/groups?limit=200&sort_by=group_name&sort_order=asc"
                        getItemLabel={(group) =>
                          `${group.group_name}${group.group_type ? ` (${group.group_type})` : ''}`
                        }
                        onAdd={handleAssignGroup}
                        onRemove={handleUnassignGroup}
                        placeholder="Search groups to assign..."
                        emptyMessage="No groups assigned to this license"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Group-based licenses provide access to all members of the group. Individual
                        seat usage is tracked separately above.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .tabs-container {
          border-bottom: 2px solid var(--color-brew-black-60, #ddd);
          margin-bottom: 2rem;
        }

        .tabs {
          display: flex;
          gap: 1rem;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-brew-black-60, #666);
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab:hover {
          color: var(--color-morning-blue, #1c7ff2);
        }

        .tab.active {
          color: var(--color-morning-blue, #1c7ff2);
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-morning-blue, #1c7ff2);
        }

        .badge-small {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: var(--color-morning-blue, #1c7ff2);
          color: white;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tab-content {
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .seat-progress {
          min-width: 300px;
        }

        .seat-progress-bar {
          width: 100%;
          height: 24px;
          background: var(--color-light-blue, #acd7ff);
          border-radius: 12px;
          overflow: hidden;
        }

        .seat-progress-fill {
          height: 100%;
          background: var(--color-morning-blue, #1c7ff2);
          transition: width 0.3s ease;
        }

        .loading-spinner {
          padding: 2rem;
          text-align: center;
          color: var(--color-brew-black-60, #666);
        }

        .error-message {
          padding: 1rem;
          background: #fee;
          border: 1px solid var(--color-orange, #fd6a3d);
          border-radius: 4px;
          color: #c00;
        }
      `}</style>
    </>
  )
}
