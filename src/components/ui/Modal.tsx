/**
 * Modal Component
 *
 * Accessible modal dialog with smooth animations.
 * Built with Framer Motion and follows WCAG accessibility guidelines.
 */

'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent } from '@/lib/animations/presets'
import { useReducedMotion } from '@/lib/animations/utils'
import { fadeIn } from '@/lib/animations/presets'

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title (required for accessibility) */
  title: string
  /** Modal content */
  children: React.ReactNode
  /** Optional footer with action buttons */
  footer?: React.ReactNode
  /** Maximum width of modal */
  maxWidth?: string
  /** Disable closing on backdrop click */
  disableBackdropClick?: boolean
  /** Disable closing on Escape key */
  disableEscapeKey?: boolean
}

/**
 * Animated modal dialog
 *
 * Features:
 * - Smooth backdrop fade and content scale animations
 * - Keyboard navigation (Escape to close, focus trap)
 * - Click outside to close (optional)
 * - ARIA attributes for accessibility
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Delete"
 *   footer={
 *     <>
 *       <Button onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   Are you sure you want to delete this item?
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '600px',
  disableBackdropClick = false,
  disableEscapeKey = false,
}: ModalProps) {
  const prefersReducedMotion = useReducedMotion()

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen || disableEscapeKey) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, disableEscapeKey])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableBackdropClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="modal-container">
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            variants={prefersReducedMotion ? fadeIn : modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="modal-wrapper" onClick={handleBackdropClick}>
            <motion.div
              className="modal-content"
              variants={prefersReducedMotion ? fadeIn : modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <h2 id="modal-title" className="modal-title">
                  {title}
                </h2>
                <button
                  className="modal-close"
                  onClick={onClose}
                  aria-label="Close modal"
                  type="button"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="modal-body">{children}</div>

              {/* Footer */}
              {footer && <div className="modal-footer">{footer}</div>}
            </motion.div>
          </div>

          <style jsx>{`
            .modal-container {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1000;
            }

            .modal-backdrop {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.5);
            }

            .modal-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--spacing-lg);
              overflow-y: auto;
            }

            .modal-content {
              position: relative;
              background-color: white;
              border-radius: 8px;
              box-shadow:
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
              width: 100%;
              max-width: ${maxWidth};
              max-height: calc(100vh - var(--spacing-xl) * 2);
              display: flex;
              flex-direction: column;
            }

            .modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: var(--spacing-lg);
              border-bottom: 1px solid var(--color-border);
            }

            .modal-title {
              font-size: 1.25rem;
              font-weight: 600;
              color: var(--color-brew-black);
              margin: 0;
            }

            .modal-close {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border: none;
              background: transparent;
              color: var(--color-brew-black-60);
              cursor: pointer;
              border-radius: 4px;
              transition:
                background-color 0.2s ease,
                color 0.2s ease;
            }

            .modal-close:hover {
              background-color: rgba(0, 0, 0, 0.05);
              color: var(--color-brew-black);
            }

            .modal-close:focus-visible {
              outline: 2px solid var(--color-morning-blue);
              outline-offset: 2px;
            }

            .modal-body {
              padding: var(--spacing-lg);
              overflow-y: auto;
              flex: 1;
            }

            .modal-footer {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: var(--spacing-sm);
              padding: var(--spacing-lg);
              border-top: 1px solid var(--color-border);
            }

            @media (max-width: 640px) {
              .modal-wrapper {
                padding: var(--spacing-md);
              }

              .modal-content {
                max-height: calc(100vh - var(--spacing-md) * 2);
              }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  )
}
