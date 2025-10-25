/**
 * FieldGroup Component
 *
 * Groups related form fields together with optional title and reduced spacing.
 * Useful for organizing complex forms into logical sections.
 */
'use client'

import React from 'react'

export interface FieldGroupProps {
  /** Group title (optional) */
  title?: string
  /** Group description/help text (optional) */
  description?: string
  /** Children (form fields) */
  children: React.ReactNode
  /** Enable compact mode with minimal spacing */
  compact?: boolean
  /** Enable collapsible mode */
  collapsible?: boolean
  /** Initially collapsed (only if collapsible is true) */
  defaultCollapsed?: boolean
  /** Optional CSS class */
  className?: string
}

export function FieldGroup({
  title,
  description,
  children,
  compact = false,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
}: FieldGroupProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed && collapsible)

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className={`field-group ${className}`}>
      {title && (
        <div
          className={`group-header ${collapsible ? 'collapsible' : ''}`}
          onClick={toggleCollapse}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleCollapse()
                  }
                }
              : undefined
          }
        >
          {collapsible && (
            <span className="collapse-icon" aria-hidden="true">
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          <h3 className="group-title">{title}</h3>
        </div>
      )}

      {description && !isCollapsed && <p className="group-description">{description}</p>}

      {!isCollapsed && <div className="group-content">{children}</div>}

      <style jsx>{`
        .field-group {
          border: 1px solid rgba(var(--color-black-rgb), 0.1);
          border-radius: 8px;
          padding: ${compact ? 'var(--spacing-md)' : 'var(--spacing-lg)'};
          background: white;
          margin-bottom: ${compact ? 'var(--spacing-sm)' : 'var(--spacing-md)'};
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: ${compact ? 'var(--spacing-sm)' : 'var(--spacing-md)'};
        }

        .group-header.collapsible {
          cursor: pointer;
          user-select: none;
        }

        .group-header.collapsible:hover {
          opacity: 0.8;
        }

        .group-header.collapsible:focus {
          outline: 2px solid var(--color-blue);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .collapse-icon {
          font-size: 0.75rem;
          color: var(--color-brew-black-60);
          transition: transform 0.2s ease;
        }

        .group-title {
          font-size: ${compact ? '1.125rem' : '1.25rem'};
          font-weight: 600;
          color: var(--color-black);
          margin: 0;
        }

        .group-description {
          font-size: 0.9rem;
          color: var(--color-brew-black-60);
          margin: 0 0 var(--spacing-md) 0;
          line-height: 1.5;
        }

        .group-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: ${compact ? 'var(--spacing-sm)' : 'var(--spacing-md)'};
          column-gap: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .field-group {
            padding: var(--spacing-md);
          }

          .group-content {
            grid-template-columns: 1fr;
          }

          .group-title {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  )
}
