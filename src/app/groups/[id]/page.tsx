/**
 * Group Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Group } from '@/types'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const handleDelete = async () => {
    if (!group || !confirm(`Are you sure you want to delete "${group.group_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete group')
      }

      router.push('/groups')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }

  const formatGroupType = (type: string) => {
    const typeMap: Record<string, string> = {
      active_directory: 'Active Directory',
      okta: 'Okta',
      google_workspace: 'Google Workspace',
      jamf_smart_group: 'Jamf Smart Group',
      intune: 'Intune',
      custom: 'Custom',
      distribution_list: 'Distribution List',
      security: 'Security',
    }
    return typeMap[type] || type
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
          <Link href="/groups" className="btn btn-secondary mt-4">
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{group.group_name}</h1>
            <p className="text-gray-600">{formatGroupType(group.group_type)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/groups/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        {/* Overview */}
        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Overview</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Group Name</p>
              <p>{group.group_name}</p>
            </div>
            <div>
              <p className="font-bold">Group Type</p>
              <p>{formatGroupType(group.group_type)}</p>
            </div>
            <div>
              <p className="font-bold">External ID</p>
              <p>{group.group_id_external || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Created Date</p>
              <p>{group.created_date ? new Date(group.created_date).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          {group.description && (
            <div className="mt-4">
              <p className="font-bold">Description</p>
              <p>{group.description}</p>
            </div>
          )}

          {group.notes && (
            <div className="mt-4">
              <p className="font-bold">Notes</p>
              <p className="whitespace-pre-wrap">{group.notes}</p>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(group.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(group.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
