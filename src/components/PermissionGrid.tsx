/**
 * Permission Grid Component
 * Interactive checkbox grid for managing role permissions
 * Shows object types × actions with support for inherited permissions
 */

'use client'

import { useEffect, useState } from 'react'
import type { Permission } from '@/types'

interface PermissionWithSource extends Permission {
  is_inherited?: boolean
  inherited_from_role_id?: string
  inherited_from_role_name?: string
}

interface PermissionGridProps {
  roleId?: string // If provided, shows current role's permissions
  selectedPermissions: string[] // Array of permission IDs
  onChange: (permissionIds: string[]) => void
  disabled?: boolean // If true, grid is read-only
  showInherited?: boolean // If true, shows inherited permissions in gray
}

// Object type categories for grouping
const OBJECT_CATEGORIES = {
  Places: ['company', 'location', 'room'],
  Assets: ['device', 'io', 'ip_address'],
  'IT Services': ['software', 'saas_service', 'installed_application', 'software_license'],
  Organization: ['person', 'group'],
  Documentation: ['document', 'external_document', 'contract'],
  Network: ['network'],
}

const ACTIONS = ['view', 'edit', 'delete', 'manage_permissions'] as const

export default function PermissionGrid({
  roleId,
  selectedPermissions,
  onChange,
  disabled = false,
  showInherited = false,
}: PermissionGridProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [inheritedPermissions, setInheritedPermissions] = useState<PermissionWithSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
    if (roleId && showInherited) {
      fetchRolePermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, showInherited])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions?limit=200')
      const data = await response.json()

      if (data.success) {
        setAllPermissions(data.data)
      }
    } catch (err) {
      console.error('Error fetching permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRolePermissions = async () => {
    if (!roleId) return

    try {
      const response = await fetch(`/api/roles/${roleId}/permissions?include_inherited=true`)
      const data = await response.json()

      if (data.success) {
        setInheritedPermissions(data.data.filter((p: PermissionWithSource) => p.is_inherited))
      }
    } catch (err) {
      console.error('Error fetching role permissions:', err)
    }
  }

  const handleCheckboxChange = (permissionId: string, checked: boolean) => {
    if (disabled) return

    if (checked) {
      onChange([...selectedPermissions, permissionId])
    } else {
      onChange(selectedPermissions.filter((id) => id !== permissionId))
    }
  }

  const handleSelectAll = (objectType: string) => {
    if (disabled) return

    const objectPermissions = allPermissions.filter((p) => p.object_type === objectType)
    const objectPermissionIds = objectPermissions.map((p) => p.id)
    const allSelected = objectPermissionIds.every((id) => selectedPermissions.includes(id))

    if (allSelected) {
      // Deselect all
      onChange(selectedPermissions.filter((id) => !objectPermissionIds.includes(id)))
    } else {
      // Select all
      const newSelection = [...selectedPermissions]
      objectPermissionIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id)
        }
      })
      onChange(newSelection)
    }
  }

  const isInherited = (permissionId: string): PermissionWithSource | undefined => {
    return inheritedPermissions.find((p) => p.id === permissionId)
  }

  const isChecked = (permissionId: string): boolean => {
    return selectedPermissions.includes(permissionId) || !!isInherited(permissionId)
  }

  if (loading) {
    return <div style={{ padding: 'var(--spacing-lg)' }}>Loading permissions...</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {Object.entries(OBJECT_CATEGORIES).map(([category, objectTypes]) => (
        <div
          key={category}
          style={{
            marginBottom: 'var(--spacing-xl)',
            border: '1px solid var(--color-brew-black-20)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-brew-black)',
              color: 'var(--color-off-white)',
              padding: 'var(--spacing-md)',
              fontWeight: '600',
            }}
          >
            {category}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-light-blue)' }}>
                <th
                  style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    fontWeight: '600',
                    minWidth: '200px',
                  }}
                >
                  Object Type
                </th>
                {ACTIONS.map((action) => (
                  <th
                    key={action}
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'center',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      minWidth: '100px',
                    }}
                  >
                    {action}
                  </th>
                ))}
                <th
                  style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                    fontWeight: '600',
                    minWidth: '80px',
                  }}
                >
                  All
                </th>
              </tr>
            </thead>
            <tbody>
              {objectTypes.map((objectType, index) => {
                const objectPermissions = allPermissions.filter((p) => p.object_type === objectType)
                const allSelected = objectPermissions.every((p) => isChecked(p.id))

                return (
                  <tr
                    key={objectType}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'var(--color-off-white)' : '#fff',
                      borderTop: '1px solid var(--color-brew-black-20)',
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--spacing-md)',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}
                    >
                      {objectType.replace(/_/g, ' ')}
                    </td>
                    {ACTIONS.map((action) => {
                      const permission = objectPermissions.find((p) => p.action === action)
                      if (!permission) {
                        return (
                          <td
                            key={action}
                            style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}
                          >
                            —
                          </td>
                        )
                      }

                      const inherited = isInherited(permission.id)
                      const checked = isChecked(permission.id)

                      return (
                        <td
                          key={action}
                          style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 'var(--spacing-xs)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleCheckboxChange(permission.id, e.target.checked)
                              }
                              disabled={disabled || !!inherited}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: disabled || inherited ? 'not-allowed' : 'pointer',
                                opacity: inherited ? 0.5 : 1,
                              }}
                              title={
                                inherited
                                  ? `Inherited from ${inherited.inherited_from_role_name}`
                                  : permission.permission_name
                              }
                            />
                            {inherited && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--color-brew-black-60)',
                                  fontStyle: 'italic',
                                }}
                              >
                                inherited
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => handleSelectAll(objectType)}
                        disabled={disabled}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                        title="Select/deselect all permissions for this object type"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {showInherited && inheritedPermissions.length > 0 && (
        <div
          style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-light-blue)',
            borderRadius: '6px',
            fontSize: '0.9rem',
          }}
        >
          <strong>Note:</strong> Grayed out permissions are inherited from parent roles and cannot
          be directly modified. To change inherited permissions, edit the parent role.
        </div>
      )}
    </div>
  )
}
