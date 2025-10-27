/**
 * Animation Hooks
 *
 * Custom React hooks for animation-related functionality.
 * All hooks respect prefers-reduced-motion settings.
 */

'use client'

import { useInView as useFramerInView, type UseInViewOptions } from 'framer-motion'
import { useReducedMotion } from './utils'
import { RefObject } from 'react'

/**
 * Hook to detect when an element enters the viewport
 * Wrapper around Framer Motion's useInView with reduced motion support
 *
 * @param ref - React ref to the element to observe
 * @param options - Configuration options
 * @returns boolean - true when element is in view
 *
 * @example
 * ```tsx
 * const ref = useRef(null)
 * const isInView = useInView(ref, { once: true })
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     animate={{ opacity: isInView ? 1 : 0 }}
 *   >
 *     Content fades in when scrolled into view
 *   </motion.div>
 * )
 * ```
 */
export function useInView(ref: RefObject<Element>, options?: UseInViewOptions): boolean {
  const shouldReduce = useReducedMotion()

  // When reduced motion is preferred, trigger immediately
  // This prevents content from being hidden unnecessarily
  const inView = useFramerInView(ref, {
    ...options,
    // Always trigger once if reduced motion is enabled
    once: shouldReduce ? true : options?.once,
    // Reduce margin for immediate triggering with reduced motion
    margin: shouldReduce ? '0px' : options?.margin,
  })

  // If reduced motion is preferred, always return true
  // This ensures content is visible immediately
  return shouldReduce ? true : inView
}

/**
 * Export useReducedMotion for convenience
 */
export { useReducedMotion } from './utils'
