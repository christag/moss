/**
 * Admin RBAC Configuration Page
 * Navigation hub for role-based access control
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button, Icon, type IconName } from '@/components/ui'

export default function RBACPage() {
  const router = useRouter()

  const sections: Array<{ title: string; description: string; href: string; icon: IconName }> = [
    {
      title: 'Roles',
      description: 'Manage roles and permissions',
      href: '/admin/rbac/roles',
      icon: 'users-group-team',
    },
    {
      title: 'Role Assignments',
      description: 'Assign roles to users and groups',
      href: '/admin/rbac/assignments',
      icon: 'lock-security',
    },
    {
      title: 'Permission Testing',
      description: 'Test and debug permission checks',
      href: '/admin/rbac/test',
      icon: 'flask-beaker-science',
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        RBAC Configuration
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Configure roles, permissions, and access control policies
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-lg)',
        }}
      >
        {sections.map((section) => (
          <div
            key={section.href}
            style={{
              backgroundColor: 'var(--color-off-white)',
              border: '1px solid var(--color-brew-black-20)',
              borderRadius: '8px',
              padding: 'var(--spacing-xl)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => router.push(section.href)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-morning-blue)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 127, 242, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-brew-black-20)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <Icon name={section.icon} size={40} aria-label={section.title} />
            </div>
            <h2
              style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}
            >
              {section.title}
            </h2>
            <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-lg)' }}>
              {section.description}
            </p>
            <Button variant="primary" onClick={() => router.push(section.href)}>
              Manage →
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
