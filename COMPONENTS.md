# M.O.S.S. Component Library

Complete reference for all UI components in the M.O.S.S. design system.

---

## Table of Contents

1. [Animation System](#animation-system)
2. [Form Components](#form-components)
3. [Layout Components](#layout-components)
4. [Navigation Components](#navigation-components)
5. [Data Display Components](#data-display-components)
6. [Feedback Components](#feedback-components)

---

## Animation System

M.O.S.S. uses Framer Motion for smooth, accessible animations throughout the application. All animations respect `prefers-reduced-motion` and maintain 60 FPS performance.

### Animation Infrastructure

**Location**: `/src/lib/animations/`

#### Configuration (`config.ts`)

Standard durations and easings for consistent animations:

```typescript
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/animations/config'

// Durations (in milliseconds)
ANIMATION_DURATIONS.fast    // 150ms - Button hover, checkboxes
ANIMATION_DURATIONS.normal  // 250ms - Inputs, cards, modals
ANIMATION_DURATIONS.slow    // 400ms - Page transitions

// Easings
ANIMATION_EASINGS.easeOut   // Elements entering
ANIMATION_EASINGS.easeIn    // Elements exiting
ANIMATION_EASINGS.easeInOut // Continuous motion
ANIMATION_EASINGS.spring    // Physics-based motion
```

#### Animation Presets (`presets.ts`)

Nine reusable animation presets:

```typescript
import { fadeIn, slideUp, scaleUp } from '@/lib/animations/presets'

// Available presets:
fadeIn          // Opacity 0 → 1
slideUp         // Y translation + fade in
slideDown       // Reverse slide up
scaleUp         // Scale 0.95 → 1.0 + fade in
staggerContainer // Parent for staggered children
staggerItem     // Child with stagger delay
modalBackdrop   // Backdrop fade (0 → 0.5)
modalContent    // Modal scale up + fade
toastSlideTop   // Toast slide from top
```

#### Utilities (`utils.ts`)

Helpers for reduced motion support:

```typescript
import { useReducedMotion, shouldAnimate } from '@/lib/animations/utils'

// Hook - returns true if user prefers reduced motion
const prefersReduced = useReducedMotion()

// Helper - checks if animations should be enabled
if (shouldAnimate()) {
  // Animate
}
```

#### Hooks (`hooks.ts`)

Scroll-driven animations:

```typescript
import { useInView } from '@/lib/animations/hooks'

const ref = useRef(null)
const isInView = useInView(ref, { once: true })
```

---

### Animation Components

#### PageTransition

Wraps page content with fade + slide-up animation.

**Location**: `/src/components/animations/PageTransition.tsx`

**Usage**:
```tsx
import PageTransition from '@/components/animations/PageTransition'

export default function MyPage() {
  return (
    <PageTransition>
      <h1>Page Content</h1>
    </PageTransition>
  )
}
```

**Props**: None - wraps children automatically

**Accessibility**: Respects `prefers-reduced-motion` (disables slide, keeps fade)

---

#### AnimatedList

Generic list component with staggered animations for items.

**Location**: `/src/components/animations/AnimatedList.tsx`

**Usage**:
```tsx
import AnimatedList from '@/components/animations/AnimatedList'

<AnimatedList
  items={devices}
  renderItem={(device) => <DeviceCard device={device} />}
  keyExtractor={(device) => device.id}
  enableLayout={true}
/>
```

**Props**:
- `items: T[]` - Array of items to render
- `renderItem: (item: T) => React.ReactNode` - Render function for each item
- `keyExtractor: (item: T) => string` - Unique key for each item
- `enableLayout?: boolean` - Enable automatic layout animations on reorder

**Animations**: 50ms stagger delay between children, fade in + slide up

**Accessibility**: Respects `prefers-reduced-motion` (disables slide, keeps fade)

---

#### Skeleton

Loading placeholder with animated shimmer effect.

**Location**: `/src/components/animations/Skeleton.tsx`

**Usage**:
```tsx
import { Skeleton, SkeletonText, SkeletonParagraph, SkeletonCard } from '@/components/animations/Skeleton'

// Basic skeleton
<Skeleton variant="rectangle" width="100%" height="200px" />

// Text line
<SkeletonText width="80%" />

// Paragraph (3 lines)
<SkeletonParagraph lines={3} />

// Card skeleton
<SkeletonCard />
```

**Props**:
- `variant?: 'text' | 'rectangle' | 'circle' | 'card'` - Shape of skeleton
- `width?: string` - Width (CSS value)
- `height?: string` - Height (CSS value)

**Helper Components**:
- `SkeletonText` - Single text line (width default: 100%)
- `SkeletonParagraph` - Multiple text lines (lines default: 3)
- `SkeletonCard` - Card-shaped skeleton

**Accessibility**: No reduced motion needed (shimmer is decorative)

---

#### ProgressBar

Animated progress indicator with spring physics.

**Location**: `/src/components/animations/ProgressBar.tsx`

**Usage**:
```tsx
import { ProgressBar, ProgressBarIndeterminate } from '@/components/animations/ProgressBar'

// Determinate progress
<ProgressBar progress={75} variant="primary" />

// Indeterminate loading
<ProgressBarIndeterminate variant="success" />
```

**Props** (ProgressBar):
- `progress: number` - Percentage (0-100)
- `variant?: 'primary' | 'success' | 'warning' | 'error'` - Color theme
- `height?: string` - Bar height (default: 8px)

**Props** (ProgressBarIndeterminate):
- `variant?: 'primary' | 'success' | 'warning' | 'error'` - Color theme
- `height?: string` - Bar height (default: 8px)

**Accessibility**: Progress announced to screen readers via `role="progressbar"`

---

#### Modal

Fully animated modal dialog with backdrop.

**Location**: `/src/components/ui/Modal.tsx`

**Usage**:
```tsx
import Modal from '@/components/ui/Modal'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Device"
  size="medium"
>
  <p>Modal content</p>
</Modal>
```

**Props**:
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal should close
- `title?: string` - Modal title
- `size?: 'small' | 'medium' | 'large'` - Modal width
- `children: React.ReactNode` - Modal content

**Features**:
- Backdrop fade (0 → 0.5 opacity, 250ms)
- Content scale up (0.95 → 1.0) + fade in
- Keyboard support (Escape to close)
- Focus trap (Tab cycles within modal)
- Click outside to close

**Accessibility**:
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Respects `prefers-reduced-motion` (disables scale, keeps fade)

---

### Enhanced Components with Animations

#### Button

**Location**: `/src/components/ui/Button.tsx`

**Animations Added**:
- Hover: Scale 1.02x (150ms)
- Tap: Scale 0.98x (tactile feedback)
- Loading: Spinner rotates smoothly (360deg infinite)

**Usage** (unchanged):
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

<Button variant="primary" loading>
  Saving...
</Button>
```

**Technical Note**: Uses motion.div wrapper to avoid Framer Motion type conflicts with button element.

**Accessibility**: Respects `prefers-reduced-motion` (disables scale, keeps opacity)

---

#### Card

**Location**: `/src/components/ui/Card.tsx`

**Animations Added**:
- Hover: Lift -4px with shadow increase (200ms easeOut)

**Usage**:
```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>

// Disable hover animation
<Card noHover>
  <CardContent>Static card</CardContent>
</Card>
```

**Props** (new):
- `noHover?: boolean` - Disable hover animation (default: false)

**Accessibility**: Respects `prefers-reduced-motion` (disables transform, keeps opacity)

---

#### Input

**Location**: `/src/components/ui/Input.tsx`

**Animations Added**:
- Focus: Border color transition + subtle glow (250ms)
- Error: Shake animation (keyframe animation)
- Error message: Slide down (200ms)

**Usage** (unchanged):
```tsx
import Input from '@/components/ui/Input'

<Input
  label="Device Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>
```

**Accessibility**:
- Error shake is brief (300ms) to avoid motion sickness
- Respects `prefers-reduced-motion` (disables shake)

---

#### Checkbox

**Location**: `/src/components/ui/Checkbox.tsx`

**Animations Enhanced**:
- Checkmark: Spring easing animation (cubic-bezier bounce, 200ms)

**Usage** (unchanged):
```tsx
import Checkbox from '@/components/ui/Checkbox'

<Checkbox
  label="Active"
  checked={isActive}
  onChange={(e) => setIsActive(e.target.checked)}
/>
```

**Accessibility**: Respects `prefers-reduced-motion` (instant check, no animation)

---

#### StatWidget (Dashboard)

**Location**: `/src/components/dashboard/StatWidget.tsx`

**Animations Added**:
- Count-up: Numbers animate from 0 to target (1.5s duration)

**Usage**:
```tsx
import StatWidget from '@/components/dashboard/StatWidget'

<StatWidget
  title="Total Devices"
  value={247}
  icon={<DeviceIcon />}
/>
```

**Accessibility**: Respects `prefers-reduced-motion` (shows final value immediately)

---

## Form Components

### Button

**Location**: `/src/components/ui/Button.tsx`

Multi-variant button with animation support (see [Button](#button) above).

**Variants**:
- `primary` - Black background (was blue), white text
- `secondary` - Light blue background, black text
- `outline` - Transparent with black border
- `destructive` - Orange background, white text

**Props**:
- `variant?: 'primary' | 'secondary' | 'outline' | 'destructive'`
- `loading?: boolean` - Show spinner, disable button
- `disabled?: boolean`
- `onClick?: () => void`
- Standard button HTML attributes

**Design Specs**: 44px height, 16px padding, border-radius 4px

---

### Input

**Location**: `/src/components/ui/Input.tsx`

Text input with label, error, and helper text support (see [Input](#input-1) above).

**Props**:
- `label?: string` - Label text
- `error?: string` - Error message (triggers red border + shake)
- `helperText?: string` - Helper text below input
- `required?: boolean` - Show asterisk on label
- Standard input HTML attributes

**Design Specs**: 44px height, white background, #6B7885 border, #E02D3C error state

---

### Select

**Location**: `/src/components/ui/Select.tsx`

Dropdown select with same styling as Input.

**Props**:
- `label?: string`
- `error?: string`
- `options: Array<{ value: string; label: string }>`
- `required?: boolean`
- Standard select HTML attributes

---

### Textarea

**Location**: `/src/components/ui/Textarea.tsx`

Multi-line text input with auto-height.

**Props**:
- `label?: string`
- `error?: string`
- `helperText?: string`
- `required?: boolean`
- `rows?: number` - Initial rows (default: 3)
- Standard textarea HTML attributes

---

### Checkbox

**Location**: `/src/components/ui/Checkbox.tsx`

Custom checkbox with animated checkmark (see [Checkbox](#checkbox-1) above).

**Props**:
- `label?: string`
- `checked: boolean`
- `onChange: (e: React.ChangeEvent<HTMLInputElement>) => void`
- `disabled?: boolean`

**Design Specs**: 19×19px, black when checked, custom SVG checkmark

---

## Layout Components

### Card

**Location**: `/src/components/ui/Card.tsx`

Container component with shadow and hover effect (see [Card](#card-1) above).

**Sub-components**:
- `Card` - Wrapper with padding and shadow
- `CardHeader` - Top section (often with title)
- `CardContent` - Main content area

**Usage**:
```tsx
<Card>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

---

### Badge

**Location**: `/src/components/ui/Badge.tsx`

Small status indicator with color variants.

**Variants**:
- `success` - Green background
- `warning` - Tangerine background
- `error` - Orange background
- `info` - Light blue background
- `default` - Gray background

**Usage**:
```tsx
import Badge from '@/components/ui/Badge'

<Badge variant="success">Active</Badge>
```

---

## Navigation Components

### Breadcrumb

**Location**: `/src/components/ui/Breadcrumb.tsx`

Hierarchical navigation with separators.

**Usage**:
```tsx
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb'

<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/devices">Devices</BreadcrumbItem>
  <BreadcrumbItem>Switch-01</BreadcrumbItem>
</Breadcrumb>
```

**Design Specs**: 14px font, "/" separator, 8px gap, black links with opacity hover

---

### Pagination

**Location**: `/src/components/ui/Pagination.tsx`

Page navigation for list views.

**Usage**:
```tsx
import Pagination from '@/components/ui/Pagination'

<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => setPage(page)}
/>
```

**Design Specs**: 32×32px buttons, 12px gap, ellipsis for large ranges

---

## Data Display Components

### GenericListView

**Location**: `/src/components/GenericListView.tsx`

Reusable list view with enhanced table, search, filters, and column management.

**Features**:
- Column management (show/hide columns)
- Per-column filtering
- Global search
- Sorting
- Pagination
- Bulk actions

**Usage**: See existing list pages (devices, people, locations)

---

### GenericDetailView

**Location**: `/src/components/GenericDetailView.tsx`

Reusable detail view with tabs and relationship panel.

**Tabs**:
- Overview (always first)
- Relationship tabs (dynamic based on object type)
- History (always last)

**Usage**: See existing detail pages (devices/[id], people/[id], locations/[id])

---

## Feedback Components

### Toast Notifications

**Library**: Sonner (already installed)

**Configuration**: Ready for setup in Providers component

**Planned Features**:
- Slide in from top/bottom
- Auto-dismiss after 5 seconds
- Stack multiple toasts with 50ms stagger
- Swipe-to-dismiss on touch devices

---

## Animation Guidelines

For complete animation documentation, see:
- [planning/animation-guidelines.md](/planning/animation-guidelines.md) - Comprehensive guide with durations, easings, performance tips, and do's/don'ts

**Key Principles**:
1. **Use standard durations**: Fast (150ms), Normal (250ms), Slow (400ms)
2. **GPU-accelerated only**: Animate transform and opacity only
3. **Respect reduced motion**: Always include reduced motion variants
4. **Test performance**: Target 60 FPS on all animations
5. **Keep it subtle**: Animations should enhance, not distract

**Reduced Motion Policy**:
- **Disabled**: Scale, translate, rotate animations
- **Kept**: Opacity fades (essential for visibility)
- **Shortened**: Durations reduced for remaining animations

---

## Testing Components

All components can be tested at `/test/components` (showcase page).

For animation testing, run Playwright tests:
```bash
npm run test:e2e
```

---

## Equipment Management Components

### QRCodeLabel

**Location**: `/src/components/QRCodeLabel.tsx`

Printable QR code labels for equipment tracking with print and PDF download capabilities.

**Usage**:
```tsx
import QRCodeLabel from '@/components/QRCodeLabel'

const [showLabel, setShowLabel] = useState(false)

<QRCodeLabel
  deviceId={device.id}
  assetTag={device.asset_tag}
  hostname={device.hostname}
  model={device.model}
  qrCodeDataUrl={qrCodeDataUrl}
  onClose={() => setShowLabel(false)}
/>
```

**Props**:
- `deviceId: string` - Device UUID
- `assetTag: string` - Asset tag identifier
- `hostname: string` - Device hostname
- `model?: string` - Device model (optional)
- `qrCodeDataUrl: string` - Base64-encoded QR code PNG data URL
- `onClose?: () => void` - Close modal callback

**Features**:
- Modal overlay with preview
- 2.5" × 2" label format optimized for Dymo/Brother label printers
- Print functionality via browser print dialog
- PDF download with jsPDF (filename: `{assetTag}-qr-label.pdf`)
- Centered QR code (1.5" × 1.5")
- Device info below QR code (asset tag, hostname, model)

**Design Specs**:
- Label size: 2.5" wide × 2" tall
- QR code: 1.5" × 1.5" centered
- Font: Helvetica Bold, 10pt for asset tag
- Print-optimized CSS (hides buttons, shows only label)

**Related Files**:
- `/src/lib/qrcode-utils.ts` - QR code generation utilities
- `/src/app/api/devices/generate-qr-codes/route.ts` - Bulk QR generation API

---

## Network Visualization Components

### NetworkTopologyViewer

**Location**: `/src/components/NetworkTopologyViewer.tsx`

Interactive network topology visualization component using Cytoscape.js for mapping physical and logical network connectivity.

**Usage**:
```tsx
import { NetworkTopologyViewer } from '@/components/NetworkTopologyViewer'

<NetworkTopologyViewer
  apiEndpoint="/api/topology/network?location_id=123"
  height="600px"
/>
```

**Props**:
- `apiEndpoint: string` (required) - API endpoint to fetch topology data
- `className?: string` - Additional CSS classes
- `height?: string` - Canvas height (default: `calc(100vh - 200px)`)

**Features**:
- **Multiple Layout Algorithms**: Cola (force-directed), Circular, Grid, Hierarchical
- **VLAN Filtering**: Show/hide nodes by VLAN with checkbox panel
- **VLAN Highlighting**: Click VLAN chip to highlight, dim non-matching elements to 30% opacity
- **Manual Positioning**: Drag nodes to reposition, positions persist in localStorage
- **Export**: SVG and PNG export with proper scaling
- **Interactive Navigation**:
  - Click node → Show tooltip with device details
  - Double-click node → Navigate to device detail page
  - Click edge → Show connection details
- **Keyboard Shortcuts**:
  - `+` - Zoom in
  - `-` - Zoom out
  - `F` - Fit to screen
  - `Escape` - Clear selection
  - `L` - Toggle Layer 2/Layer 3 view

**Node Styling** (Design System Compliant):
- **Shapes**: Triangle (router), Square (switch), Circle (server), Diamond (firewall)
- **Colors**: Morning Blue (#1C7FF2) for network devices, Green (#28C077) for servers
- **Sizing**: Based on connection count (40px min, 100px max)
- **Selection**: Orange border (#FD6A3D) when selected

**Edge Styling**:
- **Width**: Based on connection speed (2px for 1Gbps, scales up to 8px for 100Gbps)
- **Color**: Border-default (#6B7885) for normal, Morning Blue (#1C7FF2) when selected
- **Style**: Solid for physical, dashed for virtual connections

**Toolbar Controls**:
- Layout selector dropdown
- Zoom in/out buttons
- Fit to screen button
- Layer 2/Layer 3 view toggle
- Export dropdown (SVG, PNG)
- Fullscreen toggle

**Accessibility**:
- ARIA labels on all interactive elements
- Keyboard navigation support
- WCAG AA color contrast compliance
- Focus indicators on all controls

**Performance**:
- Handles 100+ nodes efficiently with built-in virtualization
- Database indexes on `ios.connected_to_io_id` and `ios.native_network_id`
- Optimized rendering with Cytoscape.js

**Related Files**:
- `/src/app/api/topology/network/route.ts` - Topology data API endpoint
- `/src/lib/schemas/topology.ts` - Zod validation schemas
- `/src/app/topology/page.tsx` - Full topology page with filters and legend
- `/migrations/023_topology_index.sql` - Performance indexes

---

## Future Components

Planned for Phase 2:
- Dropdown menu with animations
- Sidebar with expand/collapse animation
- Tabs with slide animation
- Empty state components
- Data visualization (charts)

---

## Related Documentation

- [planning/ui-specifications.md](/planning/ui-specifications.md) - UI patterns and design system
- [planning/designguides.md](/planning/designguides.md) - Design system colors and typography
- [planning/animation-guidelines.md](/planning/animation-guidelines.md) - Complete animation guide
- [CLAUDE.md](/CLAUDE.md) - Development guide and coding standards
