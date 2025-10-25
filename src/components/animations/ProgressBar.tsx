/**
 * Progress Bar Component
 *
 * Animated progress indicator with smooth transitions.
 * Supports determinate (percentage-based) and indeterminate (loading) modes.
 */

'use client'

import { motion } from 'framer-motion'

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'error'

export interface ProgressBarProps {
  /** Progress value from 0-100 */
  progress: number
  /** Visual variant (color scheme) */
  variant?: ProgressVariant
  /** Show percentage label */
  showLabel?: boolean
  /** Optional label text */
  label?: string
  /** Height of progress bar in pixels */
  height?: number
  /** Optional className */
  className?: string
}

/**
 * Animated progress bar with spring physics
 *
 * Features:
 * - Smooth width animation with spring easing
 * - Multiple color variants
 * - Optional percentage label
 * - Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * <ProgressBar progress={75} variant="success" showLabel />
 * <ProgressBar progress={uploadProgress} label="Uploading files..." />
 * ```
 */
export function ProgressBar({
  progress,
  variant = 'primary',
  showLabel = false,
  label,
  height = 8,
  className = '',
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return 'var(--color-green)'
      case 'warning':
        return 'var(--color-tangerine)'
      case 'error':
        return 'var(--color-orange)'
      case 'primary':
      default:
        return 'var(--color-morning-blue)'
    }
  }

  return (
    <div className={`progress-container ${className}`}>
      {(label || showLabel) && (
        <div className="progress-label-container">
          {label && <span className="progress-label">{label}</span>}
          {showLabel && <span className="progress-percentage">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>

      <style jsx>{`
        .progress-container {
          width: 100%;
        }

        .progress-label-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }

        .progress-label {
          color: var(--color-brew-black);
          font-weight: 500;
        }

        .progress-percentage {
          color: var(--color-brew-black-60);
          font-weight: 600;
        }

        .progress-track {
          width: 100%;
          height: ${height}px;
          background-color: rgba(107, 120, 133, 0.1);
          border-radius: ${height / 2}px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background-color: ${getVariantColor()};
          border-radius: ${height / 2}px;
          transition: background-color 0.3s ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .progress-fill {
            transition:
              width 0.1s linear,
              background-color 0.3s ease;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Indeterminate progress bar (loading state)
 * Shows continuous animation without specific progress
 */
export function ProgressBarIndeterminate({
  variant = 'primary',
  height = 4,
  className = '',
}: {
  variant?: ProgressVariant
  height?: number
  className?: string
}) {
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return 'var(--color-green)'
      case 'warning':
        return 'var(--color-tangerine)'
      case 'error':
        return 'var(--color-orange)'
      case 'primary':
      default:
        return 'var(--color-morning-blue)'
    }
  }

  return (
    <div className={`progress-indeterminate ${className}`}>
      <motion.div
        className="progress-indeterminate-bar"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <style jsx>{`
        .progress-indeterminate {
          width: 100%;
          height: ${height}px;
          background-color: rgba(107, 120, 133, 0.1);
          border-radius: ${height / 2}px;
          overflow: hidden;
          position: relative;
        }

        .progress-indeterminate-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background-color: ${getVariantColor()};
          border-radius: ${height / 2}px;
        }

        @media (prefers-reduced-motion: reduce) {
          .progress-indeterminate-bar {
            animation: none;
            width: 100%;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
