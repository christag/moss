'use client'

import React, { useState } from 'react'
import { Button, Card, CardHeader, CardContent, Badge } from '@/components/ui'

/**
 * Field definition for detail view
 */
export interface DetailField {
  label: string
  value: React.ReactNode
  width?: 'half' | 'full'
}

/**
 * Field group definition for organizing fields into sections
 */
export interface FieldGroup {
  title: string
  fields: DetailField[]
}

/**
 * Tab definition for detail view
 */
export interface TabConfig {
  id: string
  label: string
  count?: number
  content: React.ReactNode
}

// Legacy alias for backwards compatibility
export type DetailTab = TabConfig

/**
 * Action button definition
 */
export interface DetailAction {
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  onClick: () => void
  disabled?: boolean
}

/**
 * Breadcrumb definition
 */
export interface Breadcrumb {
  label: string
  href?: string
}

/**
 * Props for GenericDetailView component
 */
export interface GenericDetailViewProps {
  title: string
  subtitle?: string
  status?: string
  breadcrumbs?: Breadcrumb[]
  fieldGroups: FieldGroup[]
  tabs?: TabConfig[]
  onEdit?: () => void
  onDelete?: () => void
  onBack?: () => void
  loading?: boolean
}

/**
 * Generic Detail View Component
 * Reusable tabbed detail view for any object type
 */
export function GenericDetailView({
  title,
  subtitle,
  status,
  breadcrumbs,
  fieldGroups,
  tabs,
  onEdit,
  onDelete,
  onBack,
  loading = false,
}: GenericDetailViewProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || 'overview')

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg text-center">Loading...</div>
      </div>
    )
  }

  const currentTab = tabs?.find((tab) => tab.id === activeTab)

  return (
    <div className="container">
      <div className="p-lg">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="mb-md"
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Header */}
        <div className="mb-lg">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="mb-md">
              ← Back
            </Button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-md mb-xs">
                <h1 className="text-4xl font-bold text-blue">{title}</h1>
                {status && (
                  <Badge variant={status === 'active' ? 'success' : 'default'}>{status}</Badge>
                )}
              </div>
              {subtitle && <p className="text-md text-black opacity-60">{subtitle}</p>}
            </div>

            <div className="flex gap-sm">
              {onEdit && (
                <Button variant="primary" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="mb-lg">
            <div
              className="flex gap-md"
              style={{ borderBottom: '2px solid rgba(var(--color-black-rgb), 0.1)' }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="tab-button"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    background: 'none',
                    border: 'none',
                    borderBottom:
                      activeTab === tab.id
                        ? '2px solid var(--color-blue)'
                        : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--color-blue)' : 'var(--color-black)',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-md)',
                    marginBottom: '-2px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      style={{
                        marginLeft: 'var(--spacing-xs)',
                        opacity: 0.6,
                      }}
                    >
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {fieldGroups.map((group, groupIndex) => (
              <Card key={groupIndex}>
                <CardHeader>{group.title}</CardHeader>
                <CardContent>
                  <div className="grid grid-2">
                    {group.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className={field.width === 'full' ? 'col-span-2' : ''}
                        style={{ marginBottom: 'var(--spacing-md)' }}
                      >
                        <div
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            color: 'var(--color-black)',
                            marginBottom: 'var(--spacing-xs)',
                            opacity: 0.7,
                          }}
                        >
                          {field.label}
                        </div>
                        <div
                          style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-black)' }}
                        >
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          currentTab?.content
        )}
      </div>
    </div>
  )
}
