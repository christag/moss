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
| **EditableTable** | `src/components/EditableTable.tsx` | `apiEndpoint`, `columns`, `selectable`, `bulkActions` | Inline-editable table with bulk actions |
| **EditableCell** | `src/components/EditableCell.tsx` | `type`, `value`, `options`, `onSave` | Click-to-edit cell component |
| **BulkActionToolbar** | `src/components/BulkActionToolbar.tsx` | `selectedCount`, `actions`, `onClearSelection` | Sticky toolbar for bulk operations |
| **QuickCreateSection** | `src/components/QuickCreateSection.tsx` | `templateFields`, `onGenerate`, `examples` | Collapsible bulk creation wizard |
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

## Advanced Components

### EditableTable

Inline-editable table with multi-row selection and bulk actions. Pattern inspired by SonicWall's interface management.

**Use Cases**: Device interfaces, patch panel ports, user permissions, any list requiring inline editing.

```tsx
import { EditableTable, ColumnConfig } from '@/components/EditableTable'
import { BulkAction } from '@/components/BulkActionToolbar'

const columns: ColumnConfig<IO>[] = [
  {
    key: 'interface_name',
    label: 'Interface Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., eth0',
    width: '200px',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    width: '120px',
  },
]

const bulkActions: BulkAction[] = [
  {
    id: 'set-active',
    label: 'Set Active',
    icon: '✓',
    variant: 'primary',
    action: async (selectedIds) => {
      await fetch('/api/ios/bulk-update', {
        method: 'PATCH',
        body: JSON.stringify({ ids: Array.from(selectedIds), updates: { status: 'active' } }),
      })
    },
  },
]

<EditableTable<IO>
  apiEndpoint={`/api/ios?device_id=${deviceId}`}
  columns={columns}
  selectable={true}
  bulkActions={bulkActions}
  editable={true}
  updateEndpoint="/api/ios/:id"
  deleteEndpoint="/api/ios/:id"
  limit={50}
/>
```

**Key Features**:
- Click-to-edit cells (text, number, select, toggle)
- Multi-row selection with checkboxes
- Bulk action toolbar (appears when rows selected)
- Sortable columns
- API-integrated CRUD operations
- Real-time validation

### QuickCreateSection

Collapsible wizard for bulk creation of child objects (interfaces, ports, modules).

**Use Cases**: Creating 24/48 switch ports, patch panel ports, line cards, sequential devices.

```tsx
import { QuickCreateSection, QuickCreateField } from '@/components/QuickCreateSection'

const templateFields: QuickCreateField[] = [
  {
    key: 'interface_type',
    label: 'Interface Type',
    type: 'select',
    defaultValue: 'ethernet',
    options: [
      { value: 'ethernet', label: 'Ethernet' },
      { value: 'fiber_optic', label: 'Fiber' },
    ],
  },
  {
    key: 'speed',
    label: 'Speed',
    type: 'text',
    defaultValue: '1G',
    placeholder: '1G, 10G',
  },
]

const handleGenerate = (items: Array<Record<string, unknown>>) => {
  // Items contain generated data with sequential names
  console.log(items)
  // e.g., [{ name: 'gi0/1', interface_type: 'ethernet', speed: '1G' }, ...]
}

<QuickCreateSection
  title="Quick Create Interfaces"
  description="Generate multiple interfaces for this device"
  templateFields={templateFields}
  onGenerate={handleGenerate}
  examples={[
    'Create 24 ports: gi0/1 - gi0/24',
    'Create 48 ports: Ethernet {n} where n = 1-48',
  ]}
  defaultQuantity={24}
  maxQuantity={96}
  defaultPattern="gi0/{n}"
/>
```

**Key Features**:
- Collapsible section (doesn't clutter form)
- Sequential name generation with `{n}` placeholder
- Configurable starting number
- Template fields (common properties)
- Live preview of generated items
- Examples to guide users

**Integration Pattern** (DeviceForm, RoomForm):
```tsx
// 1. Add state
const [generatedItems, setGeneratedItems] = useState<Array<Record<string, unknown>>>([])

// 2. Custom success handler
const handleSuccess = async (createdObject: unknown) => {
  const objectData = createdObject as { id: string }

  if (generatedItems.length > 0) {
    const itemsWithParentId = generatedItems.map(item => ({
      ...item,
      interface_name: item.name,
      device_id: objectData.id, // or room_id
    }))

    await fetch('/api/ios/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ items: itemsWithParentId }),
    })
  }

  onSuccess?.(createdObject)
}

// 3. Render component (only in create mode)
{!isEditMode && (
  <QuickCreateSection
    title="Quick Create Interfaces"
    // ... config
    onGenerate={setGeneratedItems}
  />
)}
```

### EditableCell

Low-level component for inline editing. Used internally by EditableTable but can be used standalone.

**Supported Types**: `text`, `number`, `select`, `toggle`

```tsx
import { EditableCell } from '@/components/EditableCell'

<EditableCell
  type="text"
  value={interfaceName}
  onSave={async (newValue) => {
    await updateInterface(id, { interface_name: newValue })
  }}
  placeholder="Enter name"
/>

<EditableCell
  type="select"
  value={status}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
  onSave={async (newValue) => {
    await updateInterface(id, { status: newValue })
  }}
/>
```

**Keyboard Shortcuts**:
- Click to edit
- Enter to save
- Escape to cancel
- Tab to move to next cell

### BulkActionToolbar

Sticky toolbar for bulk operations. Appears when rows are selected in EditableTable.

```tsx
import { BulkActionToolbar, BulkAction } from '@/components/BulkActionToolbar'

const actions: BulkAction[] = [
  {
    id: 'activate',
    label: 'Activate',
    icon: '✓',
    variant: 'primary',
    action: async (selectedIds) => {
      // Perform bulk operation
    },
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: '🗑',
    variant: 'destructive',
    action: async (selectedIds) => {
      if (confirm('Delete?')) {
        // Delete selected
      }
    },
  },
]

<BulkActionToolbar
  selectedCount={selectedIds.size}
  actions={actions}
  onClearSelection={() => setSelectedIds(new Set())}
/>
```

## API Patterns

### Bulk Update Endpoint

```typescript
// /api/ios/bulk-update/route.ts
// Supports two formats:

// Format 1: Ids + shared updates (used by bulk actions)
{
  ids: ['uuid1', 'uuid2'],
  updates: { status: 'active' }
}

// Format 2: Individual updates (used by table)
{
  updates: [
    { id: 'uuid1', status: 'active', speed: '1G' },
    { id: 'uuid2', status: 'inactive' }
  ]
}
```

### Bulk Create Endpoint

```typescript
// /api/ios/bulk-create/route.ts
{
  items: [
    { interface_name: 'gi0/1', interface_type: 'ethernet', device_id: 'uuid' },
    { interface_name: 'gi0/2', interface_type: 'ethernet', device_id: 'uuid' },
    // ... up to 100 items
  ]
}
```

## Recent Updates

**2025-10-18**: UI Density Improvements (Phase 1-3 Complete)
- ✅ EditableTable component with inline editing
- ✅ BulkActionToolbar for multi-row operations
- ✅ QuickCreateSection for bulk child creation
- ✅ Bulk update/create API endpoints
- ✅ Integrated into DeviceForm and RoomForm
- ✅ Updated Device detail page to use EditableTable

**2025-10-16**: Complete Figma design implementation
- ✅ Updated Button variants (primary now black)
- ✅ New Input/Select error states (#E02D3C)
- ✅ Custom Checkbox with SVG checkmark
- ✅ Pagination component created
- ✅ Breadcrumb styling updated
- ✅ Footer component created
- ✅ Horizontal rules added to CSS
- ✅ New component color variables added
