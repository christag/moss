# Animation Guidelines

This document provides guidelines for implementing animations in M.O.S.S. using Framer Motion. Following these guidelines ensures consistent, performant, and accessible animations across the application.

## Table of Contents

- [Standard Durations](#standard-durations)
- [Standard Easings](#standard-easings)
- [Animation Presets](#animation-presets)
- [Code Examples](#code-examples)
- [Performance Best Practices](#performance-best-practices)
- [Accessibility](#accessibility)
- [Do's and Don'ts](#dos-and-donts)

---

## Standard Durations

Use these standard durations for consistency:

| Duration | Value | Use Cases |
|----------|-------|-----------|
| **Fast** | 150ms | Button hover, checkboxes, toggles, small interactions |
| **Normal** | 250ms | Inputs, cards, modal open/close, dropdowns |
| **Slow** | 400ms | Page transitions, complex animations, empty states |

### When to Use Each Duration

- **Fast (150ms)**: Micro-interactions that should feel instant but smooth
  - Button hover/tap
  - Checkbox check/uncheck
  - Small icon rotations
  - Tooltip show/hide

- **Normal (250ms)**: Standard UI transitions
  - Form input focus
  - Card hover effects
  - Modal animations
  - Tab switching
  - Dropdown menus

- **Slow (400ms)**: Deliberate, noticeable transitions
  - Page transitions
  - Large content area changes
  - Empty state animations
  - Multi-step form progress

---

## Standard Easings

| Easing | Cubic Bezier | Use Cases |
|--------|--------------|-----------|
| **easeOut** | `[0, 0, 0.2, 1]` | Elements entering (slide in, fade in) |
| **easeIn** | `[0.4, 0, 1, 1]` | Elements exiting (slide out, fade out) |
| **easeInOut** | `[0.4, 0, 0.2, 1]` | Continuous motion (hovers, toggles) |
| **spring** | `{ type: 'spring', stiffness: 300, damping: 30 }` | Natural motion (modals, drawers, drag) |

### When to Use Each Easing

- **easeOut**: Elements entering the screen
  ```tsx
  // Modal opening, cards appearing
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ease: [0, 0, 0.2, 1] }}
  ```

- **easeIn**: Elements leaving the screen
  ```tsx
  // Modal closing, toast dismissing
  exit={{ opacity: 0, y: -20 }}
  transition={{ ease: [0.4, 0, 1, 1] }}
  ```

- **easeInOut**: Elements that move continuously or loop
  ```tsx
  // Button hover, toggle switches
  whileHover={{ scale: 1.02 }}
  transition={{ ease: [0.4, 0, 0.2, 1] }}
  ```

- **spring**: Natural, physics-based motion
  ```tsx
  // Modal opening with bounce, drawer sliding
  animate={{ x: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  ```

---

## Animation Presets

M.O.S.S. provides reusable animation presets in `/src/lib/animations/presets.ts`.

### Available Presets

#### `fadeIn`
Simple opacity fade (0 → 1).

```tsx
import { fadeIn } from '@/lib/animations/presets'

<motion.div variants={fadeIn} initial="initial" animate="animate">
  Content fades in
</motion.div>
```

#### `slideUp`
Slide up with fade (Y: 20px → 0, opacity: 0 → 1).

```tsx
import { slideUp } from '@/lib/animations/presets'

<motion.div variants={slideUp} initial="initial" animate="animate">
  Content slides up
</motion.div>
```

#### `slideDown`
Slide down with fade (Y: -20px → 0, opacity: 0 → 1).

```tsx
import { slideDown } from '@/lib/animations/presets'

<motion.div variants={slideDown} initial="initial" animate="animate">
  Content slides down
</motion.div>
```

#### `scaleUp`
Scale up with fade (scale: 0.95 → 1.0, opacity: 0 → 1).

```tsx
import { scaleUp } from '@/lib/animations/presets'

<motion.div variants={scaleUp} initial="initial" animate="animate">
  Content scales up
</motion.div>
```

#### `staggerContainer` + `staggerItem`
Parent-child stagger effect for lists.

```tsx
import { staggerContainer, staggerItem } from '@/lib/animations/presets'

<motion.div variants={staggerContainer} initial="initial" animate="animate">
  <motion.div variants={staggerItem}>Item 1</motion.div>
  <motion.div variants={staggerItem}>Item 2</motion.div>
  <motion.div variants={staggerItem}>Item 3</motion.div>
</motion.div>
```

#### `modalBackdrop` + `modalContent`
Modal backdrop and content animations.

```tsx
import { modalBackdrop, modalContent } from '@/lib/animations/presets'

<AnimatePresence>
  {isOpen && (
    <>
      <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" />
      <motion.div variants={modalContent} initial="initial" animate="animate" exit="exit">
        Modal content
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## Code Examples

### Button with Hover/Tap Animation

```tsx
import { motion } from 'framer-motion'

<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

### Card with Hover Lift

```tsx
import { motion } from 'framer-motion'

<motion.div
  whileHover={{
    y: -4,
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
  }}
  transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
>
  Card content
</motion.div>
```

### Page Transition

```tsx
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations/presets'

export default function Page() {
  return (
    <motion.div variants={slideUp} initial="initial" animate="animate">
      <h1>Page Content</h1>
    </motion.div>
  )
}
```

### List with Stagger Effect

```tsx
import { AnimatedList } from '@/components/animations/AnimatedList'

<AnimatedList
  items={devices}
  renderItem={(device) => <DeviceCard device={device} />}
  keyExtractor={(device) => device.id}
/>
```

### Modal with Animations

```tsx
import { Modal } from '@/components/ui/Modal'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  Modal content with automatic animations
</Modal>
```

### Skeleton Loading State

```tsx
import { Skeleton, SkeletonCard } from '@/components/animations/Skeleton'

// Single skeleton
<Skeleton variant="text" width="200px" />

// Card skeleton
<SkeletonCard />

// Custom skeleton
<Skeleton variant="rectangle" width="100%" height="200px" />
```

### Progress Bar

```tsx
import { ProgressBar } from '@/components/animations/ProgressBar'

<ProgressBar
  progress={uploadProgress}
  variant="primary"
  showLabel
  label="Uploading files..."
/>
```

---

## Performance Best Practices

### 1. Use GPU-Accelerated Properties

✅ **Animate these properties** (GPU-accelerated):
- `transform` (translate, scale, rotate)
- `opacity`

❌ **Avoid animating** (causes reflows/repaints):
- `width`, `height`
- `top`, `left`, `bottom`, `right`
- `margin`, `padding`
- `border-width`

### Good Example
```tsx
// GPU-accelerated
<motion.div
  animate={{ x: 100, opacity: 1 }}
/>
```

### Bad Example
```tsx
// Causes reflow (slow!)
<motion.div
  animate={{ width: '200px', marginLeft: '20px' }}
/>
```

### 2. Use `will-change` Sparingly

Only apply `will-change` to elements that will definitely animate:

```tsx
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: 100 }}
/>
```

⚠️ **Warning**: Don't use `will-change` everywhere! It consumes memory.

### 3. Limit Concurrent Animations

Avoid animating too many elements simultaneously:

```tsx
// Good: Stagger animations
<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Bad: All animate at once
{items.map(item => (
  <motion.div key={item.id} animate={{ opacity: 1 }}>
    {item.content}
  </motion.div>
))}
```

### 4. Use `AnimatePresence` for Exit Animations

Always wrap components that need exit animations:

```tsx
import { AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Optimize Large Lists

For lists with many items, consider:
- Virtual scrolling (react-window)
- Limiting stagger to first N items
- Using CSS transitions instead of Framer Motion for simple effects

---

## Accessibility

### Reduced Motion Support

**CRITICAL**: All animations MUST respect `prefers-reduced-motion`.

Framer Motion handles this automatically with the global config:

```tsx
// In config.ts
export const MOTION_CONFIG = {
  reducedMotion: 'user' // Respects system preference
}
```

### What Changes with Reduced Motion?

| Animation Type | Standard | Reduced Motion |
|----------------|----------|----------------|
| **Page transitions** | Slide + fade | Fade only |
| **Button hover** | Scale | No animation |
| **Card hover** | Lift + shadow | No animation |
| **Modals** | Scale + fade | Fade only |
| **Lists** | Stagger + slide | Instant render |
| **Loading states** | Animated spinner | Static indicator |

### Using `useReducedMotion` Hook

```tsx
import { useReducedMotion } from '@/lib/animations/utils'

function Component() {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      animate={{
        opacity: 1,
        y: shouldReduce ? 0 : 20 // No Y movement with reduced motion
      }}
    />
  )
}
```

### Testing Reduced Motion

**macOS**:
1. System Settings → Accessibility → Display
2. Enable "Reduce Motion"

**Chrome DevTools**:
1. Open DevTools → Rendering tab
2. Check "Emulate CSS media feature prefers-reduced-motion"

---

## Do's and Don'ts

### ✅ Do

- **Do** use standard durations (150ms, 250ms, 400ms)
- **Do** animate `transform` and `opacity` only
- **Do** respect `prefers-reduced-motion`
- **Do** use animation presets for consistency
- **Do** test animations on slow devices (4x CPU throttling)
- **Do** provide exit animations with `AnimatePresence`
- **Do** use spring physics for natural motion
- **Do** keep animations subtle and fast
- **Do** test keyboard navigation with animations

### ❌ Don't

- **Don't** animate layout properties (width, height, margin)
- **Don't** use linear easing for UI animations
- **Don't** animate more than 20 elements simultaneously
- **Don't** forget to test with reduced motion enabled
- **Don't** add animations without measuring performance
- **Don't** use `will-change` everywhere
- **Don't** make animations longer than 400ms (feels slow)
- **Don't** auto-play animations without user interaction
- **Don't** animate on every state change (causes jank)

### Examples

#### ✅ Good
```tsx
// Subtle, performant button animation
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

#### ❌ Bad
```tsx
// Too much movement, animates layout properties
<motion.button
  whileHover={{
    scale: 1.2, // Too much!
    width: '200px', // Causes reflow!
    rotate: 360, // Unnecessary!
  }}
  transition={{ duration: 1 }} // Too slow!
>
  Click me
</motion.button>
```

---

## Testing Checklist

Before shipping animations:

- [ ] Animations respect `prefers-reduced-motion`
- [ ] Performance maintains 60 FPS (Chrome DevTools Performance tab)
- [ ] Animations work with keyboard navigation
- [ ] Exit animations work with `AnimatePresence`
- [ ] Only `transform` and `opacity` are animated
- [ ] Durations are ≤400ms
- [ ] Animations tested on slow devices (4x CPU throttling)
- [ ] No console errors or warnings
- [ ] Animations feel smooth and polished

---

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Presets](/src/lib/animations/presets.ts)
- [Animation Config](/src/lib/animations/config.ts)
- [Component Examples](/src/app/test/animations) (optional playground)
- [WCAG 2.1 Animation Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)

---

## Questions?

For questions about implementing animations in M.O.S.S., refer to:
- This guide
- Code examples in `/src/components/animations/`
- Existing animated components (Button, Card, Modal, etc.)
