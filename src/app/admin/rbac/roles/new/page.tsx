/**
 * Create New Role Page
 */

'use client'

import { useRouter } from 'next/navigation'
import RoleForm, { type RoleFormData } from '@/components/RoleForm'

export default function NewRolePage() {
  const router = useRouter()

  const handleSubmit = async (data: RoleFormData) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        alert('Role created successfully')
        router.push(`/admin/rbac/roles/${result.data.id}`)
      } else {
        alert(result.message || 'Failed to create role')
      }
    } catch (err) {
      alert('An error occurred while creating the role')
      console.error(err)
    }
  }

  const handleCancel = () => {
    router.push('/admin/rbac/roles')
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        Create New Role
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Create a custom role and assign permissions
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
        <RoleForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
