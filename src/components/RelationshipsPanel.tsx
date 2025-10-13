/**
 * RelationshipsPanel Component
 *
 * Right sidebar panel displaying quick links to related objects.
 * Shows relationship counts and provides navigation to related items.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

export interface RelationshipSection {
  title: string
  items: RelationshipItem[]
}

export interface RelationshipItem {
  label: string
  value: string | React.ReactNode
  href?: string
  count?: number
}

export interface RelationshipsPanelProps {
  sections: RelationshipSection[]
  className?: string
}

export function RelationshipsPanel({ sections, className = '' }: RelationshipsPanelProps) {
  if (!sections || sections.length === 0) {
    return null
  }

  return (
    <aside className={`relationships-panel ${className}`} aria-label="Related Items">
      <div className="panel-header">
        <h2 className="panel-title">Related Items</h2>
      </div>

      <div className="panel-content">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="relationship-section">
            <h3 className="section-title">{section.title}</h3>
            <div className="section-items">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="relationship-item">
                  <div className="item-label">{item.label}</div>
                  <div className="item-value">
                    {item.href ? (
                      <Link href={item.href} className="item-link">
                        {item.value}
                        {item.count !== undefined && (
                          <Badge variant="info" className="item-count">
                            {item.count}
                          </Badge>
                        )}
                      </Link>
                    ) : (
                      <>
                        {item.value}
                        {item.count !== undefined && (
                          <Badge variant="info" className="item-count">
                            {item.count}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .relationships-panel {
          background: var(--color-background);
          border-left: 1px solid var(--color-border);
          width: 300px;
          min-height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .panel-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-off-white);
        }

        .panel-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-black);
          margin: 0;
        }

        .panel-content {
          padding: 1rem;
        }

        .relationship-section {
          margin-bottom: 1.5rem;
        }

        .relationship-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-brew-black-60);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.75rem 0;
        }

        .section-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .relationship-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .item-label {
          font-size: 0.8125rem;
          color: var(--color-brew-black-60);
          font-weight: 500;
        }

        .item-value {
          font-size: 0.9375rem;
          color: var(--color-black);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-link {
          color: var(--color-blue);
          text-decoration: none;
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-link:hover {
          color: var(--color-blue-dark, #1565c0);
          text-decoration: underline;
        }

        .item-link:focus {
          outline: 2px solid var(--color-blue);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .item-count {
          font-size: 0.75rem;
        }

        /* Responsive design */
        @media (max-width: 1024px) {
          .relationships-panel {
            position: static;
            width: 100%;
            min-height: auto;
            border-left: none;
            border-top: 1px solid var(--color-border);
          }
        }

        @media (max-width: 768px) {
          .panel-header {
            padding: 1rem;
          }

          .panel-content {
            padding: 0.75rem;
          }

          .relationship-section {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </aside>
  )
}
