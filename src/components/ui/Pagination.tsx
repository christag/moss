/**
 * Pagination Component
 *
 * Provides page navigation with page numbers, jump links, and prev/next controls.
 * Design based on Figma specs: pagination.svg
 */
'use client'

import React from 'react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 6,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)

    // Always show first page
    pages.push(1)

    if (currentPage <= halfVisible + 1) {
      // Near the beginning
      for (let i = 2; i <= maxVisiblePages - 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - halfVisible) {
      // Near the end
      pages.push('ellipsis')
      for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // In the middle
      pages.push('ellipsis')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav aria-label="Pagination" className={`pagination-container ${className}`}>
      <div className="pagination">
        {/* Previous button */}
        <button
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.16 11.41L6.58 8L10.16 4.59L8.75 3L4.75 8L8.75 13L10.16 11.41Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === currentPage

          return (
            <button
              key={pageNumber}
              className={`pagination-page ${isActive ? 'pagination-page-active' : ''}`}
              onClick={() => onPageChange(pageNumber)}
              disabled={isActive}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          )
        })}

        {/* Next button */}
        <button
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.75 11.41L9.33 8L5.75 4.59L7.16 3L11.16 8L7.16 13L5.75 11.41Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Page number buttons */
        .pagination-page {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          font-family: var(--font-family-base);
          background-color: transparent;
          color: #6b7885;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .pagination-page:hover:not(:disabled) {
          opacity: 1;
          background-color: rgba(107, 120, 133, 0.1);
        }

        .pagination-page:focus-visible {
          outline: 2px solid var(--color-black);
          outline-offset: 2px;
        }

        .pagination-page-active {
          background-color: black;
          color: white;
          opacity: 1;
          cursor: default;
        }

        .pagination-page-active:hover {
          background-color: black;
        }

        /* Arrow buttons */
        .pagination-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          background-color: transparent;
          color: #6b7885;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .pagination-arrow:hover:not(:disabled) {
          opacity: 1;
          background-color: rgba(107, 120, 133, 0.1);
        }

        .pagination-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pagination-arrow:focus-visible {
          outline: 2px solid var(--color-black);
          outline-offset: 2px;
        }

        /* Ellipsis */
        .pagination-ellipsis {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: #6b7885;
          font-size: 16px;
          user-select: none;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .pagination {
            gap: 8px;
          }

          .pagination-page,
          .pagination-arrow,
          .pagination-ellipsis {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }
        }
      `}</style>
    </nav>
  )
}
