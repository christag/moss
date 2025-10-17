/**
 * Role Hierarchy Page
 * Displays the complete role inheritance tree
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import RoleHierarchyTree from '@/components/RoleHierarchyTree'

export default function RoleHierarchyPage() {
  const router = useRouter()

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
            Role Hierarchy
          </h1>
          <p style={{ color: 'var(--color-brew-black-60)', maxWidth: '800px' }}>
            View the complete role inheritance structure. Child roles inherit all permissions from
            their parent roles. Click on any role to view its details and permissions.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/rbac/roles')}>
          ← Back to Roles
        </Button>
      </div>

      {/* Info Card */}
      <div
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'rgba(28, 127, 242, 0.05)',
          border: '1px solid var(--color-morning-blue)',
          borderRadius: '8px',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
          How Role Inheritance Works
        </h2>
        <ul
          style={{
            listStyle: 'disc',
            paddingLeft: 'var(--spacing-xl)',
            color: 'var(--color-brew-black)',
            lineHeight: '1.6',
          }}
        >
          <li>
            <strong>Parent roles</strong> can be assigned to roles to create a hierarchy
          </li>
          <li>
            <strong>Child roles</strong> automatically inherit all permissions from their parent
            role
          </li>
          <li>
            <strong>Direct permissions</strong> are permissions explicitly assigned to the role
          </li>
          <li>
            <strong>Inherited permissions</strong> come from parent roles in the hierarchy
          </li>
          <li>You can add additional permissions to child roles beyond what they inherit</li>
          <li>
            System roles (Admin, Editor, Viewer) cannot be modified and serve as base templates
          </li>
        </ul>
      </div>

      {/* Tree */}
      <RoleHierarchyTree />
    </div>
  )
}
