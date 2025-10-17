/**
 * Role Hierarchy Tree Component
 * Displays role inheritance hierarchy with visual tree structure
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui'
import type { Role } from '@/types'

interface RoleNode extends Role {
  children: RoleNode[]
  permission_count?: number
  inherited_permission_count?: number
}

interface RoleHierarchyTreeProps {
  highlightRoleId?: string // Optional: highlight a specific role
  onRoleClick?: (roleId: string) => void // Optional: custom click handler
}

export default function RoleHierarchyTree({
  highlightRoleId,
  onRoleClick,
}: RoleHierarchyTreeProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [treeData, setTreeData] = useState<RoleNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles?limit=200')
      const data = await response.json()

      if (data.success) {
        const rolesData = data.data
        setRoles(rolesData)

        // Fetch permission counts for each role
        const rolesWithCounts = await Promise.all(
          rolesData.map(async (role: Role) => {
            try {
              const permResponse = await fetch(
                `/api/roles/${role.id}/permissions?include_inherited=true`
              )
              const permData = await permResponse.json()

              if (permData.success) {
                const directCount = permData.data.filter(
                  (p: { is_inherited?: boolean }) => !p.is_inherited
                ).length
                const inheritedCount = permData.data.filter(
                  (p: { is_inherited?: boolean }) => p.is_inherited
                ).length

                return {
                  ...role,
                  permission_count: directCount,
                  inherited_permission_count: inheritedCount,
                }
              }
            } catch (err) {
              console.error(`Error fetching permissions for role ${role.id}:`, err)
            }

            return role
          })
        )

        // Build tree structure
        const tree = buildTree(rolesWithCounts)
        setTreeData(tree)

        // Expand all nodes by default
        const allIds = new Set(rolesWithCounts.map((r: Role) => r.id))
        setExpandedNodes(allIds)
      } else {
        setError(data.message || 'Failed to fetch roles')
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError('An error occurred while fetching roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const buildTree = (rolesList: RoleNode[]): RoleNode[] => {
    // Create a map for quick lookup
    const roleMap = new Map<string, RoleNode>()
    rolesList.forEach((role) => {
      roleMap.set(role.id, { ...role, children: [] })
    })

    // Build parent-child relationships
    const roots: RoleNode[] = []
    roleMap.forEach((role) => {
      if (role.parent_role_id) {
        const parent = roleMap.get(role.parent_role_id)
        if (parent) {
          parent.children.push(role)
        } else {
          // Parent not found, treat as root
          roots.push(role)
        }
      } else {
        // No parent, it's a root node
        roots.push(role)
      }
    })

    // Sort children by name
    const sortChildren = (node: RoleNode) => {
      node.children.sort((a, b) => a.role_name.localeCompare(b.role_name))
      node.children.forEach(sortChildren)
    }
    roots.forEach(sortChildren)

    return roots.sort((a, b) => a.role_name.localeCompare(b.role_name))
  }

  const toggleNode = (roleId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleRoleClick = (roleId: string) => {
    if (onRoleClick) {
      onRoleClick(roleId)
    } else {
      router.push(`/admin/rbac/roles/${roleId}`)
    }
  }

  const expandAll = () => {
    const allIds = new Set(roles.map((r) => r.id))
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const renderNode = (node: RoleNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isHighlighted = highlightRoleId === node.id

    const totalPermissions = (node.permission_count || 0) + (node.inherited_permission_count || 0)

    return (
      <div key={node.id} style={{ marginLeft: level > 0 ? 'var(--spacing-xl)' : '0' }}>
        {/* Node Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--spacing-md)',
            backgroundColor: isHighlighted ? 'rgba(28, 127, 242, 0.1)' : 'var(--color-off-white)',
            border: `2px solid ${isHighlighted ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
            borderRadius: '8px',
            marginBottom: 'var(--spacing-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleRoleClick(node.id)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isHighlighted
              ? 'rgba(28, 127, 242, 0.15)'
              : '#f0f0f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isHighlighted
              ? 'rgba(28, 127, 242, 0.1)'
              : 'var(--color-off-white)'
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              style={{
                marginRight: 'var(--spacing-sm)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--color-morning-blue)',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </div>
          )}

          {/* Spacer if no children */}
          {!hasChildren && <div style={{ width: '24px', marginRight: 'var(--spacing-sm)' }} />}

          {/* Role Info */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '2px' }}>
                {node.role_name}
              </div>
              {node.description && (
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  {node.description}
                </div>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
              {node.is_system_role && <Badge variant="blue">System</Badge>}

              {/* Permission Count */}
              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-brew-black-60)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <strong>{node.permission_count || 0}</strong> direct
                </div>
                {node.inherited_permission_count !== undefined &&
                  node.inherited_permission_count > 0 && (
                    <div style={{ color: 'var(--color-green)' }}>
                      +{node.inherited_permission_count} inherited
                    </div>
                  )}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-brew-black-40)' }}>
                  {totalPermissions} total
                </div>
              </div>
            </div>
          </div>

          {/* Visual Connector Line */}
          {level > 0 && (
            <div
              style={{
                position: 'absolute',
                left: '-20px',
                top: '50%',
                width: '20px',
                height: '2px',
                backgroundColor: 'var(--color-brew-black-20)',
              }}
            />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div style={{ position: 'relative' }}>
            {/* Vertical connector line */}
            {node.children.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: 'var(--color-brew-black-20)',
                }}
              />
            )}
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-brew-black-60)' }}>Loading role hierarchy...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          backgroundColor: 'var(--color-orange)',
          color: 'var(--color-brew-black)',
          borderRadius: '8px',
        }}
      >
        Error: {error}
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--color-brew-black-60)',
        }}
      >
        No roles found
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={expandAll}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-morning-blue)',
            color: 'var(--color-off-white)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-brew-black)',
            color: 'var(--color-off-white)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          Collapse All
        </button>
      </div>

      {/* Tree */}
      <div>{treeData.map((node) => renderNode(node))}</div>

      {/* Legend */}
      <div
        style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          border: '1px solid var(--color-brew-black-20)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Legend
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <strong>Direct permissions:</strong> Permissions explicitly assigned to this role
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-green)', fontWeight: '600' }}>
              Inherited permissions:
            </span>{' '}
            Permissions inherited from parent roles
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontWeight: '600' }}>▼ / ▶</span> Click to expand/collapse child roles
          </div>
        </div>
      </div>
    </div>
  )
}
