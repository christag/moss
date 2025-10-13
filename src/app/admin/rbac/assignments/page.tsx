/**
 * Role Assignments Page
 * Lists all role assignments with filtering and management
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import AssignRoleModal from '@/components/AssignRoleModal'

interface RoleAssignment {
  id: string
  role_id: string
  role_name: string
  person_id?: string
  person_name?: string
  person_email?: string
  group_id?: string
  group_name?: string
  scope: 'global' | 'location' | 'specific_objects'
  locations?: Array<{ id: string; location_name: string }>
  granted_by_name?: string
  created_at: string
}

export default function RoleAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<RoleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scopeFilter, setScopeFilter] = useState<string>('')
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [scopeFilter])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (scopeFilter) params.append('scope', scopeFilter)

      const response = await fetch(`/api/role-assignments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssignments(data.data)
      } else {
        setError(data.message || 'Failed to fetch assignments')
      }
    } catch (err) {
      setError('An error occurred while fetching assignments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string, assigneeName: string) => {
    if (!confirm(`Are you sure you want to revoke this role assignment for ${assigneeName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/role-assignments/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setAssignments(assignments.filter((a) => a.id !== id))
        alert('Role assignment revoked successfully')
      } else {
        alert(data.message || 'Failed to revoke assignment')
      }
    } catch (err) {
      alert('An error occurred')
      console.error(err)
    }
  }

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'global':
        return <Badge variant="green">Global</Badge>
      case 'location':
        return <Badge variant="blue">Location</Badge>
      case 'specific_objects':
        return <Badge variant="default">Specific Objects</Badge>
      default:
        return <Badge variant="default">{scope}</Badge>
    }
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Role Assignments
        </h1>
        <p>Loading assignments...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Role Assignments
        </h1>
        <div
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-brew-black)',
            padding: 'var(--spacing-lg)',
            borderRadius: '8px',
          }}
        >
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
            Role Assignments
          </h1>
          <p style={{ color: 'var(--color-brew-black-60)' }}>
            Manage who has which roles and their scope
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAssignModal(true)}>
          + Assign Role
        </Button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
        <div>
          <label
            htmlFor="scope-filter"
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-xs)',
              fontSize: '0.875rem',
            }}
          >
            Filter by Scope
          </label>
          <select
            id="scope-filter"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            style={{
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-brew-black-20)',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'var(--color-off-white)',
            }}
          >
            <option value="">All Scopes</option>
            <option value="global">Global</option>
            <option value="location">Location</option>
            <option value="specific_objects">Specific Objects</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          border: '1px solid var(--color-brew-black-20)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-brew-black)',
                color: 'var(--color-off-white)',
              }}
            >
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Assignee
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Role
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Scope
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Locations
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Granted By
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: '600' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  No role assignments found
                </td>
              </tr>
            ) : (
              assignments.map((assignment, index) => (
                <tr
                  key={assignment.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'var(--color-off-white)' : '#fff',
                    borderTop: '1px solid var(--color-brew-black-20)',
                  }}
                >
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    {assignment.person_id ? (
                      <div>
                        <div style={{ fontWeight: '600' }}>{assignment.person_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                          {assignment.person_email}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '600' }}>{assignment.group_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                          Group
                        </div>
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--color-morning-blue)',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/admin/rbac/roles/${assignment.role_id}`)}
                  >
                    {assignment.role_name}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    {getScopeBadge(assignment.scope)}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-brew-black-60)' }}>
                    {assignment.locations && assignment.locations.length > 0
                      ? assignment.locations.map((loc) => loc.location_name).join(', ')
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--color-brew-black-60)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {assignment.granted_by_name || 'System'}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button variant="secondary" onClick={() => alert('Edit coming soon!')}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleRevoke(
                            assignment.id,
                            assignment.person_name || assignment.group_name || 'Unknown'
                          )
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 'var(--spacing-lg)', color: 'var(--color-brew-black-60)' }}>
        Showing {assignments.length} role assignment{assignments.length !== 1 ? 's' : ''}
      </div>

      {/* Assign Role Modal */}
      <AssignRoleModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => fetchAssignments()}
      />
    </div>
  )
}
