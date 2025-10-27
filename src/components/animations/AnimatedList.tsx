/**
 * Animated List Component
 *
 * Generic list component with staggered fade-in animations.
 * Supports adding, removing, and reordering items with smooth transitions.
 * Respects prefers-reduced-motion settings.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations/presets'
import { useReducedMotion } from '@/lib/animations/utils'

interface AnimatedListProps<T> {
  /** Array of items to render */
  items: T[]
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Function to extract unique key from item */
  keyExtractor: (item: T, index: number) => string
  /** Optional className for the list container */
  className?: string
  /** Layout mode for automatic layout animations */
  layout?: boolean
}

/**
 * Generic animated list with stagger effect
 *
 * Features:
 * - Staggered children with 50ms delay
 * - Smooth add/remove animations with AnimatePresence
 * - Automatic layout animations when items reorder
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * <AnimatedList
 *   items={devices}
 *   renderItem={(device) => <DeviceCard device={device} />}
 *   keyExtractor={(device) => device.id}
 * />
 * ```
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = '',
  layout = false,
}: AnimatedListProps<T>) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={!prefersReducedMotion ? staggerContainer : undefined}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item, index)}
            variants={!prefersReducedMotion ? staggerItem : undefined}
            layout={layout && !prefersReducedMotion}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
