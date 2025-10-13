/**
 * New Group Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GroupForm } from '@/components/GroupForm'
import type { Group } from '@/types'

export default function NewGroupPage() {
  const router = useRouter()

  const handleSuccess = (group: Group) => {
    router.push(`/groups/${group.id}`)
  }

  const handleCancel = () => {
    router.push('/groups')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/groups" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Groups
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <GroupForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
