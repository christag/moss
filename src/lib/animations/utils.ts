/**
 * Animation Utilities
 *
 * Helper functions and hooks for animation behavior,
 * including reduced motion detection and animation conditionals.
 */

'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Respects the system prefers-reduced-motion setting
 *
 * @returns boolean - true if reduced motion is preferred
 *
 * @example
 * ```tsx
 * const shouldReduce = useReducedMotion()
 * return (
 *   <motion.div
 *     animate={{ opacity: 1, y: shouldReduce ? 0 : 20 }}
 *   />
 * )
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes to the media query
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Helper function to determine if animations should be enabled
 * Can be used for conditional animation logic
 *
 * @param prefersReducedMotion - Result from useReducedMotion hook
 * @returns boolean - true if animations should play
 *
 * @example
 * ```tsx
 * const shouldReduce = useReducedMotion()
 * if (shouldAnimate(!shouldReduce)) {
 *   // Play animation
 * }
 * ```
 */
export function shouldAnimate(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion
}

/**
 * Get reduced motion variant for animations
 * Transforms animations that should be disabled with reduced motion
 *
 * Rules:
 * - Disable: transform animations (scale, translate, rotate)
 * - Keep: opacity fades (essential for visibility)
 * - Disable: parallax and auto-playing animations
 *
 * @param prefersReducedMotion - Result from useReducedMotion hook
 * @param animation - Animation object with transform properties
 * @returns Modified animation object safe for reduced motion
 *
 * @example
 * ```tsx
 * const shouldReduce = useReducedMotion()
 * const animation = getReducedMotionVariant(shouldReduce, {
 *   opacity: 1,
 *   y: 0,
 *   scale: 1
 * })
 * // If reduced: { opacity: 1, y: 0, scale: 1 }
 * // If not reduced: { opacity: 1, y: 0, scale: 1 }
 * ```
 */
export function getReducedMotionVariant<T extends Record<string, unknown>>(
  prefersReducedMotion: boolean,
  animation: T
): Partial<T> {
  if (!prefersReducedMotion) {
    return animation
  }

  // Remove transform properties for reduced motion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { x, y, scale, rotate, rotateX, rotateY, rotateZ, ...safeAnimation } = animation as Record<
    string,
    unknown
  >

  return safeAnimation as Partial<T>
}
