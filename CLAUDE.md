# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M.O.S.S. (Material Organization & Storage System) is an open-source IT asset management platform designed as a replacement for IT Glue. It provides comprehensive tracking of hardware, software, networks, SaaS services, and their relationships, with powerful network topology mapping and role-based access control.

**Target Users**: IT departments at mid-size companies with complex infrastructure including traditional IT equipment, broadcast/AV equipment, and cloud services.

## Development Workflow

**CRITICAL**: Follow this workflow for EVERY development task:

### Task Tracking
- **BEFORE starting ANY task**: Read [CLAUDE-TODO.md](CLAUDE-TODO.md) to understand current state and pending tasks
- **AFTER completing EACH step**: Update [CLAUDE-TODO.md](CLAUDE-TODO.md) with:
  - Mark completed items as done (strikethrough or move to completed section)
  - Add any new tasks discovered during implementation
  - Note any blockers or issues encountered
  - Update priority if needed
  - Keep the file current and accurate

### Testing Workflow
- **AFTER implementing ANY feature or change**: Use Playwright MCP tools to test
- **Testing Requirements**:
  - Navigate to the affected page(s) using `mcp__playwright__browser_navigate`
  - Take screenshots using `mcp__playwright__browser_take_screenshot` to verify visual correctness
  - Use `mcp__playwright__browser_snapshot` for accessibility verification
  - Interact with new features using click, type, fill_form tools
  - Verify forms submit correctly and validation works
  - Check responsive behavior if applicable
  - Test error states and edge cases
- **Document Test Results**: Update CLAUDE-TODO.md with test outcomes

### Why This Matters
- CLAUDE-TODO.md prevents duplicating work and losing track of progress
- Playwright testing catches issues before the user discovers them
- Systematic testing ensures consistent quality across features
- Documentation of test results helps track what's been verified

### Container Management (MANDATORY)

**CRITICAL**: On macOS, ALWAYS use Apple's container system instead of Docker:

- ✅ **Correct**: `container run postgres`
- ❌ **Wrong**: `docker run postgres` or `docker container run postgres`

**Container Commands**:
- Use `container` command for all container operations
- This applies to running containers, managing images, and all Docker-equivalent operations
- Examples:
  - `container run` instead of `docker run`
  - `container ps` instead of `docker ps`
  - `container stop` instead of `docker stop`
  - `container compose up` instead of `docker compose up`

**Why**: Apple's native container system is optimized for macOS and should be used instead of Docker Desktop.

## Database Architecture

The system uses PostgreSQL with UUID primary keys throughout. The database schema is defined in [dbsetup.sql](dbsetup.sql).

### Core Object Hierarchy

**Physical Infrastructure**:
- `companies` → `locations` → `rooms` → `devices`
- Devices support parent-child relationships (e.g., chassis with line cards via `parent_device_id`)
- Each module can have independent warranty, serial number, and install dates

**Network Infrastructure**:
- `networks` define VLANs and subnets
- `ios` (interfaces/ports) are the universal connectivity object supporting:
  - Network: ethernet, fiber, wifi
  - Broadcast: SDI, HDMI, XLR, coax
  - Power: AC/DC input/output, PoE
  - Infrastructure: patch panel ports
- `ios.connected_to_io_id` creates physical topology (IO-to-IO relationships)
- VLAN configuration:
  - `ios.native_network_id` → untagged/native VLAN
  - `io_tagged_networks` junction table → trunk VLANs (many-to-many)
  - `ios.trunk_mode`: access, trunk, hybrid, n/a
- `ip_addresses` associated with IOs

**People & Access**:
- `people` represents all individuals (employees, contractors, vendor contacts)
- `people.manager_id` creates organizational hierarchy
- `groups` supports multiple types: AD, Okta, Jamf smart groups, custom
- People and groups can be assigned to devices, SaaS services, and applications

**Software & Services**:
- `software` → product catalog (vendor-agnostic)
- `saas_services` → specific service instances (prod/staging/dev environments)
- `saas_service_integrations` → service-to-service relationships (e.g., Slack → Jira)
- `installed_applications` → deployed software with version tracking
- `software_licenses` → license management with seat tracking
- Junction tables link licenses to services, applications, and people

**Documentation**:
- `documents` → internal documentation (policies, runbooks, diagrams)
- `external_documents` → links to external systems (password vaults, tickets, wikis)
- `contracts` → vendor agreements
- Multiple junction tables associate documents with devices, networks, services, locations, rooms

**RBAC**:
- `roles` → role definitions (system and custom)
- `permissions` → granular object-type and action permissions (view, edit, delete, manage_permissions)
- `role_assignments` → assign roles to people/groups with scoping (global, location, specific objects)
- `object_permissions` → object-level overrides for specific items

### Key Relationship Patterns

- **Modular Equipment**: `devices.parent_device_id` enables chassis → line card relationships
- **Physical Topology**: `ios.connected_to_io_id` chains IOs together (e.g., server NIC → switch port → router port)
- **Power Topology**: IOs with `interface_type='power_input'` or `'power_output'` map power dependencies
- **Network Trunk Ports**: Combine `ios.native_network_id` + `io_tagged_networks` for trunk configuration
- **Service Integration**: `saas_service_integrations` links services (e.g., Okta provides SSO to multiple services)
- **Multi-object Documentation**: Document junction tables link to devices, networks, services, locations, and rooms

### Database Patterns

- All tables use UUID primary keys (`uuid_generate_v4()`)
- Audit fields: `created_at`, `updated_at` (with triggers for automatic updates)
- Soft deletes via `status` fields where appropriate (active, inactive, retired, etc.)
- Foreign keys enforce referential integrity with appropriate CASCADE/SET NULL behaviors
- Comprehensive indexes on frequently queried fields and foreign keys

## Development Context

**Current Phase**: Pre-development - database schema and requirements defined
**Technology Stack** (planned):
- Database: PostgreSQL (or Cloudflare D1)
- Backend: REST API (framework TBD)
- Frontend: React/Next.js preferred
- Hosting: Cloudflare Pages/Workers (free tier priority)
- Storage: Cloudflare R2 for file uploads
- Authentication: SAML 2.0 with SCIM (Okta, Azure AD, etc.)
- API: OpenAPI-compatible with ChatGPT support
- LLM Integration: MCP SSE/HTTP server with OAuth2 for Claude and other assistants

**Constraints**:
- Single developer (IT Director with systems architecture background)
- Must be free/near-free for development phase
- Low-maintenance operational requirements
- Cloudflare free tier preferred

## Key Design Principles

1. **Universal IO Object**: The `ios` table handles ALL connection types (network, broadcast, power, data). This enables comprehensive topology mapping across heterogeneous infrastructure.

2. **Relationship-First**: The system is designed to map complex relationships:
   - Physical connectivity (IO-to-IO)
   - Logical relationships (device-to-person, service-to-service)
   - Hierarchical structures (parent devices, manager chains)
   - Documentation associations (multi-object linking)

3. **Modular Equipment Support**: Parent-child device relationships allow independent tracking of chassis and modules with separate warranties and lifecycle management.

4. **Flexibility in Scoping**: RBAC supports global, location-based, and object-specific permissions to accommodate distributed teams and sensitive assets.

5. **Network Topology Generation**: The IO connectivity model enables automated generation of L2/L3 network diagrams, power topology, and broadcast signal flow.

## Important Technical Details

**VLAN Configuration**:
- Access ports: Set `native_network_id` only, `trunk_mode='access'`
- Trunk ports: Set `native_network_id` + add entries to `io_tagged_networks`, `trunk_mode='trunk'`
- Hybrid ports: Both native and tagged VLANs, `trunk_mode='hybrid'`

**Modular Equipment**:
- Parent device (e.g., chassis): `parent_device_id` is NULL
- Child devices (e.g., line cards): `parent_device_id` references parent
- Each module has independent `serial_number`, `warranty_expiration`, `install_date`

**Group-Based Deployments**:
- Applications deployed to groups via `group_installed_applications`
- SaaS access granted via `group_saas_services`
- People inherit access through `group_members`
- Also supports direct person-to-service assignments via `person_saas_services`

**Power Topology**:
- UPS/PDU outputs: `interface_type='power_output'`
- Device PSUs: `interface_type='power_input'`
- Connect via `ios.connected_to_io_id` to map power dependencies
- Track voltage, amperage, wattage, connector types

**Document Associations**:
- Documents can link to multiple object types simultaneously
- Use appropriate junction tables: `document_devices`, `document_networks`, `document_saas_services`, etc.
- External documents support the same multi-object associations

## UI Architecture

### Page Structure Pattern

All detail views follow a consistent pattern:
- **Tabs**: Overview (always first) + relationship tabs + history tab (always last)
- **Actions**: Top-right button group (primary action most prominent)
- **Relationships Panel**: Right sidebar with quick links to related objects
- **Quick Stats**: Widget-style summary metrics below header
- **Breadcrumbs**: Full navigation path at top

### List View Pattern

All list views follow this structure:
- **Header**: Title + search box + primary actions (Add, Import, Export)
- **Filters**: Left sidebar (collapsible) or top bar filters
- **View Toggle**: Table vs Card view (where appropriate)
- **Bulk Actions**: Checkbox selection + bulk action dropdown
- **Pagination**: Bottom, default 50 per page

### Key UI Pages by Category

**Core Pages (MVP - Phase 1)**:
1. Dashboard (widgets: expiring warranties/licenses, recent activity, quick stats)
2. Device List/Detail (tabs: Overview, Assignment, Hardware, Network, Software, Documentation, History)
3. Person List/Detail (tabs: Overview, Devices, Software, Groups, Licenses, Access, Documents, Direct Reports)
4. Location List/Detail (tabs: Overview, Rooms, Devices, Networks, People, Documentation)
5. Room Detail (tabs: Overview, Devices, Patch Panels, Documentation)
6. Network List/Detail (tabs: Overview, IOs, IP Addresses, Devices, Documentation)
7. Software Catalog List/Detail
8. SaaS Service List/Detail (tabs: Overview, Access, SSO/Provisioning, Users, Groups, Licenses, Integrations, Documentation, Contracts)
9. License List/Detail (tabs: Overview, Allocation, Assigned To, Services, Applications, Contract)
10. Document List/Detail (Markdown editor with preview)
11. Contract List/Detail
12. Global Search (real-time suggestions, multi-object results)

**Advanced Pages (Phase 2)**:
- Network Topology View (interactive graph, drag nodes, export PNG/SVG)
- IP Address Management (subnet visualization, conflict detection)
- Custom Report Builder (select fields, filter, aggregate, schedule)
- Bulk Import Wizard (CSV upload, field mapping, validation, preview)
- Audit Log View (all changes with JSON diffs)

**Admin Pages**:
- Role List/Detail (permission grid: object types × actions)
- Role Assignment (with scoping: global, location, specific objects)
- Object Permission Override (accessible from any detail view)
- System Settings (org config, SMTP, SSO, backups)
- User Settings (profile, preferences, notifications, API tokens)

### Form Patterns

**Device Form UX**:
- Auto-populate manufacturer from model if previously entered
- Filter room dropdown by selected location
- Show/hide parent device field based on device type
- Validate serial number uniqueness on blur
- Conditional fields: OS fields only for computers/servers, power fields only for UPS/PDU

**IO Form (Modal)**:
- Interface type dropdown changes available fields dynamically
- For network IOs: Show speed, duplex, trunk mode, VLAN fields
- For power IOs: Show voltage, amperage, wattage, connector type
- For broadcast IOs: Show media type specific to SDI/HDMI/XLR
- "Connect to IO" lookup with device filter (only show compatible IOs)

**Person Form**:
- Manager lookup (search by name, show org chart context)
- Location dropdown affects available rooms
- Person type affects which fields are required (employees need employee_id, vendors need company)

### Mobile-First Pages

Priority for mobile responsive design:
1. Global Search (iOS Safari optimized)
2. Device Detail View (field technician use case)
3. Person Detail View (help desk lookups)
4. Network Detail View (on-site troubleshooting)
5. Dashboard (quick glance metrics)

Mobile-specific features:
- QR code scanning for asset tags
- Camera integration for device photos
- Offline mode for cached data viewing
- Tap-to-call on phone numbers
- GPS location tagging for new device creation

### Design System Colors

**IMPORTANT**: Use the official design system colors from [designguides.md](designguides.md), not arbitrary colors.

**Primary Palette** (should be dominant):
- Morning Blue (#1C7FF2): Primary brand color, main actions, primary buttons, headers
- Brew Black (#231F20): Text, dark UI elements, navigation
- Off White (#FAF9F5): Backgrounds, light UI elements, cards

**Secondary Palette** (accents and states):
- Green (#28C077): Success states, active status
- Lime Green (#BCF46E): Accent highlights
- Light Blue (#ACD7FF): Info states, secondary actions, inactive status
- Orange (#FD6A3D): Warnings, errors, critical states
- Tangerine (#FFBB5C): Attention, high priority

**Status Colors** (mapped to design system):
- Active: Green (#28C077)
- Inactive: Light Blue (#ACD7FF)
- Repair/Warning: Orange (#FD6A3D) or Tangerine (#FFBB5C)
- Retired: Brew Black at 40% opacity (#231F20)

**Criticality Colors**:
- Critical: Orange (#FD6A3D)
- High: Tangerine (#FFBB5C)
- Medium: Light Blue (#ACD7FF)
- Low: Green (#28C077)

**Action Colors**:
- Primary Actions: Morning Blue (#1C7FF2)
- Secondary Actions: Light Blue (#ACD7FF)
- Destructive Actions: Orange (#FD6A3D)
- Success Actions: Green (#28C077)

**Object Type Colors** (use Morning Blue with variations):
- All object types should use Morning Blue (#1C7FF2) or Light Blue (#ACD7FF) for consistency
- Differentiate via icons and labels, not color alone

### Relationship Navigation

Every object detail view includes relationship tabs using the **RelatedItemsList** component pattern.

**RelatedItemsList Component** (`src/components/RelatedItemsList.tsx`):
- Generic component: `RelatedItemsList<T extends { id: string }>`
- API-driven data fetching with loading/error states
- Configurable columns with custom render functions
- Click-through navigation via `linkPattern` (e.g., `/devices/:id`)
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

**Standard Relationship Tabs by Object Type**:

- **Locations**: Rooms, Devices, People
- **Devices**: Interfaces/Ports, Child Devices, Installed Applications
- **People**: Assigned Devices, Direct Reports, Groups
- **Networks**: Interfaces, IP Addresses, Devices
- **Rooms**: Devices, Patch Panels (when implemented)
- **Software**: Installed Applications, Licenses, SaaS Services (when implemented)

**Navigation Flows Enabled**:
- Location → Rooms → Devices → IOs
- Person → Assigned Devices → IOs
- Person → Direct Reports (recursive org chart navigation)
- Network → Interfaces → Devices
- Device → Parent Device (modular equipment hierarchy)

### Search & Filter UX

**Global Search**:
- Header search box (always visible, keyboard shortcut: /)
- Real-time suggestions grouped by object type
- Recent searches saved per user
- Advanced filters slide-out panel
- Saved searches for power users

**List View Filters**:
- Sidebar filter panel (collapsible on mobile)
- Filters persist in URL query params (shareable links)
- Active filters shown as removable chips
- "Clear all filters" button
- Filter count badges

### Typography System

**Font Family**: Inter (all headings and body copy)

**Type Scale** (base 18px, ratio 1.25):
- Display: 72px
- H1: 57.6px
- H2: 46px
- H3: 36.8px
- H4: 29.4px
- H5: 23.5px
- Body: 18px
- Small: 14.4px

**Typography Rules**:
- Use scale for emphasis, NEVER text case (no UPPERCASE for emphasis)
- Always align to grid
- Generous padding and consistent margins
- Left-align all text
- Don't let text overflow margins

### Grid System

**Structure**:
- Even number of columns
- Margin = 1/4 column width
- Gutter = 1/2 margin width
- Symmetrical column proportions

**Implementation**:
- All elements must align to grid
- No floating elements
- Canvas width determines column count

### Color Usage Rules

**Text on Background** (approved combinations only):
- Morning Blue background → Brew Black or Off White text
- Green background → Brew Black or Off White text
- Orange background → Brew Black or Off White text
- Light Blue background → Brew Black text ONLY
- Lime Green background → Brew Black text ONLY
- Tangerine background → Brew Black text ONLY
- Off White background → Morning Blue or Brew Black text
- Brew Black background → Any color except Off White

**Block Layering** (approved combinations):
- Morning Blue on Light Blue
- Tangerine on Orange
- Green on Lime Green
- Off White on Morning Blue
- Brew Black on any color except Off White

**Design Strategy Rules**:
- ✅ Use recognizable icons with clear focal points
- ✅ Logical, easy-to-follow element order
- ✅ Use scale and color for emphasis
- ✅ Sufficient text/background contrast
- ✅ Text alternatives for images
- ✅ Responsive layouts
- ❌ No aggressive/overwhelming colors
- ❌ No menacing aesthetics
- ❌ Never rely solely on color to communicate
- ❌ No complicated navigation
- ❌ No tiny font sizes
