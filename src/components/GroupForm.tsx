/**
 * Group Form Component
 * Handles creating and editing groups
 */
'use client'

import React, { useState } from 'react'
import type { Group, CreateGroupInput, UpdateGroupInput, GroupType } from '@/types'

interface GroupFormProps {
  group?: Group
  onSuccess: (group: Group) => void
  onCancel: () => void
}

const GROUP_TYPE_OPTIONS: { value: GroupType; label: string }[] = [
  { value: 'active_directory', label: 'Active Directory' },
  { value: 'okta', label: 'Okta' },
  { value: 'google_workspace', label: 'Google Workspace' },
  { value: 'jamf_smart_group', label: 'Jamf Smart Group' },
  { value: 'intune', label: 'Intune' },
  { value: 'custom', label: 'Custom' },
  { value: 'distribution_list', label: 'Distribution List' },
  { value: 'security', label: 'Security' },
]

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const isEditMode = !!group
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateGroupInput>({
    group_name: group?.group_name || '',
    group_type: group?.group_type || 'custom',
    description: group?.description || '',
    group_id_external: group?.group_id_external || '',
    created_date: group?.created_date
      ? new Date(group.created_date).toISOString().split('T')[0]
      : '',
    notes: group?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditMode ? `/api/groups/${group.id}` : '/api/groups'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Build request body
      const body: CreateGroupInput | UpdateGroupInput = {
        group_name: formData.group_name,
        group_type: formData.group_type,
        description: formData.description || undefined,
        group_id_external: formData.group_id_external || undefined,
        created_date: formData.created_date || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save group')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateGroupInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-h3 mb-4">{isEditMode ? 'Edit Group' : 'Create New Group'}</h2>

        {error && (
          <div className="bg-orange text-black p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-2 gap-4">
          {/* Group Name */}
          <div>
            <label htmlFor="group_name" className="block mb-2 font-bold">
              Group Name *
            </label>
            <input
              type="text"
              id="group_name"
              value={formData.group_name}
              onChange={(e) => handleChange('group_name', e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Group Type */}
          <div>
            <label htmlFor="group_type" className="block mb-2 font-bold">
              Group Type *
            </label>
            <select
              id="group_type"
              value={formData.group_type}
              onChange={(e) => handleChange('group_type', e.target.value as GroupType)}
              required
              className="w-full p-2 border rounded"
            >
              {GROUP_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* External ID */}
          <div>
            <label htmlFor="group_id_external" className="block mb-2 font-bold">
              External ID
            </label>
            <input
              type="text"
              id="group_id_external"
              value={formData.group_id_external}
              onChange={(e) => handleChange('group_id_external', e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="External system ID (e.g., AD GUID)"
            />
          </div>

          {/* Created Date */}
          <div>
            <label htmlFor="created_date" className="block mb-2 font-bold">
              Created Date
            </label>
            <input
              type="date"
              id="created_date"
              value={formData.created_date}
              onChange={(e) => handleChange('created_date', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label htmlFor="description" className="block mb-2 font-bold">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full p-2 border rounded"
            placeholder="Group description and purpose"
          />
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label htmlFor="notes" className="block mb-2 font-bold">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Additional notes and information"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Group' : 'Create Group'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
