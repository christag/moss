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
          padding: 0.75rem 0;
          margin-bottom: 1.5rem;
        }

        .breadcrumb-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 0.5rem;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .breadcrumb-link {
          color: var(--color-blue);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: var(--color-blue-dark, #1565c0);
          text-decoration: underline;
        }

        .breadcrumb-link:focus {
          outline: 2px solid var(--color-blue);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .breadcrumb-separator {
          color: var(--color-brew-black-40);
          font-weight: 300;
          user-select: none;
        }

        .breadcrumb-current {
          color: var(--color-black);
          font-weight: 500;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .breadcrumb {
            padding: 0.5rem 0;
            margin-bottom: 1rem;
          }

          .breadcrumb-item {
            font-size: 0.8125rem;
          }

          .breadcrumb-list {
            gap: 0.375rem;
          }

          .breadcrumb-item {
            gap: 0.375rem;
          }
        }
      `}</style>
    </nav>
  )
}
