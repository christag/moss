/**
 * Role Detail Page
 * Shows role information and permission grid
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import PermissionGrid from '@/components/PermissionGrid'
import type { Role } from '@/types'

interface PermissionWithSource {
  id: string
  permission_name: string
  object_type: string
  action: string
  is_inherited?: boolean
  inherited_from_role_name?: string
}

export default function RoleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<PermissionWithSource[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRole()
    fetchPermissions()
  }, [roleId])

  const fetchRole = async () => {
    try {
      const response = await fetch(`/api/roles/${roleId}`)
      const data = await response.json()

      if (data.success) {
        setRole(data.data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to fetch role')
      console.error(err)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions?include_inherited=true`)
      const data = await response.json()

      if (data.success) {
        setPermissions(data.data)
        setSelectedPermissions(
          data.data
            .filter((p: PermissionWithSource) => !p.is_inherited)
            .map((p: PermissionWithSource) => p.id)
        )
      }
    } catch (err) {
      console.error('Error fetching permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: selectedPermissions }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Permissions updated successfully')
        fetchPermissions()
      } else {
        alert(data.message || 'Failed to update permissions')
      }
    } catch (err) {
      alert('An error occurred')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error || !role) {
    return <div style={{ color: 'var(--color-orange)' }}>Error: {error || 'Role not found'}</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
              {role.role_name}
            </h1>
            <p style={{ color: 'var(--color-brew-black-60)' }}>
              {role.description || 'No description'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button variant="secondary" onClick={() => router.push('/admin/rbac/roles')}>
              ← Back to Roles
            </Button>
            {!role.is_system_role && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/admin/rbac/roles/${roleId}/edit`)}
              >
                Edit Role
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          {role.is_system_role ? (
            <Badge variant="blue">System Role</Badge>
          ) : (
            <Badge variant="default">Custom Role</Badge>
          )}
          {role.parent_role_id && (
            <span style={{ color: 'var(--color-brew-black-60)' }}>
              Inherits from:{' '}
              <span
                style={{ color: 'var(--color-morning-blue)', cursor: 'pointer' }}
                onClick={() => router.push(`/admin/rbac/roles/${role.parent_role_id}`)}
              >
                Parent Role
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Permission Grid */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Permissions</h2>
          {!role.is_system_role && (
            <Button variant="primary" onClick={handleSavePermissions} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          )}
        </div>

        <PermissionGrid
          roleId={roleId}
          selectedPermissions={selectedPermissions}
          onChange={setSelectedPermissions}
          disabled={role.is_system_role}
          showInherited={!!role.parent_role_id}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Statistics</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          <div>
            <div
              style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-morning-blue)' }}
            >
              {selectedPermissions.length}
            </div>
            <div style={{ color: 'var(--color-brew-black-60)' }}>Direct Permissions</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-green)' }}>
              {permissions.filter((p) => p.is_inherited).length}
            </div>
            <div style={{ color: 'var(--color-brew-black-60)' }}>Inherited Permissions</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-brew-black)' }}>
              {permissions.length}
            </div>
            <div style={{ color: 'var(--color-brew-black-60)' }}>Total Permissions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
