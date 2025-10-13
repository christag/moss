/**
 * Edit Group Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GroupForm } from '@/components/GroupForm'
import type { Group } from '@/types'

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch group')
        }

        setGroup(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGroup()
  }, [id])

  const handleSuccess = (updatedGroup: Group) => {
    router.push(`/groups/${updatedGroup.id}`)
  }

  const handleCancel = () => {
    router.push(`/groups/${id}`)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Group not found'}</div>
          <button onClick={() => router.push('/groups')} className="btn btn-secondary mt-4">
            Back to Groups
          </button>
        </div>
      </div>
    )
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
          <Link
            href={`/groups/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {group.group_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <GroupForm group={group} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
