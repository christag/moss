/**
 * Role Form Component
 * Shared form for creating and editing roles
 */

'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'
import type { Role } from '@/types'

interface RoleFormProps {
  role?: Role // If provided, form is in edit mode
  onSubmit: (data: RoleFormData) => Promise<void>
  onCancel: () => void
}

export interface RoleFormData {
  role_name: string
  description: string | null
  parent_role_id: string | null
}

export default function RoleForm({ role, onSubmit, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    role_name: role?.role_name || '',
    description: role?.description || null,
    parent_role_id: role?.parent_role_id || null,
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      if (data.success) {
        // Filter out current role and its children to prevent circular hierarchy
        let availableRoles = data.data
        if (role) {
          availableRoles = data.data.filter((r: Role) => r.id !== role.id)
        }
        setRoles(availableRoles)
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      console.error('Error submitting form:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Role Name */}
        <div>
          <label
            htmlFor="role_name"
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Role Name *
          </label>
          <Input
            id="role_name"
            type="text"
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            error={errors.role_name}
            placeholder="e.g., IT Manager, Help Desk, Viewer"
            disabled={role?.is_system_role}
          />
          {errors.role_name && (
            <p
              style={{
                color: 'var(--color-orange)',
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              {errors.role_name}
            </p>
          )}
          {role?.is_system_role && (
            <p
              style={{
                color: 'var(--color-brew-black-60)',
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              System role names cannot be changed
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            placeholder="Describe the purpose and scope of this role..."
            rows={3}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-brew-black-20)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Parent Role */}
        <div>
          <label
            htmlFor="parent_role_id"
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Parent Role (Optional)
          </label>
          <select
            id="parent_role_id"
            value={formData.parent_role_id || ''}
            onChange={(e) => setFormData({ ...formData, parent_role_id: e.target.value || null })}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-brew-black-20)',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'var(--color-off-white)',
            }}
          >
            <option value="">No parent role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.role_name} {r.is_system_role ? '(System)' : '(Custom)'}
              </option>
            ))}
          </select>
          <p
            style={{
              color: 'var(--color-brew-black-60)',
              fontSize: '0.875rem',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            This role will inherit all permissions from the parent role
          </p>
        </div>

        {/* System Role Notice */}
        {role?.is_system_role && (
          <div
            style={{
              backgroundColor: 'var(--color-light-blue)',
              padding: 'var(--spacing-md)',
              borderRadius: '6px',
              border: '1px solid var(--color-morning-blue)',
            }}
          >
            <strong>Note:</strong> This is a system role. Only description and parent role can be
            modified.
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || role?.is_system_role}>
            {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </div>
    </form>
  )
}
