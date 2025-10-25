/**
 * Skeleton Component
 *
 * Animated loading placeholder with shimmer effect.
 * Used to indicate content is loading while maintaining layout structure.
 */

'use client'

import { motion } from 'framer-motion'

export type SkeletonVariant = 'text' | 'rectangle' | 'circle' | 'card'

export interface SkeletonProps {
  /** Visual variant of the skeleton */
  variant?: SkeletonVariant
  /** Width of skeleton (CSS value) */
  width?: string | number
  /** Height of skeleton (CSS value) */
  height?: string | number
  /** Optional className for additional styling */
  className?: string
}

/**
 * Skeleton loading placeholder with animated shimmer
 *
 * Features:
 * - Smooth shimmer animation using gradient
 * - Multiple variants for different content types
 * - Customizable dimensions
 * - Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * // Text line
 * <Skeleton variant="text" width="200px" />
 *
 * // Avatar
 * <Skeleton variant="circle" width={48} height={48} />
 *
 * // Card
 * <Skeleton variant="card" width="100%" height="200px" />
 * ```
 */
export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || '18px',
          borderRadius: '4px',
        }
      case 'circle':
        const size = width || height || '48px'
        return {
          width: size,
          height: size,
          borderRadius: '50%',
        }
      case 'card':
        return {
          width: width || '100%',
          height: height || '200px',
          borderRadius: '8px',
        }
      case 'rectangle':
      default:
        return {
          width: width || '100%',
          height: height || '100px',
          borderRadius: '4px',
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <motion.div
      className={`skeleton ${className}`}
      style={variantStyles}
      initial={{ opacity: 0.6 }}
      animate={{
        opacity: [0.6, 0.8, 0.6],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(107, 120, 133, 0.1) 0%,
            rgba(107, 120, 133, 0.15) 50%,
            rgba(107, 120, 133, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          display: block;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none;
            background: rgba(107, 120, 133, 0.1);
          }
        }
      `}</style>
    </motion.div>
  )
}

/**
 * Skeleton for a single text line
 */
export function SkeletonText({ width = '100%' }: { width?: string | number }) {
  return <Skeleton variant="text" width={width} />
}

/**
 * Skeleton for multiple text lines (paragraph)
 */
export function SkeletonParagraph({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText
          key={i}
          width={i === lines - 1 ? '70%' : '100%'} // Last line is shorter
        />
      ))}
    </div>
  )
}

/**
 * Skeleton for a card with header and content
 */
export function SkeletonCard() {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
      }}
    >
      <Skeleton variant="text" width="60%" height="24px" />
      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <SkeletonParagraph lines={3} />
      </div>
    </div>
  )
}
