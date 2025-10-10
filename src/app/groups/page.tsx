/**
 * Groups List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Group } from '@/types'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [groupTypeFilter, setGroupTypeFilter] = useState('')

  const fetchGroups = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'group_name',
        sort_order: 'asc',
      })

      if (search) params.append('search', search)
      if (groupTypeFilter) params.append('group_type', groupTypeFilter)

      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch groups')
      }

      setGroups(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, groupTypeFilter])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

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

  if (error) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-h1">Groups</h1>
          <Link href="/groups/new" className="btn btn-primary">
            Add Group
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-2 gap-4">
            <div>
              <label htmlFor="search" className="block mb-2 font-bold">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="group_type" className="block mb-2 font-bold">
                Group Type
              </label>
              <select
                id="group_type"
                value={groupTypeFilter}
                onChange={(e) => setGroupTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="active_directory">Active Directory</option>
                <option value="okta">Okta</option>
                <option value="google_workspace">Google Workspace</option>
                <option value="jamf_smart_group">Jamf Smart Group</option>
                <option value="intune">Intune</option>
                <option value="custom">Custom</option>
                <option value="distribution_list">Distribution List</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="card">
          {groups.length === 0 ? (
            <p className="text-center py-8">No groups found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Group Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">External ID</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link href={`/groups/${group.id}`} className="text-blue hover:underline">
                        {group.group_name}
                      </Link>
                    </td>
                    <td className="p-2">{formatGroupType(group.group_type)}</td>
                    <td className="p-2">{group.description || '-'}</td>
                    <td className="p-2">{group.group_id_external || '-'}</td>
                    <td className="p-2">{new Date(group.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
