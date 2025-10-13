/**
 * Group Detail Page
 *
 * Shows detailed information about a specific group with members management
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { JunctionTableManager } from '@/components/JunctionTableManager'
import type { Group, Person } from '@/types'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch group data
  useEffect(() => {
    if (!id) return

    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch group')
        }
        const result = await response.json()
        setGroup(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGroup()
  }, [id])

  // Fetch members
  useEffect(() => {
    if (!id) return

    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/groups/${id}/members`)
        if (response.ok) {
          const result = await response.json()
          setMembers(result.data || [])
        }
      } catch (err) {
        console.error('Error fetching members:', err)
      }
    }

    fetchMembers()
  }, [id])

  const handleEdit = () => {
    router.push(`/groups/${id}/edit`)
  }

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

      toast.success('Group deleted successfully')
      router.push('/groups')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }

  const handleBack = () => {
    router.push('/groups')
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

  // Handle adding a member
  const handleAddMember = async (person: Person) => {
    try {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: person.id }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to add member')
      }

      // Update local state
      setMembers((prev) => [...prev, person])
      toast.success(`Added ${person.first_name} ${person.last_name} to group`)
    } catch (err) {
      throw err // Re-throw so JunctionTableManager can handle it
    }
  }

  // Handle removing a member
  const handleRemoveMember = async (personId: string) => {
    try {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: personId }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to remove member')
      }

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== personId))

      const removedPerson = members.find((m) => m.id === personId)
      if (removedPerson) {
        toast.success(`Removed ${removedPerson.first_name} ${removedPerson.last_name} from group`)
      }
    } catch (err) {
      throw err // Re-throw so JunctionTableManager can handle it
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" role="status" aria-live="polite" aria-busy="true">
          Loading...
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Group not found'}</p>
        <button onClick={handleBack}>Back to Groups</button>
      </div>
    )
  }

  // Field groups for Overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Group Information',
      fields: [
        { label: 'Group Name', value: group.group_name },
        { label: 'Group Type', value: formatGroupType(group.group_type) },
        { label: 'External ID', value: group.group_id_external || '-' },
        {
          label: 'Created Date',
          value: group.created_date ? new Date(group.created_date).toLocaleDateString() : '-',
        },
      ],
    },
  ]

  if (group.description) {
    fieldGroups.push({
      title: 'Description',
      fields: [{ label: '', value: group.description, fullWidth: true }],
    })
  }

  if (group.notes) {
    fieldGroups.push({
      title: 'Notes',
      fields: [{ label: '', value: group.notes, fullWidth: true, preformatted: true }],
    })
  }

  fieldGroups.push({
    title: 'System Information',
    fields: [
      { label: 'Created', value: new Date(group.created_at).toLocaleString() },
      { label: 'Last Updated', value: new Date(group.updated_at).toLocaleString() },
    ],
  })

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: null, // GenericDetailView will use fieldGroups for Overview
    },
    {
      id: 'members',
      label: 'Members',
      content: (
        <div className="tab-content">
          <h2 className="text-h3 mb-4">Group Members</h2>
          <p className="text-muted mb-6">Manage people who belong to this group.</p>
          <JunctionTableManager<Person>
            currentItems={members}
            availableItemsEndpoint="/api/people?limit=100"
            getItemLabel={(person) => `${person.first_name} ${person.last_name}`}
            onAdd={handleAddMember}
            onRemove={handleRemoveMember}
            placeholder="Search people to add..."
            emptyMessage="No members in this group"
          />
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this group will appear here.</p>
          <p className="text-muted">
            <em>Audit log functionality coming soon...</em>
          </p>
        </div>
      ),
    },
  ]

  return (
    <>
      <GenericDetailView
        title={group.group_name}
        subtitle={formatGroupType(group.group_type)}
        breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: group.group_name }]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />

      <style jsx global>{`
        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: var(--color-brew-black-60);
        }

        .error-container h1 {
          color: var(--color-orange);
          margin-bottom: 1rem;
        }

        .error-container p {
          margin-bottom: 1.5rem;
          color: var(--color-brew-black-60);
        }

        .error-container button {
          padding: 0.75rem 1.5rem;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .error-container button:hover {
          opacity: 0.9;
        }

        .tab-content {
          padding: 2rem;
        }

        .text-muted {
          color: var(--color-brew-black-60);
          line-height: 1.6;
        }

        .text-h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .mb-4 {
          margin-bottom: 1rem;
        }

        .mb-6 {
          margin-bottom: 1.5rem;
        }
      `}</style>
    </>
  )
}
