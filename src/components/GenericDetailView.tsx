'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Icon,
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
  subtitle: _subtitle,
  status,
  breadcrumbs,
  fieldGroups,
  tabs,
  onEdit,
  onDelete,
  onBack: _onBack,
  loading = false,
}: GenericDetailViewProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || 'overview')
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({})
  const [tabScrollPosition, setTabScrollPosition] = useState(0)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })
  const tabContainerRef = React.useRef<HTMLDivElement>(null)

  const toggleSection = (index: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const updateScrollButtons = () => {
    if (!tabContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tabContainerRef.current
    setCanScroll({
      left: scrollLeft > 0,
      right: scrollLeft < scrollWidth - clientWidth - 5,
    })
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabContainerRef.current) return
    const scrollAmount = 200
    const newPosition =
      direction === 'left'
        ? Math.max(0, tabScrollPosition - scrollAmount)
        : tabScrollPosition + scrollAmount

    tabContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    })
  }

  const handleTabScroll = () => {
    if (tabContainerRef.current) {
      setTabScrollPosition(tabContainerRef.current.scrollLeft)
      updateScrollButtons()
    }
  }

  // Update scroll buttons on mount and when tabs change
  useEffect(() => {
    updateScrollButtons()
    // Add resize listener to update on window resize
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [tabs])

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
  const handleTabKeyDown = (e: React.KeyboardEvent, _tabId: string, index: number) => {
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
    <>
      {/* Blue Page Header with Title and Actions */}
      <div
        style={{
          backgroundColor: 'var(--color-blue)',
          color: 'var(--color-off-white)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="container">
          <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                <Breadcrumb items={breadcrumbs} />
              </div>
            )}

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tabs && tabs.length > 0 ? 'var(--spacing-sm)' : '0',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    flexWrap: 'wrap',
                  }}
                >
                  <h1
                    style={{
                      fontSize: 'var(--font-size-3xl)',
                      fontWeight: '700',
                      color: 'var(--color-off-white)',
                      margin: '0',
                    }}
                  >
                    {title}
                  </h1>
                  {status && (
                    <Badge
                      variant={
                        status === 'active' ? 'success' : status === 'inactive' ? 'info' : 'default'
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexShrink: 0 }}>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    aria-label={`Edit ${title}`}
                    title="Edit"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      padding: 'var(--spacing-sm)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                    }}
                  >
                    <Icon name="pencil-edit" size={16} aria-hidden="true" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    aria-label={`Delete ${title}`}
                    title="Delete"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      padding: 'var(--spacing-sm)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                    }}
                  >
                    <Icon name="trash_garbage_can" size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs with Arrow Navigation */}
            {tabs && tabs.length > 0 && (
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                }}
              >
                {/* Left Arrow */}
                {canScroll.left && (
                  <button
                    onClick={() => scrollTabs('left')}
                    aria-label="Scroll tabs left"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      padding: 'var(--spacing-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>
                      <Icon name="chevron-up" size={16} aria-hidden="true" />
                    </span>
                  </button>
                )}

                {/* Tabs Container */}
                <div
                  ref={tabContainerRef}
                  onScroll={handleTabScroll}
                  style={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    flex: 1,
                  }}
                  className="hide-scrollbar"
                >
                  <div
                    className="flex gap-xs"
                    role="tablist"
                    aria-label={`${title} tabs`}
                    style={{ minWidth: 'max-content' }}
                  >
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        data-tab-id={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(e) => handleTabKeyDown(e, tab.id, index)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          background:
                            activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                          border:
                            activeTab === tab.id
                              ? '1px solid rgba(255, 255, 255, 0.3)'
                              : '1px solid transparent',
                          borderRadius: '4px',
                          color: 'var(--color-off-white)',
                          fontWeight: activeTab === tab.id ? 600 : 400,
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-base)',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label}
                        {tab.count !== undefined && (
                          <span
                            style={{
                              marginLeft: 'var(--spacing-xs)',
                              opacity: 0.8,
                            }}
                          >
                            ({tab.count})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Arrow */}
                {canScroll.right && (
                  <button
                    onClick={() => scrollTabs('right')}
                    aria-label="Scroll tabs right"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--color-off-white)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      padding: 'var(--spacing-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>
                      <Icon name="chevron-up" size={16} aria-hidden="true" />
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div style={{ padding: 'var(--spacing-md)' }}>
          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <div
              role="tabpanel"
              id="tabpanel-overview"
              aria-labelledby="tab-overview"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}
            >
              {fieldGroups.map((group, groupIndex) => {
                const isCollapsed = collapsedSections[groupIndex] || false
                return (
                  <Card key={groupIndex}>
                    <div
                      className="collapsible-header"
                      onClick={() => toggleSection(groupIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSection(groupIndex)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={!isCollapsed}
                      aria-controls={`section-${groupIndex}`}
                    >
                      <CardHeader style={{ marginBottom: 0 }}>{group.title}</CardHeader>
                      <Icon
                        name="chevron-down"
                        size={20}
                        className={`collapsible-icon ${isCollapsed ? '' : 'rotated'}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      id={`section-${groupIndex}`}
                      className={`collapsible-section ${isCollapsed ? 'collapsed' : 'expanded'}`}
                    >
                      <CardContent>
                        <div className="grid grid-2">
                          {group.fields.map((field, fieldIndex) => (
                            <div
                              key={fieldIndex}
                              className={field.width === 'full' ? 'col-span-2' : ''}
                              style={{ marginBottom: 'var(--spacing-sm)' }}
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
                                style={{
                                  fontSize: 'var(--font-size-md)',
                                  color: 'var(--color-black)',
                                }}
                              >
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
              {currentTab?.content}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
