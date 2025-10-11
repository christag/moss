'use client'

import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
} from '@/components/ui'

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

// Note: Breadcrumb and BreadcrumbItem types are imported from @/components/ui

/**
 * Props for GenericDetailView component
 */
export interface GenericDetailViewProps {
  title: string
  subtitle?: string
  status?: string
  breadcrumbs?: BreadcrumbItem[]
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
        <div className="p-lg text-center" role="status" aria-live="polite" aria-busy="true">
          Loading...
        </div>
      </div>
    )
  }

  const currentTab = tabs?.find((tab) => tab.id === activeTab)

  // Keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, tabId: string, index: number) => {
    if (!tabs) return

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        const nextIndex = (index + 1) % tabs.length
        setActiveTab(tabs[nextIndex].id)
        // Focus the next tab
        setTimeout(() => {
          const nextTab = document.querySelector(
            `[data-tab-id="${tabs[nextIndex].id}"]`
          ) as HTMLButtonElement
          nextTab?.focus()
        }, 0)
        break
      case 'ArrowLeft':
        e.preventDefault()
        const prevIndex = (index - 1 + tabs.length) % tabs.length
        setActiveTab(tabs[prevIndex].id)
        // Focus the previous tab
        setTimeout(() => {
          const prevTab = document.querySelector(
            `[data-tab-id="${tabs[prevIndex].id}"]`
          ) as HTMLButtonElement
          prevTab?.focus()
        }, 0)
        break
      case 'Home':
        e.preventDefault()
        setActiveTab(tabs[0].id)
        setTimeout(() => {
          const firstTab = document.querySelector(
            `[data-tab-id="${tabs[0].id}"]`
          ) as HTMLButtonElement
          firstTab?.focus()
        }, 0)
        break
      case 'End':
        e.preventDefault()
        setActiveTab(tabs[tabs.length - 1].id)
        setTimeout(() => {
          const lastTab = document.querySelector(
            `[data-tab-id="${tabs[tabs.length - 1].id}"]`
          ) as HTMLButtonElement
          lastTab?.focus()
        }, 0)
        break
    }
  }

  return (
    <div className="container">
      <div className="p-lg">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

        {/* Header */}
        <div className="mb-lg">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="mb-md"
              aria-label="Go back to previous page"
            >
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
                <Button variant="primary" onClick={onEdit} aria-label={`Edit ${title}`}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={onDelete} aria-label={`Delete ${title}`}>
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
              role="tablist"
              aria-label={`${title} tabs`}
              style={{ borderBottom: '2px solid rgba(var(--color-black-rgb), 0.1)' }}
            >
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id, index)}
                  className="tab-button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
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
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid var(--color-morning-blue)'
                    e.currentTarget.style.outlineOffset = '-2px'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none'
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
          <div
            role="tabpanel"
            id="tabpanel-overview"
            aria-labelledby="tab-overview"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
          >
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
          <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {currentTab?.content}
          </div>
        )}
      </div>
    </div>
  )
}
