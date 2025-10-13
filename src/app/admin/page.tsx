/**
 * Admin Dashboard Overview
 * Landing page for the admin panel with system overview and quick stats
 */

import React from 'react'
import { requireAdmin } from '@/lib/adminAuth'
import AdminDashboardContent from '@/components/AdminDashboardContent'
import type { IconName } from '@/components/ui'

export default async function AdminDashboardPage() {
  // Require admin role to access this page
  const session = await requireAdmin()

  // Quick action cards for admin panel sections
  const quickActions: Array<{
    title: string
    description: string
    icon: IconName
    href: string
    color: string
    requiresSuperAdmin?: boolean
  }> = [
    {
      title: 'General',
      description: 'Configure site URL, timezone, and defaults',
      icon: 'settings',
      href: '/admin/general',
      color: 'var(--color-morning-blue)',
    },
    {
      title: 'Branding',
      description: 'Customize site appearance, colors, and logo',
      icon: 'palette_paint_creative',
      href: '/admin/branding',
      color: 'var(--color-morning-blue)',
    },
    {
      title: 'Integrations',
      description: 'Connect external systems (IdP, MDM, RMM)',
      icon: 'target_bullseye',
      href: '/admin/integrations',
      color: 'var(--color-morning-blue)',
    },
    {
      title: 'Storage',
      description: 'Configure file storage backend',
      icon: 'shopping-bag-purse',
      href: '/admin/storage',
      color: 'var(--color-morning-blue)',
    },
    {
      title: 'Authentication',
      description: 'Manage SSO, SAML, and MFA settings',
      icon: 'key',
      href: '/admin/authentication',
      color: 'var(--color-morning-blue)',
      requiresSuperAdmin: true,
    },
    {
      title: 'Custom Fields',
      description: 'Add custom fields to objects',
      icon: 'folder_drawer_category',
      href: '/admin/fields',
      color: 'var(--color-morning-blue)',
    },
    {
      title: 'RBAC',
      description: 'Configure roles and permissions',
      icon: 'people-group',
      href: '/admin/rbac',
      color: 'var(--color-morning-blue)',
      requiresSuperAdmin: true,
    },
  ]

  const systemInfo = [
    { label: 'User Role', value: session.user.role.replace('_', ' ').toUpperCase() },
    { label: 'User Email', value: session.user.email },
    { label: 'User Name', value: session.user.full_name },
  ]

  return <AdminDashboardContent systemInfo={systemInfo} quickActions={quickActions} />
}
