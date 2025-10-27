/**
 * Page Transition Component
 *
 * Wraps page content with smooth fade + slide up animation.
 * Designed for Next.js App Router page transitions.
 * Respects prefers-reduced-motion settings.
 */

'use client'

import { motion } from 'framer-motion'
import { fadeIn, slideUp } from '@/lib/animations/presets'
import { useReducedMotion } from '@/lib/animations/utils'

interface PageTransitionProps {
  children: React.ReactNode
  /** Optional className for additional styling */
  className?: string
}

/**
 * Wraps children in animated container for page transitions
 *
 * Features:
 * - Fade in + slide up animation (200ms)
 * - Exit animations for smooth transitions
 * - Reduced motion support (disables slide, keeps fade)
 *
 * @example
 * ```tsx
 * export default function Page() {
 *   return (
 *     <PageTransition>
 *       <h1>Page Content</h1>
 *     </PageTransition>
 *   )
 * }
 * ```
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={prefersReducedMotion ? fadeIn : slideUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}
