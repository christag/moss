/**
 * Animation Configuration
 *
 * Standard durations, easings, and configuration for Framer Motion animations.
 * All animations respect prefers-reduced-motion via Framer Motion's built-in support.
 */

/**
 * Standard animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  /** Fast transitions (150ms) - button hover, checkboxes, small interactions */
  fast: 150,
  /** Normal transitions (250ms) - inputs, cards, modal open/close */
  normal: 250,
  /** Slow transitions (400ms) - page transitions, complex animations */
  slow: 400,
} as const

/**
 * Standard easing functions
 * Using cubic-bezier values compatible with Framer Motion
 */
export const ANIMATION_EASINGS = {
  /** Ease in and out - for continuous motion (hovers, toggles) */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Ease out - for elements entering (slide in, fade in) */
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  /** Ease in - for elements exiting (slide out, fade out) */
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Spring physics - for natural motion (modals, drawers, drag) */
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
} as const

/**
 * Global Framer Motion configuration
 */
export const MOTION_CONFIG = {
  /** Respects prefers-reduced-motion system setting */
  reducedMotion: 'user' as const,
} as const

/**
 * Stagger configuration for list animations
 */
export const STAGGER_CONFIG = {
  /** Delay between staggered children in seconds */
  childDelay: 0.05, // 50ms
  /** Maximum stagger delay to prevent long waits on large lists */
  maxDelay: 0.5, // 500ms
} as const
