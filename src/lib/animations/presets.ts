/**
 * Animation Presets
 *
 * Reusable animation variants for common UI patterns.
 * All presets include initial, animate, and exit states.
 * Respects prefers-reduced-motion via Framer Motion's reducedMotion config.
 *
 * Reduced Motion Policy:
 * - Transform animations (scale, translate, rotate) are disabled
 * - Opacity fades are kept (essential for visibility)
 * - Durations are shortened for remaining animations
 */

import { Variants } from 'framer-motion'
import { ANIMATION_DURATIONS, ANIMATION_EASINGS, STAGGER_CONFIG } from './config'

/**
 * Fade in animation
 * Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Keeps opacity fade
 */
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Slide up with fade
 * Y: 20px → 0, Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Only opacity fade (no Y translation)
 */
export const slideUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Slide down with fade
 * Y: -20px → 0, Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Only opacity fade (no Y translation)
 */
export const slideDown: Variants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Scale up with fade
 * Scale: 0.95 → 1.0, Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Only opacity fade (no scale)
 */
export const scaleUp: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Stagger container
 * Parent container for staggered children animations
 * Use with staggerItem on children
 *
 * @example
 * ```tsx
 * <motion.div variants={staggerContainer} initial="initial" animate="animate">
 *   <motion.div variants={staggerItem}>Child 1</motion.div>
 *   <motion.div variants={staggerItem}>Child 2</motion.div>
 * </motion.div>
 * ```
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: STAGGER_CONFIG.childDelay,
      delayChildren: 0,
    },
  },
  exit: {
    transition: {
      staggerChildren: STAGGER_CONFIG.childDelay / 2,
      staggerDirection: -1,
    },
  },
}

/**
 * Stagger item
 * Child element that fades in with stagger delay
 * Use inside staggerContainer parent
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Modal backdrop fade
 * Opacity: 0 → 0.5
 * Duration: Normal (250ms)
 */
export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 0.5,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeInOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeInOut,
    },
  },
}

/**
 * Modal content animation
 * Scale: 0.95 → 1.0, Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Only opacity fade
 */
export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: ANIMATION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}

/**
 * Toast notification slide in from top
 * Y: -100% → 0, Opacity: 0 → 1
 * Duration: Normal (250ms)
 * Reduced motion: Only opacity fade
 */
export const toastSlideTop: Variants = {
  initial: {
    opacity: 0,
    y: -100,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -100,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: ANIMATION_EASINGS.easeIn,
    },
  },
}
