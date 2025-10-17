# UI Components Reference

Quick reference guide for all M.O.S.S. UI components. For detailed specifications, see [planning/ui-specifications.md](planning/ui-specifications.md).

**Last Updated**: 2025-10-16 (Figma design implementation)

## Core Components

### Form Components

| Component | Path | Key Props | Design Specs |
|-----------|------|-----------|--------------|
| **Button** | `src/components/ui/Button.tsx` | `variant`, `size`, `disabled` | 44px height, black primary |
| **Input** | `src/components/ui/Input.tsx` | `label`, `error`, `helperText` | 44px height, white bg, #6B7885 border |
| **Select** | `src/components/ui/Select.tsx` | `options`, `label`, `error` | Same as Input |
| **Checkbox** | `src/components/ui/Checkbox.tsx` | `label`, `error`, `helperText` | 19×19px, custom SVG checkmark |
| **Textarea** | `src/components/ui/Textarea.tsx` | `label`, `rows`, `error` | Auto-height, same style as Input |

### Navigation Components

| Component | Path | Key Props | Design Specs |
|-----------|------|-----------|--------------|
| **Breadcrumb** | `src/components/ui/Breadcrumb.tsx` | `items[]` | 14px font, "/" separator, 8px gap |
| **Pagination** | `src/components/ui/Pagination.tsx` | `currentPage`, `totalPages`, `onPageChange` | 32×32px buttons, 12px gap, ellipsis |
| **Footer** | `src/components/Footer.tsx` | `className` | Black bg, 4-column grid, legal links |

### Display Components

| Component | Path | Key Props | Design Specs |
|-----------|------|-----------|--------------|
| **Card** | `src/components/ui/Card.tsx` | `children`, `className` | Border radius, shadow |
| **Badge** | `src/components/ui/Badge.tsx` | `variant`, `children` | Color-coded status |
| **Icon** | `src/components/ui/Icon.tsx` | `name`, `size` | SVG icons |

### Layout Components

| Component | Path | Key Props | Design Specs |
|-----------|------|-----------|--------------|
| **RelatedItemsList** | `src/components/RelatedItemsList.tsx` | `apiEndpoint`, `columns`, `linkPattern` | Generic list with click-through |
| **PageHeader** | `src/components/PageHeader.tsx` | `title`, `actions` | H1, action buttons |
| **Navigation** | `src/components/Navigation.tsx` | N/A | Top nav bar |

## Component Variants

### Button Variants

```tsx
<Button variant="primary">Primary</Button>       // Black bg, white text
<Button variant="secondary">Secondary</Button>   // White bg, gray border
<Button variant="outline">Outline</Button>       // White bg, black border
<Button variant="destructive">Delete</Button>    // Orange bg, white text
```

### Input States

```tsx
<Input label="Normal" />                         // Gray border
<Input label="Error" error="Required" />         // Red border (#E02D3C)
<Input label="Disabled" disabled />              // Gray bg (#CFCFCF)
<Input label="Required" required />              // Orange asterisk
```

### Checkbox States

```tsx
<Checkbox label="Standard" />
<Checkbox label="With Helper" helperText="Info" />
<Checkbox label="Error" error="Check this" />
<Checkbox label="Required" required />
```

## Design System Values

### Colors (CSS Variables)

```css
/* Primary Palette */
--color-blue: #1C7FF2          /* Morning Blue */
--color-black: #231F20          /* Brew Black */
--color-off-white: #FAF9F5      /* Off White */

/* Secondary Palette */
--color-green: #28C077
--color-orange: #FD6A3D
--color-tangerine: #FFBB5C

/* Component Colors (New) */
--color-border-default: #6B7885   /* Form borders */
--color-error-border: #E02D3C     /* Error states */
--color-disabled: #CFCFCF         /* Disabled elements */
--color-separator: #C4C4C4        /* Horizontal rules */
```

### Spacing Scale

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

### Typography Scale

```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-md: 18px      /* Base size */
--font-size-lg: 22.5px
--font-size-xl: 28.125px
--font-size-2xl: 35.16px
--font-size-3xl: 43.95px

/* Type Scale Ratio: 1.25 (Major Third) */
/* Base: 18px */
```

### Component Sizing

| Component | Height | Padding | Border Radius |
|-----------|--------|---------|---------------|
| Button | 44px | 11px/24px | 4px |
| Input | 44px | 11px/18px | 4px |
| Select | 44px | 11px/18px | 4px |
| Checkbox | 19×19px | - | 3.5px |
| Pagination Button | 32×32px | - | 4px |

## Common Patterns

### Form with Validation

```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
    helperText="We'll never share your email"
    required
  />

  <Select
    label="Role"
    options={roleOptions}
    value={role}
    onChange={(e) => setRole(e.target.value)}
    error={errors.role}
  />

  <Checkbox
    label="I agree to the terms"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    error={errors.agreed}
    required
  />

  <Button variant="primary" type="submit">
    Submit
  </Button>
</form>
```

### List with Pagination

```tsx
<div>
  <Breadcrumb items={[
    { label: 'Home', href: '/' },
    { label: 'People' }
  ]} />

  <PageHeader
    title="People"
    actions={
      <Button variant="primary" onClick={handleAdd}>
        Add Person
      </Button>
    }
  />

  {/* List content */}

  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={setPage}
  />
</div>
```

### Horizontal Rules

```tsx
<hr />                    {/* Standard 1px separator */}
<hr className="hr-thick" /> {/* 2px thick separator */}
```

## Testing Components

All components can be viewed at:
- **Showcase**: `/test/components` (comprehensive demo)
- **Storybook**: Coming soon

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Keyboard navigation
- ✅ Focus indicators (2px outline, 2px offset)
- ✅ ARIA labels
- ✅ Screen reader support
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Required field indicators

## Resources

- **Full UI Specs**: [planning/ui-specifications.md](planning/ui-specifications.md)
- **Design System**: [planning/designguides.md](planning/designguides.md)
- **Design System CSS**: [src/styles/design-system.css](src/styles/design-system.css)
- **Figma Designs**: [figma/](figma/) folder
- **Component Showcase**: http://localhost:3001/test/components

## Recent Updates

**2025-10-16**: Complete Figma design implementation
- ✅ Updated Button variants (primary now black)
- ✅ New Input/Select error states (#E02D3C)
- ✅ Custom Checkbox with SVG checkmark
- ✅ Pagination component created
- ✅ Breadcrumb styling updated
- ✅ Footer component created
- ✅ Horizontal rules added to CSS
- ✅ New component color variables added
