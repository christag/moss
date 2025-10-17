/**
 * Roles List Page
 * Lists all roles with actions to create, edit, and delete
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Icon } from '@/components/ui'
import type { Role } from '@/types'

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      const data = await response.json()

      if (data.success) {
        setRoles(data.data)
      } else {
        setError(data.message || 'Failed to fetch roles')
      }
    } catch (err) {
      setError('An error occurred while fetching roles')
      console.error('Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setRoles(roles.filter((role) => role.id !== id))
        alert('Role deleted successfully')
      } else {
        alert(data.message || 'Failed to delete role')
      }
    } catch (err) {
      alert('An error occurred while deleting the role')
      console.error('Error deleting role:', err)
    }
  }

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Roles
        </h1>
        <p>Loading roles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Roles
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
            Roles
          </h1>
          <p style={{ color: 'var(--color-brew-black-60)' }}>Manage roles and their permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" onClick={() => router.push('/admin/rbac/hierarchy')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="hierarchy-network" size={16} aria-label="Hierarchy" />
              View Hierarchy
            </span>
          </Button>
          <Button variant="primary" onClick={() => router.push('/admin/rbac/roles/new')}>
            + Create Role
          </Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: 'var(--spacing-md)',
            border: '1px solid var(--color-brew-black-20)',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Roles Table */}
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
                Role Name
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Description
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Type
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600' }}>
                Parent Role
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: '600' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  {searchQuery ? 'No roles found matching your search' : 'No roles available'}
                </td>
              </tr>
            ) : (
              filteredRoles.map((role, index) => (
                <tr
                  key={role.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'var(--color-off-white)' : '#fff',
                    borderTop: '1px solid var(--color-brew-black-20)',
                  }}
                >
                  <td
                    style={{
                      padding: 'var(--spacing-md)',
                      fontWeight: '600',
                      color: 'var(--color-morning-blue)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/admin/rbac/roles/${role.id}`)}
                  >
                    {role.role_name}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-brew-black-60)' }}>
                    {role.description || '—'}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    {role.is_system_role ? (
                      <Badge variant="blue">System</Badge>
                    ) : (
                      <Badge variant="default">Custom</Badge>
                    )}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-brew-black-60)' }}>
                    {role.parent_role_id ? (
                      <span
                        style={{ color: 'var(--color-morning-blue)', cursor: 'pointer' }}
                        onClick={() => router.push(`/admin/rbac/roles/${role.parent_role_id}`)}
                      >
                        {roles.find((r) => r.id === role.parent_role_id)?.role_name || 'Unknown'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/admin/rbac/roles/${role.id}`)}
                      >
                        View
                      </Button>
                      {!role.is_system_role && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => router.push(`/admin/rbac/roles/${role.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(role.id, role.role_name)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
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
        Showing {filteredRoles.length} of {roles.length} roles
      </div>
    </div>
  )
}
