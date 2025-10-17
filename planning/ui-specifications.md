# UI Architecture & Specifications

This document provides detailed UI/UX specifications for M.O.S.S. For high-level design principles, see [CLAUDE.md](../CLAUDE.md). For design system colors and typography, see [designguides.md](designguides.md).

## Page Structure Patterns

### Standard Detail View Pattern

All detail views follow a consistent pattern:

**Header Bar**:
- Breadcrumbs: Full navigation path (e.g., "Locations > New York Office > Server Room")
- Primary identifier (H1, large text)
- Status badge (colored, right of title)
- Action buttons (top-right): Edit, Delete, object-specific actions

**Quick Stats Row** (below header):
- 3-5 widget-style summary metrics
- Card format with icon, value, and label
- Examples: "15 Devices", "Active since Jan 2023", "5 Users"

**Main Content Area** (tabbed interface):
- **Overview Tab** (always first):
  - All primary fields from object schema
  - Organized in logical sections with headers
  - Two-column layout on desktop, single column on mobile
- **Relationship Tabs** (dynamically generated based on object type):
  - One tab per relationship type
  - Uses RelatedItemsList component
  - Shows count badge in tab label
- **History Tab** (always last):
  - Audit log: timestamp, user, action, changes
  - JSON diff viewer for before/after comparison
  - Filter by action type

**Relationships Panel** (right sidebar):
- Quick links to related objects
- Hierarchical relationships (parent/children)
- Click-through badges with counts
- Collapsible on narrow screens

### Standard List View Pattern

All list views follow this structure:

**Header**:
- Page title (H1)
- Search box (icon + placeholder text)
- Primary action button: "Add [Object Type]" (Morning Blue button)
- Secondary action buttons: Import, Export (Light Blue buttons)

**Filters Panel** (left sidebar):
- Collapsible sections by category
- Dynamic filters based on object schema
- Common filters: Status, Date range, Type
- Active filter chips shown above table
- "Clear all filters" button at bottom

**Table View**:
- Sortable columns (click header to sort)
- Configurable columns (show/hide via settings menu)
- Row click → navigate to detail view
- Bulk selection checkbox column (leftmost)
- Status badge column (colored indicators)
- Pagination controls (bottom): "Showing 1-50 of 250"

**View Options**:
- Table/Card view toggle (icon buttons)
- Results per page selector (25/50/100)
- Export current view button

**Bulk Actions Bar** (appears when items selected):
- Selection count: "5 items selected"
- Action dropdown: Export, Delete, Change Status, etc.
- Clear selection button

## Key UI Pages by Category

### Core Pages (MVP - Phase 1)

**1. Dashboard** (`/`)
- Widgets: Expiring warranties, expiring licenses, recent activity, quick stats
- 4-column grid layout (2 columns on tablet, 1 on mobile)
- Global search: Always visible in header with keyboard shortcut (/)
- Quick actions: Floating action button (FAB) for "Add new"

**2. Device List/Detail** (`/devices`, `/devices/[id]`)
- **List**: Table with columns: Name, Type, Location, Status, Warranty
- **Detail Tabs**: Overview, Assignment, Hardware, Network, Software, Documentation, History
- **Overview**: Basic info + specs (CPU, RAM, storage, OS)
- **Assignment**: Assigned person, group memberships
- **Hardware**: Serial, warranty, install date, manufacturer, model
- **Network**: IOs list with connectivity (uses RelatedItemsList)
- **Software**: Installed applications (uses RelatedItemsList)
- **Documentation**: Linked documents and external docs

**3. Person List/Detail** (`/people`, `/people/[id]`)
- **List**: Table with columns: Name, Type, Company, Location, Status
- **Detail Tabs**: Overview, Devices, Software, Groups, Licenses, Access, Documents, Direct Reports
- **Overview**: Contact info, employment details, manager
- **Devices**: Assigned devices (uses RelatedItemsList)
- **Direct Reports**: Recursive org chart (uses RelatedItemsList)
- **Access**: SaaS services and group-based access

**4. Location List/Detail** (`/locations`, `/locations/[id]`)
- **List**: Card view primary (shows address, device count, person count)
- **Detail Tabs**: Overview, Rooms, Devices, Networks, People, Documentation
- **Overview**: Address, contact, time zone, building info
- **Rooms**: Room list with type and device count (uses RelatedItemsList)

**5. Room Detail** (`/rooms/[id]`)
- **Detail Tabs**: Overview, Devices, Patch Panels, Documentation
- **Overview**: Room type, floor, access requirements
- **Devices**: All devices in room (uses RelatedItemsList)

**6. Network List/Detail** (`/networks`, `/networks/[id]`)
- **List**: Table with columns: Name, VLAN ID, Network address, Type, DHCP
- **Detail Tabs**: Overview, IOs, IP Addresses, Devices, Documentation
- **Overview**: CIDR, gateway, DNS, DHCP config
- **IOs**: Interfaces on this network (native + tagged)
- **IP Addresses**: All IPs on this network with usage chart

**7. Software Catalog List/Detail** (`/software`, `/software/[id]`)
- **List**: Table with columns: Name, Publisher, Category, Version
- **Detail Tabs**: Overview, Installed Applications, Licenses, SaaS Services

**8. SaaS Service List/Detail** (`/saas-services`, `/saas-services/[id]`)
- **List**: Table with columns: Name, Environment, Status, License count
- **Detail Tabs**: Overview, Access, SSO/Provisioning, Users, Groups, Licenses, Integrations, Documentation, Contracts
- **Overview**: Service details, business owner, technical contact
- **SSO/Provisioning**: SAML/OIDC config, SCIM status
- **Integrations**: Service-to-service relationships (uses RelatedItemsList)

**9. License List/Detail** (`/software-licenses`, `/software-licenses/[id]`)
- **List**: Table with columns: Name, Type, Seats, Utilized, Expiration
- **Detail Tabs**: Overview, Allocation, Assigned To, Services, Applications, Contract
- **Overview**: License key (masked), expiration, cost
- **Allocation**: Utilization chart (used vs available seats)

**10. Document List/Detail** (`/documents`, `/documents/[id]`)
- **List**: Table with columns: Title, Type, Updated, Author
- **Detail**: Markdown editor with preview pane (side-by-side)

**11. Contract List/Detail** (`/contracts`, `/contracts/[id]`)
- **List**: Table with columns: Vendor, Start Date, End Date, Value, Auto-renew
- **Detail Tabs**: Overview, Related Services, Related Licenses, Related Devices

**12. Global Search** (modal overlay, keyboard shortcut: `/`)
- Real-time suggestions grouped by object type
- Recent searches saved per user
- Advanced filters slide-out panel
- Saved searches for power users
- Results show: Icon, name, type, secondary info, status badge

### Advanced Pages (Phase 2)

**Network Topology View** (`/networks/topology`)
- Interactive graph with drag nodes
- Layout options: Hierarchical, force-directed, circular
- Filters: Device type, network, location
- Path tracing tool
- Export to PNG/SVG

**IP Address Management** (`/networks/ip-addresses`)
- Visual subnet map (grid showing used vs available)
- Table view with filters
- Subnet calculator tool (sidebar)
- Conflict detection alerts

**Custom Report Builder** (`/reports/builder`)
- Step 1: Select object type
- Step 2: Choose fields (drag-and-drop)
- Step 3: Apply filters
- Step 4: Set grouping/sorting
- Step 5: Preview results
- Step 6: Save or export (CSV, Excel, PDF)

**Bulk Import Wizard** (`/import`)
- Step 1: Select object type
- Step 2: Upload CSV
- Step 3: Map fields
- Step 4: Validate data (show errors)
- Step 5: Preview changes
- Step 6: Execute import
- Step 7: View results summary

**Audit Log View** (`/admin/audit-logs`)
- Filterable table: User, action, category, timestamp
- Expandable rows with JSON diff viewer
- Export to CSV

### Admin Pages

**Role List/Detail** (`/admin/rbac/roles`, `/admin/rbac/roles/[id]`)
- **List**: System roles (protected) + custom roles
- **Detail**: Role name, description, parent role, permission grid
- **Permission Grid Component**: 16 object types × 4 actions = 64 checkboxes

**Role Assignment** (`/admin/rbac/assignments`)
- List of all assignments with filters
- 5-step assignment wizard (AssignRoleModal):
  1. Select assignee (person or group)
  2. Select role
  3. Choose scope (global, location, specific objects)
  4. Select locations (if location scope)
  5. Add notes and review

**System Settings** (`/admin`)
- Sections: Branding, Storage, Authentication, Integrations, Fields, RBAC, Import/Export, Audit Logs, Notifications, Backup
- Sidebar navigation with active state highlighting
- Form-based configuration for each section

## Form Patterns

### Device Form UX
- Auto-populate manufacturer from model if previously entered
- Filter room dropdown by selected location
- Show/hide parent device field based on device type (show for "switch_module", hide for "server")
- Validate serial number uniqueness on blur
- Conditional fields:
  - OS fields only for computers/servers (os_type, os_version)
  - Power fields only for UPS/PDU (wattage, voltage)
  - Show parent device selector only for modular device types

### IO Form (Modal)
- Interface type dropdown dynamically changes available fields
- **For network IOs**: Show speed, duplex, trunk mode, VLAN fields
- **For power IOs**: Show voltage, amperage, wattage, connector type
- **For broadcast IOs**: Show media type specific to SDI/HDMI/XLR
- "Connect to IO" lookup with device filter (only show compatible IO types)
- Inline help text explains trunk mode options

### Person Form
- Manager lookup with search (shows name + title in results)
- Location dropdown affects available rooms
- Person type affects required fields:
  - Employees need: employee_id, hire_date
  - Contractors need: contract_end_date
  - Vendor contacts need: company_id

## Mobile-First Pages

Priority for mobile responsive design:

**1. Global Search** (iOS Safari optimized)
- Full-screen modal on mobile
- Keyboard auto-focus
- Swipe down to dismiss
- Results in card format (not table)

**2. Device Detail View** (field technician use case)
- Tabs become accordion sections
- Quick stats stacked vertically
- Action buttons in sticky footer bar
- Tap-to-call on phone numbers
- Camera button for adding device photos

**3. Person Detail View** (help desk lookups)
- Contact info with direct action buttons (call, email)
- Assigned devices in card view
- Collapsible sections for less-used info

**4. Network Detail View** (on-site troubleshooting)
- IP address table simplified (show only IP, device, status)
- IO list in card format with connection indicator
- "View topology" opens full-screen canvas

**5. Dashboard** (quick glance metrics)
- Widgets in single column
- Pull to refresh
- Swipeable widget carousel for secondary metrics

### Mobile-Specific Features
- QR code scanning for asset tags (opens device detail)
- Camera integration for device photos (from detail view action menu)
- Offline mode for cached data viewing (read-only)
- Tap-to-call on phone numbers throughout UI
- GPS location tagging for new device creation (auto-populate location field)

## Relationship Navigation

Every object detail view includes relationship tabs using the **RelatedItemsList** component pattern.

### RelatedItemsList Component

**Component**: `src/components/RelatedItemsList.tsx`

**Props**:
- `apiEndpoint`: URL to fetch related items (e.g., `/api/rooms?location_id=${id}`)
- `columns`: Array of column definitions (key, label, render function, width)
- `linkPattern`: URL pattern for navigation (e.g., `/devices/:id`)
- `addButtonLabel`: Text for "Add New" button
- `onAdd`: Callback for add button click
- `emptyMessage`: Text shown when no items exist
- `limit`: Max items to display (default 20)

**Features**:
- Generic component: `RelatedItemsList<T extends { id: string }>`
- API-driven data fetching with loading/error states
- Configurable columns with custom render functions
- Click-through navigation via linkPattern
- "Add New" button support with pre-populated parent IDs
- Item count badges and pagination messaging

**Usage Pattern**:
```typescript
<RelatedItemsList<Room>
  apiEndpoint={`/api/rooms?location_id=${id}`}
  columns={[
    { key: 'room_name', label: 'Room Name' },
    { key: 'room_number', label: 'Room #', width: '100px' },
    {
      key: 'room_type',
      label: 'Type',
      render: (room) => <Badge variant="blue">{room.room_type}</Badge>,
      width: '150px'
    }
  ]}
  linkPattern="/rooms/:id"
  addButtonLabel="Add Room"
  onAdd={() => router.push(`/rooms/new?location_id=${id}`)}
  emptyMessage="No rooms at this location"
  limit={20}
/>
```

### Core UI Components

#### Pagination Component

**Component**: `src/components/ui/Pagination.tsx`

**Design Specs** (from Figma `pagination.svg`):
- Button size: 32px × 32px
- Gap between elements: 12px
- Border radius: 4px
- Font size: 16px, weight: 500

**Colors**:
- Active page: Black background (#231F20), white text
- Inactive pages: Gray text (#6B7885, 70% opacity)
- Hover: Light gray background (rgba(107, 120, 133, 0.1))
- Disabled: 30% opacity

**Props**:
- `currentPage`: Current page number (1-indexed)
- `totalPages`: Total number of pages
- `onPageChange`: Callback when page changes
- `maxVisiblePages`: Maximum page numbers to show (default 6)
- `className`: Optional CSS class

**Features**:
- Ellipsis for large page ranges
- Previous/Next arrow buttons
- Disabled state when at boundaries
- Keyboard accessible
- ARIA labels for screen readers

**Usage Pattern**:
```typescript
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  maxVisiblePages={6}
/>
```

#### Breadcrumb Component

**Component**: `src/components/ui/Breadcrumb.tsx`

**Design Specs** (from Figma `Breadcrumb.svg`):
- Font size: 14px, line height: 21px
- Gap between items: 8px
- Separator: "/" with 4px margin
- Padding: 12px vertical, 16px bottom margin

**Colors**:
- Links: Black (#231F20) with opacity change on hover
- Current page: Bold (weight 600)
- Separator: Black, weight 400

**Props**:
- `items`: Array of `{ label: string, href?: string }`
- `className`: Optional CSS class

**Features**:
- Auto-generates separators
- Last item is non-clickable
- Hover states on links
- Keyboard accessible
- ARIA landmark navigation

**Usage Pattern**:
```typescript
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'People', href: '/people' },
    { label: 'John Doe' }
  ]}
/>
```

#### Button Component

**Component**: `src/components/ui/Button.tsx`

**Design Specs** (from Figma, updated 2025-10-16):
- Height: 44px
- Padding: 11px vertical, 24px horizontal
- Font size: 18px (--font-size-md)
- Font weight: 500 (medium)
- Border radius: 4px
- Line height: Tight

**Variants**:
- **Primary**: Black background (#231F20), white text
  - Hover: 85% opacity black
- **Secondary**: White background, #6B7885 border (2px), black text
  - Hover: Light gray background, black border
  - Padding: 9px/22px (compensate for border)
- **Outline**: White background, black border (2px)
  - Hover: Black background, white text
  - Padding: 9px/22px (compensate for border)
- **Destructive**: Orange background (#FD6A3D), white text
  - Hover: 90% opacity

**Disabled State**:
- Background: #CFCFCF
- Text: Black 40% opacity
- Border: #CFCFCF
- Cursor: not-allowed

**Props**:
- `variant`: 'primary' | 'secondary' | 'outline' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `onClick`: Callback function
- `children`: Button content

#### Input Component

**Component**: `src/components/ui/Input.tsx`

**Design Specs** (from Figma `Input/` folder, updated 2025-10-16):
- Height: 44px
- Padding: 11px vertical, 18px horizontal
- Font size: 18px
- Border: 1px solid #6B7885
- Border radius: 4px
- Background: White

**States**:
- **Default**: Gray border (#6B7885)
- **Focus**: Black border (#231F20), box-shadow: 0 0 0 1px black
- **Error**: Red border (#E02D3C), light red background (rgba(224, 45, 60, 0.03))
- **Valid**: Green border (#28C077)
- **Disabled**: Gray background (#CFCFCF), 60% opacity

**Error Display**:
- Error text: 6px margin-top, 14px font size
- Error color: #E02D3C
- Error icon: Red X on right side

**Label**:
- Font size: 14px, weight: 500 (medium)
- Margin bottom: 8px
- Required indicator: Orange asterisk

**Helper Text**:
- Font size: 14px
- Color: #6B7885
- Margin top: 6px

**Props**:
- `label`: Input label text
- `type`: HTML input type
- `placeholder`: Placeholder text
- `helperText`: Helper/hint text
- `error`: Error message string
- `required`: Shows asterisk
- `disabled`: Disabled state

#### Select Component

**Component**: `src/components/ui/Select.tsx`

**Design Specs**: Same as Input component
- Height: 44px
- Padding: 11px vertical, 18px horizontal
- Same border, focus, and error states as Input

**Props**:
- `label`: Select label text
- `options`: Array of `{ value: string, label: string }`
- `helperText`: Helper text
- `error`: Error message
- `required`: Shows asterisk
- `disabled`: Disabled state

#### Checkbox Component

**Component**: `src/components/ui/Checkbox.tsx`

**Design Specs** (from Figma `Input/Checkbox.svg`, updated 2025-10-16):
- Size: 19px × 19px
- Border radius: 3.5px
- Border: 1px solid #6B7885 (default)
- Checkmark: Custom SVG (14px × 11px)

**States**:
- **Unchecked**: White background, gray border
- **Checked**: Black background (#231F20), white checkmark
- **Hover**: Black border
- **Focus**: 2px outline, 2px offset
- **Disabled**: Gray background (#CFCFCF), reduced opacity

**Label Spacing**:
- Gap between checkbox and label: 8px
- Font size: 16px
- Required asterisk: Orange, 1px left margin

**Props**:
- `label`: Checkbox label text
- `helperText`: Additional information text
- `error`: Error message
- `required`: Shows asterisk
- `disabled`: Disabled state

#### Footer Component

**Component**: `src/components/Footer.tsx`

**Design Specs** (from Figma `Footer Updates.svg`):
- Background: Black (#231F20)
- Text color: Off-white with opacity variations
- Padding: 48px top, 24px bottom

**Layout**:
- 4-column grid (responsive to 2-column, then 1-column)
- Gap: 40px between sections
- Max width: 1280px, centered

**Sections**:
1. Brand (M.O.S.S. heading + description)
2. Quick Links (Dashboard, People, Devices, Networks)
3. Resources (Admin, Import, Documentation)
4. Support (Report Issue, GitHub)

**Bottom Bar**:
- Divider: 1px line, 20% opacity white, 32px margin top
- Copyright text: 14px, 60% opacity
- Legal links: Privacy, Terms (separated by •)
- Flex layout: space-between

**Link Styles**:
- Default: 70% opacity white, 14px font
- Hover: Full opacity white
- Focus: 2px white outline, 2px offset

#### Horizontal Rules

**CSS Classes**: Applied to `<hr>` element

**Design Specs** (from Figma `Horizontal Rule.svg`):
- Default: 1px solid #C4C4C4
- Margin: var(--spacing-lg) top and bottom
- No background color

**Variants**:
- `.hr-thick`: 2px border width
- `.hr-thin`: 1px border width (same as default)

**Usage**:
```tsx
<hr /> {/* Standard 1px */}
<hr className="hr-thick" /> {/* 2px thick */}
```

### Standard Relationship Tabs by Object Type

**Locations**:
- Rooms tab (RelatedItemsList: room_name, room_number, room_type)
- Devices tab (RelatedItemsList: device_name, device_type, status)
- People tab (RelatedItemsList: name, person_type, title)

**Devices**:
- Interfaces/Ports tab (RelatedItemsList: interface_name, interface_type, connected_to)
- Child Devices tab (RelatedItemsList: device_name, model, serial_number)
- Installed Applications tab (RelatedItemsList: software_name, version, install_date)

**People**:
- Assigned Devices tab (RelatedItemsList: device_name, device_type, assignment_date)
- Direct Reports tab (RelatedItemsList: name, title, department) - Recursive
- Groups tab (RelatedItemsList: group_name, group_type, membership_type)

**Networks**:
- Interfaces tab (RelatedItemsList: device_name, interface_name, trunk_mode)
- IP Addresses tab (RelatedItemsList: ip_address, device, dns_name, type)
- Devices tab (RelatedItemsList: device_name, device_type, interface_count)

**Rooms**:
- Devices tab (RelatedItemsList: device_name, device_type, status)
- Patch Panels tab (when implemented)

**Software**:
- Installed Applications tab (when implemented)
- Licenses tab (when implemented)
- SaaS Services tab (when implemented)

### Navigation Flows Enabled

- Location → Rooms → Devices → IOs
- Person → Assigned Devices → IOs
- Person → Direct Reports (recursive org chart navigation)
- Network → Interfaces → Devices
- Device → Parent Device (modular equipment hierarchy)

## Search & Filter UX

### Global Search

**Header Search Box** (always visible):
- Icon: Magnifying glass (left)
- Placeholder: "Search devices, people, locations..."
- Keyboard shortcut indicator: "/" (right side, subtle)
- Focus behavior: Expands width by 50px on focus

**Search Modal** (opens on keyboard shortcut or click):
- Full-screen overlay with backdrop blur
- Search input at top (auto-focus)
- Real-time suggestions below (grouped by object type)
- Recent searches section (shows last 5)
- "Advanced filters" link at bottom

**Search Results**:
- Grouped by object type (Devices, People, Locations, etc.)
- Each result shows:
  - Object type icon (colored)
  - Primary identifier (bold)
  - Secondary info (gray text, 2-3 key fields)
  - Status badge
- Click result → navigate to detail view
- Keyboard navigation: Arrow keys to select, Enter to open

**Advanced Filters** (slide-out panel from right):
- Object type selector (checkboxes for multi-select)
- Status filter (active, inactive, retired)
- Date range picker (created, updated)
- Location filter (hierarchical tree selector)
- Save search button (top-right)

**Saved Searches** (power users):
- List of saved searches in dropdown
- Edit/delete saved search
- Share search URL

### List View Filters

**Sidebar Filter Panel** (left side):
- Collapsible sections:
  - Status (checkboxes)
  - Type (checkboxes)
  - Date Range (date pickers)
  - Location (tree selector)
  - Object-specific filters (dynamic)
- Filters persist in URL query params (shareable links)
- "Apply filters" button (bottom)
- "Clear all filters" link (bottom)

**Active Filter Chips** (above table):
- Show active filters as removable chips
- Click "X" to remove individual filter
- "Clear all" button to remove all filters
- Filter count badge in sidebar toggle button

**Filter Count Badges**:
- Show count of active filters per section
- Example: "Status (2)", "Type (1)"
- Highlight sections with active filters

## Typography System

For complete typography specifications, see [designguides.md](designguides.md).

**Font Family**: Inter (all headings and body copy)

**Type Scale** (base 18px, ratio 1.25):
- Display: 72px (page titles, hero text)
- H1: 57.6px (main page heading)
- H2: 46px (section headings)
- H3: 36.8px (subsection headings)
- H4: 29.4px (card titles)
- H5: 23.5px (list item titles)
- Body: 18px (default text)
- Small: 14.4px (helper text, captions)

**Typography Rules**:
- Use scale for emphasis, NEVER text case (no UPPERCASE for emphasis)
- Always align to grid
- Generous padding (minimum 16px between sections)
- Consistent margins (24px top/bottom for sections)
- Left-align all text (no center alignment except for empty states)
- Don't let text overflow margins

## Grid System

For complete grid specifications, see [designguides.md](designguides.md).

**Structure**:
- Even number of columns (12-column system on desktop)
- Margin = 1/4 column width (3 columns worth = 25%)
- Gutter = 1/2 margin width (1.5 columns worth = 12.5%)
- Symmetrical column proportions

**Responsive Breakpoints**:
- Mobile: 1-4 columns (< 640px)
- Tablet: 6-8 columns (640px - 1024px)
- Desktop: 12 columns (> 1024px)

**Implementation**:
- All elements must align to grid
- No floating elements
- Canvas width determines column count
- Use CSS Grid or Flexbox for layout

## Color Usage Rules

For complete color specifications and palette, see [designguides.md](designguides.md).

### Status Colors (mapped to design system)
- Active: Green (#28C077)
- Inactive: Light Blue (#ACD7FF)
- Repair/Warning: Orange (#FD6A3D) or Tangerine (#FFBB5C)
- Retired: Brew Black at 40% opacity

### Criticality Colors
- Critical: Orange (#FD6A3D)
- High: Tangerine (#FFBB5C)
- Medium: Light Blue (#ACD7FF)
- Low: Green (#28C077)

### Action Colors
- Primary Actions: Morning Blue (#1C7FF2)
- Secondary Actions: Light Blue (#ACD7FF)
- Destructive Actions: Orange (#FD6A3D)
- Success Actions: Green (#28C077)

### Object Type Colors
- All object types use Morning Blue (#1C7FF2) or Light Blue (#ACD7FF) for consistency
- Differentiate via icons and labels, not color alone
- Exception: Status badges use semantic colors (see above)

## Design Strategy Rules

From [designguides.md](designguides.md):

**Do**:
- ✅ Use recognizable icons with clear focal points
- ✅ Logical, easy-to-follow element order
- ✅ Use scale and color for emphasis
- ✅ Sufficient text/background contrast
- ✅ Text alternatives for images
- ✅ Responsive layouts

**Don't**:
- ❌ No aggressive/overwhelming colors
- ❌ No menacing aesthetics
- ❌ Never rely solely on color to communicate
- ❌ No complicated navigation
- ❌ No tiny font sizes

## Accessibility Standards

**WCAG 2.1 AA Compliance**:
- Color contrast ratio: Minimum 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All interactive elements accessible via Tab/Arrow keys
- Focus indicators: Visible outline on all focusable elements
- ARIA labels: All interactive elements have descriptive labels
- Screen reader support: Proper heading hierarchy, alt text for images
- Minimum font size: 14px (Small text in type scale)

**Keyboard Shortcuts**:
- `/` - Global search
- `Esc` - Close modal/drawer
- `Ctrl/Cmd + K` - Command palette (future)
- Arrow keys - Navigate results, tabs, lists
- Enter - Activate selected item
- Tab - Move between form fields

**Screen Reader Considerations**:
- Descriptive page titles: "[Object Name] | M.O.S.S."
- Landmark regions: header, nav, main, aside, footer
- Live regions for status updates: "5 items selected", "Saved successfully"
- Skip to main content link (visually hidden, keyboard accessible)
