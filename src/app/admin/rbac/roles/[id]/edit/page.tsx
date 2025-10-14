/**
 * Edit Role Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import RoleForm, { type RoleFormData } from '@/components/RoleForm'
import type { Role } from '@/types'

export default function EditRolePage() {
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId])

  const fetchRole = async () => {
    try {
      const response = await fetch(`/api/roles/${roleId}`)
      const data = await response.json()

      if (data.success) {
        if (data.data.is_system_role) {
          setError('System roles cannot be edited')
        } else {
          setRole(data.data)
        }
      } else {
        setError(data.message || 'Role not found')
      }
    } catch (err) {
      setError('Failed to fetch role')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: RoleFormData) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        alert('Role updated successfully')
        router.push(`/admin/rbac/roles/${roleId}`)
      } else {
        alert(result.message || 'Failed to update role')
      }
    } catch (err) {
      alert('An error occurred while updating the role')
      console.error(err)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/rbac/roles/${roleId}`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error || !role) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Edit Role
        </h1>
        <div
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-brew-black)',
            padding: 'var(--spacing-lg)',
            borderRadius: '8px',
          }}
        >
          {error || 'Role not found'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        Edit Role: {role.role_name}
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Update role details and hierarchy
      </p>

      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-brew-black-20)',
          maxWidth: '800px',
        }}
      >
        <RoleForm role={role} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
