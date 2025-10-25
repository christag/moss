/**
 * BulkActionToolbar Component
 *
 * Toolbar for bulk operations on selected table rows.
 * Displays selection count and available actions.
 */
'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

export interface BulkAction {
  /** Unique action ID */
  id: string
  /** Display label */
  label: string
  /** Icon (optional) */
  icon?: React.ReactNode
  /** Callback when action is clicked */
  onClick: () => void | Promise<void>
  /** Action variant (affects styling) */
  variant?: 'primary' | 'secondary' | 'destructive'
  /** Disabled state */
  disabled?: boolean
}

export interface BulkActionToolbarProps {
  /** Number of selected items */
  selectedCount: number
  /** Total number of items */
  totalCount: number
  /** Available bulk actions */
  actions: BulkAction[]
  /** Callback to clear selection */
  onClearSelection: () => void
  /** Optional CSS class */
  className?: string
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className = '',
}: BulkActionToolbarProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (selectedCount === 0) {
    return null
  }

  const handleAction = async (action: BulkAction) => {
    if (action.disabled || isProcessing) return

    setIsProcessing(true)
    try {
      await action.onClick()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`bulk-action-toolbar ${className}`}>
      <div className="toolbar-content">
        {/* Selection info */}
        <div className="selection-info">
          <span className="selection-count">
            {selectedCount} of {totalCount} selected
          </span>
          <button
            type="button"
            className="clear-selection"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div className="actions">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={action.disabled || isProcessing}
              aria-label={action.label}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .bulk-action-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--color-blue);
          border-radius: 8px;
          padding: var(--spacing-md) var(--spacing-lg);
          margin-bottom: var(--spacing-md);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .toolbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .selection-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .selection-count {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        .clear-selection {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 4px;
          color: white;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-size: 1rem;
        }

        .clear-selection:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .clear-selection:focus {
          outline: 2px solid white;
          outline-offset: 2px;
        }

        .actions {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .action-icon {
          display: inline-flex;
          margin-right: 0.25rem;
        }

        @media (max-width: 768px) {
          .toolbar-content {
            flex-direction: column;
            align-items: stretch;
          }

          .selection-info {
            justify-content: space-between;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
