/**
 * Breadcrumb Component
 *
 * Provides hierarchical navigation showing the current page's location
 * within the site structure.
 */
'use client'

import React from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb ${className}`}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="breadcrumb-item">
              {isLast || !item.href ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="breadcrumb-link">
                    {item.label}
                  </Link>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ol>

      <style jsx>{`
        .breadcrumb {
          padding: 12px 0;
          margin-bottom: 16px;
        }

        .breadcrumb-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 8px;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          line-height: 21px;
        }

        .breadcrumb-link {
          color: var(--color-black);
          text-decoration: none;
          transition: opacity 0.15s ease;
          font-weight: 400;
        }

        .breadcrumb-link:hover {
          opacity: 0.7;
        }

        .breadcrumb-link:focus-visible {
          outline: 2px solid var(--color-black);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .breadcrumb-separator {
          color: var(--color-black);
          font-weight: 400;
          user-select: none;
          margin: 0 4px;
        }

        .breadcrumb-current {
          color: var(--color-black);
          font-weight: 600;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .breadcrumb {
            padding: 8px 0;
            margin-bottom: 12px;
          }

          .breadcrumb-item {
            font-size: 13px;
          }

          .breadcrumb-list {
            gap: 6px;
          }

          .breadcrumb-item {
            gap: 6px;
          }
        }
      `}</style>
    </nav>
  )
}
