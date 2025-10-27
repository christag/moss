
**Next Steps:**
1. Update UI components to match new backend schema
2. Test full CRUD flows with Playwright after UI updates
3. Continue with remaining core objects (Devices, Networks, etc.)

### Phase 0: Foundation & Setup

#### 0.1 Project Infrastructure ✓ COMPLETE
- [x] Choose and set up framework stack (Next.js 15 + React 19)
- [x] Configure TypeScript with strict type checking
- [x] Set up ESLint and Prettier with project standards
- [x] Create basic folder structure (src/components, src/pages, src/lib, src/types)
- [x] Configure environment variables (.env.example, .env.local)
- [x] Set up Git hooks (pre-commit linting with Husky)
- [x] Create package.json scripts (dev, build, lint, format, test, db:migrate)
- [x] Set up testing framework (Jest + React Testing Library)

#### 0.2 Database Setup ✓ COMPLETE
- [x] Set up PostgreSQL locally using Apple's container system (container run postgres)
- [x] Run dbsetup.sql to create schema using `npm run db:migrate`
- [x] Install database client library (pg installed)
- [x] Create database connection utility (src/lib/db.ts)
- [x] Set up database migrations system (src/lib/migrate.ts + migrations/)
- [x] Create seed data for development (seeds/001_companies_locations.sql, seeds/002_rooms.sql, seeds/003_people.sql)
- [x] Test all foreign key relationships work correctly
- [x] Create rebuild script (rebuild-database.js) for database resets

#### 0.3 Design System Implementation - MOSTLY COMPLETE
- [x] Install Inter font family (via Next.js font optimization)
- [x] Integrate styles/design-system.css into project
- [x] Create base component library structure (src/components/ui/)
- [x] Build core UI primitives:
  - [x] Button (primary, secondary, outline, destructive variants)
  - [x] Input (with label, error, helper text support)
  - [x] Select dropdown
  - [x] Textarea
  - [x] Checkbox
  - [x] Badge (success, warning, error, info, default variants)
  - [x] Card component (Card, CardHeader, CardContent)
  - [ ] Modal/Dialog (deferred to later phase)
  - [ ] Toast notifications (deferred to later phase)
- [x] Create layout components:
  - [x] Container (max-width, padding in design-system.css)
  - [x] Grid system (grid-2, grid-3, grid-4 in design-system.css)
  - [x] Flex utilities (flex, inline-flex, items-center, etc.)
- [x] Build form components (integrated into Input, Select, Textarea, Checkbox)
- [x] Test all components render with correct design system colors (demo page functional)
- [ ] Create Storybook or component documentation (deferred)

#### 0.4 Authentication Foundation
- [X] Choose auth strategy (NextAuth.js, Clerk, or custom JWT)
- [X] Set up auth provider/context
- [X] Create auth database tables (if custom: users, sessions)
- [X] Build login page UI
- [X] Implement email/password login
- [X] Create session management utilities
- [X] Build protected route wrapper/middleware
- [X] Create logout functionality
- [ ] Add "Forgot Password" flow (Phase 2, skip for MVP)

#### 0.4.1 API Token Authentication ✓ IMPLEMENTED (Migration Pending)
**Status**: Code complete, needs database migration application
**Date**: 2025-10-16

- [X] Create API tokens database migration (migrations/023_api_tokens.sql)
- [X] Build authentication library (src/lib/apiAuth.ts):
  - [X] generateApiToken() - Create tokens with bcrypt hashing
  - [X] verifyApiToken() - Validate bearer tokens
  - [X] requireApiAuth() - Middleware for auth checks
  - [X] requireApiScope() - Scope-based permissions (read, write, admin)
  - [X] Token management functions (revoke, list)
- [X] Create token management API routes:
  - [X] GET /api/api-tokens - List user's tokens
  - [X] POST /api/api-tokens - Create new token
  - [X] DELETE /api/api-tokens/[id] - Revoke token
- [X] Build token management UI (src/app/settings/api-tokens/page.tsx):
  - [X] Token creation form with scope selection
  - [X] Token list view with usage statistics
  - [X] One-time token display with copy functionality
  - [X] Token revocation
- [X] Update sample API routes with authentication:
  - [X] /api/devices - GET (read), POST (write)
  - [X] /api/people - GET (read), POST (write)
- [X] Create comprehensive documentation (API-AUTHENTICATION.md)
- [ ] ⚠️ **MANUAL STEP**: Apply database migration
- [ ] **TODO**: Roll out authentication to remaining API routes
  - [ ] /api/companies, /api/locations, /api/rooms
  - [ ] /api/networks, /api/ios, /api/software
  - [ ] /api/saas-services, /api/contracts, /api/documents
  - [ ] All PATCH and DELETE operations
  - [ ] Admin endpoints

### Phase 1: Core Data Layer (MVP)

#### 1.1 API Foundation ✓ COMPLETE
- [x] Set up API routing structure (Next.js API routes)
- [x] Create base API response utilities (src/lib/api.ts)
- [x] Set up request validation (Zod schemas in src/lib/schemas/)
- [x] Create error handling middleware (built into API utilities)
- [x] Build pagination utilities (built into validation.ts and query schemas)
- [x] Implement basic logging (console.log for slow queries and errors)
- [ ] Implement authentication middleware for protected routes (deferred to Phase 0.4)

#### 1.2 Companies API & UI ✓ COMPLETE
- [x] Create TypeScript types for Company model (src/types/index.ts + src/lib/schemas/company.ts)
- [x] Build API endpoints:
  - [x] POST /api/companies (create) - supports all 16 fields
  - [x] GET /api/companies (list with filters) - company_name search
  - [x] GET /api/companies/:id (get single)
  - [x] PATCH /api/companies/:id (update) - all fields supported
  - [x] DELETE /api/companies/:id (delete with dependency checking)
- [x] Test all API endpoints with curl (✓ All passing)
- [x] Update UI components to use company_name and new fields ✅ **COMPLETE**
- [x] Build Companies list page using GenericListView ✅ **COMPLETE** (Enhanced table with 7 columns, column management, per-column filtering)
- [x] Build Company detail page using GenericDetailView ✅ **COMPLETE** (companies/[id]/page.tsx)
- [x] Build Company create/edit form ✅ **COMPLETE** (CompanyForm.tsx, companies/[id]/edit/page.tsx)
- [x] Test full CRUD cycle for companies with Playwright ✅ **COMPLETE**

#### 1.3 Locations API & UI ✓ COMPLETE
- [x] Create TypeScript types for Location model
- [x] Build API endpoints (create, list, get, update, delete with all 12 fields)
- [x] Test all API endpoints with curl (✓ All passing)
- [x] Update UI to use location_name and new fields ✅ **COMPLETE**
- [x] Build Generic List View ✅ **COMPLETE** (Enhanced table with 12 columns, column management, per-column filtering)
- [x] Build Generic Detail View ✅ **COMPLETE** (locations/[id]/page.tsx with tabs: Overview, Rooms, Devices, People, Networks, History)
- [x] Build Generic Form ✅ **COMPLETE** (LocationForm.tsx with all 11 fields including company lookup)
- [x] Test location-to-company relationship displays correctly ✅ **COMPLETE** (Tested in DEF-002 - displays clickable company link)
- [x] Test full CRUD cycle with Playwright (list, detail, create, edit) ✅ **COMPLETE**

#### 1.4 Rooms API & UI ✓ COMPLETE
- [x] Create TypeScript types for Room model (room_name, room_number, notes)
- [x] Build API endpoints (create, list, get, update, delete)
- [x] Build Generic List View (table: room_name, location, room_type, floor)
- [x] Build Generic Detail View (tabs: Overview, Devices, Patch Panels, Documents)
- [x] Build Generic Form (room_name, room_type dropdown, location lookup, floor, capacity, access_requirements, notes)
- [x] Create seed data (seeds/002_rooms.sql - 13 rooms across 3 locations)
- [x] Test location → room hierarchy navigation
- [x] Test all API endpoints (✓ All passing)

#### 1.5 People API & UI ✓ COMPLETE
- [x] Create TypeScript types for Person model (full_name, username, mobile, etc.)
- [x] Build API endpoints (create, list, get, update, delete)
- [x] Test all API endpoints (✓ All passing)
- [x] Update UI to use full_name instead of first_name/last_name ✅ **COMPLETE**
- [x] Build Generic List View ✅ **COMPLETE** (Enhanced table with 14 columns, column management, per-column filtering):
  - [x] Table: full_name, email, person_type, company, location, status
  - [x] Filters: person_type, status, location, company
  - [x] Search by name or email
- [x] Build Generic Detail View ✅ **COMPLETE** (people/[id]/page.tsx):
  - [x] Overview tab (contact info, employment details)
  - [x] Devices tab (assigned devices list)
  - [x] Software tab (SaaS access, installed apps)
  - [x] Groups tab (group memberships)
  - [x] Direct Reports tab (if manager)
  - [x] Documents tab
  - [x] History tab
  - [x] Relationships panel showing manager, location, company
- [x] Build Generic Form ✅ **COMPLETE** (PersonForm.tsx with all 14 fields)
- [x] Test manager hierarchy displays correctly ✅ **COMPLETE**
- [x] Test person-to-company relationship ✅ **COMPLETE**

#### 1.6 Devices API & UI ✓ COMPLETE
- [x] Create TypeScript types for Device model ✅ **COMPLETE**
- [x] Build API endpoints (create, list, get, update, delete) ✅ **COMPLETE**
- [x] Build Generic List View ✅ **COMPLETE** (devices/page.tsx with search and filters)
- [x] Build Generic Detail View ✅ **COMPLETE** (devices/[id]/page.tsx)
- [x] Build Generic Form ✅ **COMPLETE** (DeviceForm.tsx, devices/[id]/edit/page.tsx)
- [x] Test parent-child device relationships display correctly ✅ **COMPLETE**
- [x] Test device assignment to person, location, room ✅ **COMPLETE**

#### 1.7 Groups API & UI ✓ COMPLETE
- [x] Create TypeScript types for Group model (GroupType enum with 8 types, Group interface)
- [x] Build API endpoints (create, list, get, update, delete)
- [x] Build Generic List View (table: group_name, type, description, external_id, created_at)
- [x] Build Generic Detail View (sections: Overview, System Information)
- [x] Build Generic Form (6 fields: group_name, group_type, description, group_id_external, created_date, notes)
- [x] Test full CRUD cycle with Playwright (create, read, update, delete all verified)
- [ ] Build member management UI (deferred - requires people/group relationships)
- [ ] Test group membership displays on Person detail view (deferred)

#### 1.8 Networks API & UI ✓ COMPLETE
- [x] Create TypeScript types for Network model (NetworkType enum with 8 types, Network interface)
- [x] Build API endpoints (create, list, get, update, delete)
- [x] Build List View (table: network_name, type, network_address, vlan_id, gateway, DHCP badge, created_at)
- [x] Build Detail View (sections: Network Configuration, DHCP Configuration, System Information)
- [x] Build Generic Form (12 fields: network_name, location_id, network_address, vlan_id, network_type, gateway, dns_servers, dhcp_enabled, dhcp_range_start, dhcp_range_end, description, notes)
- [x] Test network creation and listing
- [x] Test full CRUD cycle with Playwright (create, read, update, delete all verified)
- [x] Fix locations.map error with defensive array checking

#### 1.9 IOs (Interfaces/Ports) API & UI ✓ COMPLETE
- [x] Create TypeScript types for IO model (InterfaceType, MediaType, IOStatus, Duplex, TrunkMode enums + IO interface)
- [x] Build API endpoints (create, list, get, update, delete with dependency checking)
- [x] Build IOForm component with conditional fields (22 fields, network/power sections)
- [x] Build IOs list page with search and filters
- [x] Build IO detail page with conditional sections (Network Configuration, Power Configuration)
- [x] Build IO new/edit pages
- [x] Test full CRUD cycle with Playwright (create, read, update, delete all verified)
- [x] Test conditional UI sections based on interface_type
- [ ] Build IO-to-IO connectivity UI (deferred - requires enhanced relationship UI)
- [ ] Test VLAN tagging UI (deferred - requires io_tagged_networks junction table UI)

#### 1.10 IP Addresses API & UI ✓ COMPLETE
- [x] Create TypeScript types for IPAddress model (IPVersion, IPAddressType enums + interface)
- [x] Build API endpoints (create, list, get, update, delete)
- [x] Build IP Address Management View (list with filters)
- [x] Build IP Address Form (8 fields with IO/Network lookups)
- [x] Test IP assignment to IOs (basic page load verified)

#### 1.11 Software Catalog API & UI ✓ COMPLETE
- [x] Create TypeScript types for Software model (SoftwareCategory enum + interface)
- [x] Build API endpoints (create, list, get, update, delete with dependency checking)
- [x] Build Generic List View (table with search and category filter)
- [x] Build Generic Detail View (detail page with Software Information and System Information)
- [x] Build Generic Form (6 fields with company/vendor lookup)

#### 1.12 SaaS Services API & UI ✓ COMPLETE
- [x] Create TypeScript types for SaaSService model (3 enums: Environment, Status, Criticality)
- [x] Build API endpoints (create, list, get, update, delete with dependency checking)
- [x] Build Generic List View (table with status badges and filters)
- [x] Build Generic Detail View (4 card sections: Service Info, Subscription, SSO & Integration, Notes)
- [x] Build Generic Form (23 fields with checkboxes for SCIM/API)
- [ ] Build user/group assignment UI (deferred - requires junction table UI)

#### 1.13 Installed Applications API & UI ✓ COMPLETE
- [x] Create TypeScript types (DeploymentStatus enum + InstalledApplication interface)
- [x] Build API endpoints (create, list, get, update, delete with dependency checking)
- [x] Build views and forms (list with status badges, detail, create, edit)
- [x] Test page load verification

#### 1.14 Software Licenses API & UI ✓ COMPLETE
- [x] Create TypeScript types (LicenseType enum with 6 types + SoftwareLicense interface)
- [x] Build API endpoints (create, list, get, update, delete with dependency checking)
- [x] Build views and forms (list with expiration badges, detail with seat usage, create, edit)
- [x] Test page load verification
- [ ] Build assignment UI (deferred - requires junction table UI)

#### 1.15 Documents API & UI ✓
- [x] Create TypeScript types
- [x] Build API endpoints
- [x] Build Document Editor
- [ ] Build multi-object association UI (deferred to Phase 2)

#### 1.16 External Documents API & UI ✅ **COMPLETE**
- [x] Create TypeScript types
- [x] Build API endpoints
- [x] Build views and forms
- [x] Add to navigation menu

#### 1.17 Contracts API & UI ✅ **COMPLETE**
- [x] Create TypeScript types
- [x] Build API endpoints
- [x] Build views and forms
- [x] Add to navigation menu

### Phase 1: Core UI Features (MVP)

#### 1.18 Dashboard
- [x] Build Dashboard layout
- [x] Create widgets (expiring warranties, licenses, contracts, recent activity, quick stats)

#### 1.19 Global Search
- [x] Build global search UI
- [x] Implement search API endpoint

#### 1.20 Navigation & Layout
- [x] Build main navigation structure ✅ **COMPLETE** (Dropdown menus with Places/Assets/IT Services groupings)
- [x] Build responsive header ✅ **COMPLETE** (Sticky navigation with logo, dropdowns, and user menu)
- [x] Build breadcrumb component ✅ **COMPLETE** (Created src/components/ui/Breadcrumb.tsx, integrated into GenericDetailView)

#### 1.21 Form Validation & UX Improvements
- [x] Add client-side validation ✅ **COMPLETE** (Zod validation with GenericForm, real-time validation on blur)
- [x] Add loading states and notifications ✅ **COMPLETE** (Button loading spinner, Sonner toast notifications)
- [x] Add visual validation states ✅ **COMPLETE** (Green checkmark for valid, red X for errors, Input component enhanced)

#### 1.22 Relationship Navigation
- [x] Build Relationships Panel component ✅ **COMPLETE** (Created src/components/RelationshipsPanel.tsx, ready for integration)
- [x] Test forms with Playwright ✅ **COMPLETE** (Tested /companies/new, verified validation states work)

#### 1.23 Accessibility & Responsive Design
- [x] Add ARIA labels to navigation ✅ **COMPLETE** (Phase 1: Navigation.tsx, NavDropdown.tsx, GlobalSearch.tsx)
- [ ] Add ARIA labels to list/table components (Phase 2: GenericListView, RelatedItemsList) - **IN PROGRESS**
- [ ] Add ARIA labels to forms and detail views (Phases 3-4: GenericForm, GenericDetailView)
- [ ] Test keyboard navigation (Phase 5: Tab, Enter, Escape, Arrow keys)
- [ ] Test mobile responsive design (Phase 6: 375px, 768px, 1024px, 1920px breakpoints)

#### 1.24 Basic RBAC (MVP Roles)
- [ ] Create TypeScript types
- [ ] Build Roles API
- [ ] Build permission grid UI

### Phase 1: Testing & Polish (MVP)

#### 1.25 Data Integrity & Validation
- [ ] Test foreign key relationships
- [ ] Test cascade deletes
- [ ] Test all validations

#### 1.26 Performance Optimization
- [ ] Add database indexes
- [ ] Implement caching
- [ ] Optimize N+1 queries

#### 1.27 Error Handling & Edge Cases
- [ ] Test error handling
- [ ] Add empty states
- [ ] Test 404 handling

#### 1.28 MVP Documentation
- [x] ~~Write API documentation~~ (✅ 2025-10-12: Fixed critical auth inaccuracies, added security warning banner)
- [ ] Create user guide
- [ ] Document deployment

#### 1.29 MVP Deployment
- [ ] Set up production environment
- [ ] Configure database
- [ ] Deploy application

### Phase 2: Advanced Features

#### 2.1 Network Topology Visualization
**Goal**: Interactive network diagrams showing physical and logical connectivity via IO relationships

**Research Summary**: Cytoscape.js is optimal for graph-based network topologies with built-in algorithms and React integration. D3.js offers more customization but requires significantly more development time. WebGL rendering (via Cytoscape.js or Sigma.js) is essential for large graphs with 1000+ nodes.

**Implementation Steps**:
- [ ] Choose visualization library
  - [ ] Evaluate Cytoscape.js vs D3.js for network graph use cases
  - [ ] Test react-cytoscapejs wrapper with sample data
  - [ ] Verify performance with 500+ nodes (typical network size)
  - [ ] Decision: Recommend Cytoscape.js for built-in layouts and graph algorithms
- [ ] Design topology data model
  - [ ] Create API endpoint `/api/topology/network` to fetch IO connectivity chains
  - [ ] Query: `ios` table with `connected_to_io_id` relationships
  - [ ] Return nodes (devices with IOs) and edges (IO-to-IO connections)
  - [ ] Include node metadata: device type, location, status
  - [ ] Include edge metadata: interface type, speed, VLAN, media type
- [ ] Build topology visualization component
  - [ ] Create `NetworkTopologyView.tsx` with Cytoscape.js integration
  - [ ] Implement force-directed layout (default) with manual node positioning
  - [ ] Add zoom/pan controls with mouse wheel and drag gestures
  - [ ] Display node labels (device names) with hover tooltips (full details)
  - [ ] Color-code nodes by device type (switch, router, server, etc.)
  - [ ] Color-code edges by interface type (ethernet=blue, fiber=green, power=orange)
- [ ] Add interactive features
  - [ ] Click node → open device detail page in sidebar panel
  - [ ] Click edge → show IO connection details (speed, duplex, VLAN)
  - [ ] Double-click node → expand to show all IOs on that device
  - [ ] Right-click → context menu (edit device, view IOs, trace path)
  - [ ] Highlight path: Select two nodes → show shortest path via BFS algorithm
- [ ] Implement filtering and search
  - [ ] Filter by location (show only devices in selected location)
  - [ ] Filter by device type (switches only, routers only, etc.)
  - [ ] Filter by network/VLAN (show only IOs on specific network)
  - [ ] Search for device by name (highlight and center in graph)
  - [ ] Toggle layer visibility (L2 only, L3 only, power, all)
- [ ] Add layout algorithms
  - [ ] Implement hierarchical layout (root=core switches, leaves=endpoints)
  - [ ] Implement circular layout (grouped by location or function)
  - [ ] Implement grid layout (for data center rack visualization)
  - [ ] Save layout positions to database (user preferences)
  - [ ] "Reset layout" button to recompute automatic layout
- [ ] Export and sharing features
  - [ ] Export as PNG with transparent background
  - [ ] Export as SVG (vector graphics for documentation)
  - [ ] Export as JSON (for backup/import into other tools)
  - [ ] Generate shareable link with current filters and view state
  - [ ] Print-optimized view (high DPI, fit to page)
- [ ] Performance optimization
  - [ ] Implement node clustering for 1000+ node networks
  - [ ] Use WebGL renderer for large graphs (Cytoscape.js canvas fallback)
  - [ ] Lazy-load node details on hover (don't fetch all upfront)
  - [ ] Debounce search and filter operations (300ms delay)
  - [ ] Virtual scrolling for node/edge list sidebars
- [ ] Create specialized topology views
  - [ ] Power topology view (UPS → PDU → device PSU chains)
  - [ ] Broadcast signal flow (SDI/HDMI/XLR chains for AV equipment)
  - [ ] VLAN topology (show L2 domains and trunk links)
  - [ ] Physical connectivity (patch panel ports and cabling)

#### 2.2 IP Address Management Enhancements
**Goal**: Visual subnet management with conflict detection, CIDR calculator, and IP utilization tracking

**Status**: **Phase 1-6 COMPLETE** ✅ (2025-10-12)

**Research Summary**: Interactive CIDR visualization tools show subnet hierarchy visually. Best IPAM features include subnet calculator, conflict detection, DHCP range management, and drag-drop subnet allocation. PostgreSQL has sufficient performance for small-to-medium IPAM without Elasticsearch.

**Implementation Steps**:
- [x] **Phase 1: CIDR Calculator** ✅ COMPLETE
  - [x] Created `src/lib/cidr-utils.ts` with IPv4 subnet calculation utilities
  - [x] Created `CIDRCalculator.tsx` component with real-time calculations
  - [x] Calculate: Network address, broadcast address, usable range, subnet mask, wildcard mask
  - [x] Calculate: Number of hosts, first IP, last IP, IP class, private/public detection
  - [x] Binary subnet mask representation
  - [x] Integrated into `NetworkForm.tsx` with collapsible section
  - [x] "Apply to Network" button → auto-populate network_address and gateway fields
  - ⚠️ IPv6 support deferred to future phase
- [x] **Phase 2: Subnet Visualization** ✅ COMPLETE
  - [x] Created `SubnetVisualization.tsx` component with adaptive grid-based IP display
  - [x] Created `/api/networks/[id]/ip-utilization` endpoint
  - [x] Support /24 to /32 subnets with adaptive grid layout (16×16 for /24, 8×8 for /26, etc.)
  - [x] Color-code: allocated (green), reserved (blue), DHCP pool (yellow), available (gray)
  - [x] Click IP → show assignment details modal (device, IO, hostname, DNS, assignment date)
  - [x] Stats header: network, utilization %, allocated count, DHCP pool, available
  - [x] Added "Subnet Map" tab to network detail page
  - [x] Link to device detail page from IP modal
- [x] **Phase 3: Conflict Detection & Bulk Operations** ✅ COMPLETE (2025-10-12)
  - [x] Created `/api/ip-addresses/conflicts` endpoint (GET with type and network filters)
  - [x] Duplicate IP detection: Same IP on multiple IOs using GROUP BY + HAVING
  - [x] Out-of-range detection: IPs not within network CIDR using `isIPInNetwork()`
  - [x] DHCP conflict detection: Static IPs within DHCP range using SQL range query
  - [x] Conflicts page UI with filterable table (`/ip-addresses/conflicts`)
  - [x] Summary cards showing total conflicts by type
  - [x] Filter by conflict type and search by IP/device/network
  - [x] Navigation: "View Conflicts" button on IP list page
  - [x] Action buttons: View Devices, Edit IP, View Device
  - [x] Created `/api/ip-addresses/bulk` endpoint (POST with 4 operations)
  - [x] Bulk reserve: Mark IPs as reserved with optional notes
  - [x] Bulk release: Delete unused IP allocations
  - [x] Bulk update DNS: Update DNS names using CASE statement
  - [x] Bulk reassign network: Move IPs to different network with FK validation
  - [x] Zod validation with discriminated unions for type safety
  - [x] Playwright testing: All features verified working
- [x] **Phase 4: IP Allocation Wizard** ✅ COMPLETE (2025-10-12)
  - [x] Created `/api/networks/[id]/available-ips` endpoint (GET with limit parameter)
  - [x] Returns available IPs excluding allocated, DHCP, gateway, broadcast
  - [x] Returns `next_available` IP for quick allocation
  - [x] Returns subnet info (total hosts, utilization %, CIDR notation)
  - [x] Created `IPAllocationWizard.tsx` component (700+ lines)
  - [x] Step 1: Select network/subnet from cards with search
  - [x] Step 2: Show available IPs count + "Next Available IP" banner
  - [x] Step 3: Select IP from grid or manual entry
  - [x] Step 4: Assignment details (IO or reserve, type, DNS name, hostname, notes)
  - [x] Step 5: Confirmation summary with edit buttons
  - [x] "Next Available IP" feature with "Use This IP" button (skips to step 4)
  - [x] Progress indicator: 5-circle progress bar
  - [x] Network cards with utilization display
  - [x] IP grid: 5 per row with selection state
  - [x] Assignment type: Radio buttons (IO vs Reserve)
  - [x] IO selector: Dropdown with device + IO label
  - [x] IP type selector: Static, DHCP, Reserved, Floating
  - [x] Auto-populate hostname from device when assigning to IO
  - [x] Created `/ip-addresses/allocate` page with toast notifications
  - [x] Supports `?network_id=` query parameter for pre-selection
  - [x] Added "Allocate IP" button (green) to IP list page header
  - [x] Playwright testing: Wizard loads successfully
- [x] **Phase 5: Subnet Hierarchy & Utilization** ✅ COMPLETE (2025-10-12)
  - [x] Created migration 011: Added `parent_network_id` column to networks table
  - [x] Created index on `parent_network_id` for performance
  - [x] Added `check_network_hierarchy_cycle()` function to prevent circular references
  - [x] Updated TypeScript types (Network, CreateNetworkInput, UpdateNetworkInput)
  - [x] Created `/api/networks/hierarchy` endpoint (GET with location filter)
  - [x] Two-pass tree building algorithm (O(n) complexity)
  - [x] Returns utilization data (allocated_count, total_hosts, utilization_percent)
  - [x] Created SubnetHierarchyTree component (500+ lines)
  - [x] Interactive tree view with expand/collapse functionality
  - [x] Drag-and-drop subnet reorganization with descendant check
  - [x] Visual utilization bars (color-coded: green/blue/tangerine/orange)
  - [x] Search functionality for filtering networks by name
  - [x] Bulk actions: Expand All, Collapse All, Refresh
  - [x] Created `/networks/hierarchy` page with info cards
  - [x] Created `/api/networks/top-utilized` endpoint (GET with limit param)
  - [x] Dashboard widget: TopUtilizedSubnetsWidget (top 10 ranked list)
  - [x] Color-coded cards with utilization bars and host counts
  - [x] "View Hierarchy →" link to full tree view
  - [x] Created `/api/networks/[id]/utilization-summary` endpoint
  - [x] NetworkUtilizationChart component: SVG donut chart
  - [x] Four segments: Allocated, DHCP Pool, Reserved, Available
  - [x] Interactive hover effects on chart segments
  - [x] Legend and summary statistics (total/usable hosts, utilization %)
  - [x] Playwright testing: Hierarchy page loads with tree, search, and controls
  - Note: Overlapping subnet conflict detection deferred to future phase
- [x] **Phase 6: DHCP Management Features** ✅ COMPLETE (2025-10-12)
  - [x] Created `/api/networks/[id]/validate-dhcp-range` endpoint (POST)
  - [x] Validation: Start/end IPs within subnet, start < end, conflict detection
  - [x] Returns errors, warnings, and conflicts (IP, type, device name)
  - [x] Created `/api/ip-addresses/[id]/convert-to-static` endpoint (POST)
  - [x] Converts DHCP-type IPs to static allocations
  - [x] Validation: IP exists, not already static, not reserved
  - [x] Created DHCPRangeEditor component (600+ lines)
  - [x] Toggle switch: Enable/disable DHCP with visual feedback
  - [x] IP range inputs with monospace font and placeholders
  - [x] "Suggest Range" button: Auto-fills middle 50% of subnet
  - [x] "Validate" button: Real-time validation with server-side checks
  - [x] "Save Changes" button: Commits range to database
  - [x] Error/warning/conflict display with color coding
  - [x] Conflict list: Shows IP, type badge, device name
  - [x] Network info display: CIDR, total IPs, DHCP pool size
  - [x] Prettier and ESLint checks passed
  - Note: Integration into NetworkForm pending, SubnetVisualization already supports DHCP color coding
  - Note: DHCP lease status monitoring deferred (requires DHCP server integration)
- [x] Add utilization reporting ✅ COMPLETE (Phase 5 - 2025-10-12)
  - [x] Dashboard widget: "Top 10 Most Utilized Subnets" (TopUtilizedSubnetsWidget)
  - [x] Per-network utilization chart (SVG donut chart - NetworkUtilizationChart)
  - [ ] Utilization trend over time (requires historical data tracking - future enhancement)
  - [ ] Alert: Subnet approaching capacity (>80% or >90% threshold - future enhancement)
- [ ] IPv6 support
  - [ ] Extend `ip_addresses` table to support IPv6 (already has `ip_version` enum)
  - [ ] IPv6 CIDR calculator (support /64, /48, etc.)
  - [ ] IPv6 subnet visualization (simplified due to massive address space)
  - [ ] Dual-stack IP management (show IPv4 + IPv6 for same IO)

#### 2.3 Advanced Search & Filters
**Goal**: Fast, faceted search across all object types with saved searches and real-time suggestions

**Research Summary**: PostgreSQL full-text search is sufficient for small-to-medium applications with proper indexing. Elasticsearch offers better relevancy (BM25) and faceted search but adds infrastructure complexity. Recommend PostgreSQL for MVP with Elasticsearch migration path if needed.

**Implementation Steps**:
- [ ] Implement PostgreSQL full-text search
  - [ ] Add `tsvector` columns to main tables (devices, people, locations, networks, etc.)
  - [ ] Create GIN indexes on tsvector columns for performance
  - [ ] Create trigger functions to auto-update tsvector on INSERT/UPDATE
  - [ ] Test query: `SELECT * FROM devices WHERE search_vector @@ to_tsquery('cisco & router')`
  - [ ] Verify index performance with EXPLAIN ANALYZE
- [ ] Build unified search API
  - [ ] Create `/api/search` endpoint accepting query string + filters
  - [ ] Search across multiple tables in parallel (Promise.all)
  - [ ] Return results grouped by object type (devices, people, locations, etc.)
  - [ ] Include result count per object type for faceted filtering
  - [ ] Support pagination per object type (e.g., show top 5 devices, top 5 people)
- [ ] Implement search ranking
  - [ ] Use `ts_rank()` or `ts_rank_cd()` for relevancy scoring
  - [ ] Boost exact matches over partial matches
  - [ ] Boost matches in primary fields (name, hostname) over notes
  - [ ] Sort results by rank DESC, then by updated_at DESC
- [ ] Add faceted search filters
  - [ ] Object type facet (devices, people, locations, networks, software, etc.)
  - [ ] Status facet (active, inactive, retired, etc.)
  - [ ] Location facet (filter by specific location)
  - [ ] Date range facet (created/updated in last 7 days, 30 days, etc.)
  - [ ] Custom field facets (if custom fields exist)
  - [ ] Show result counts per facet value (e.g., "Devices (42)", "People (18)")
- [ ] Build search UI component
  - [ ] Create `GlobalSearch.tsx` component in header (already exists, enhance it)
  - [ ] Real-time search with debounce (300ms delay)
  - [ ] Show suggestions dropdown grouped by object type
  - [ ] Keyboard navigation (arrow keys, enter to select, escape to close)
  - [ ] Highlight matching text in results (bold or colored)
  - [ ] "View all results" link → full search results page
- [ ] Create advanced search page
  - [ ] URL: `/search?q=query&type=devices&status=active&location=loc-uuid`
  - [ ] Left sidebar: Facet filters with checkboxes
  - [ ] Main area: Results list with pagination
  - [ ] Sort options: Relevance, date created, date updated, name A-Z
  - [ ] Save search button → store filters in database
  - [ ] Share search button → copy URL to clipboard
- [ ] Implement saved searches
  - [ ] Create `saved_searches` table (user_id, name, query, filters, created_at)
  - [ ] UI: Dropdown in header "My Saved Searches"
  - [ ] Click saved search → load results instantly
  - [ ] Edit/delete saved searches in user settings
  - [ ] Share saved searches with team (requires permissions)
- [ ] Add search history
  - [ ] Store last 20 searches per user in `search_history` table
  - [ ] Show recent searches in dropdown when search box is empty
  - [ ] Click recent search → re-run query
  - [ ] Clear history button in user settings
- [ ] Implement search suggestions
  - [ ] As user types, show top 10 suggestions from each object type
  - [ ] Use `ts_headline()` to show matching snippet with context
  - [ ] Show object icon + name + snippet in dropdown
  - [ ] Click suggestion → navigate to object detail page
- [ ] Add search analytics (optional)
  - [ ] Track most common search queries (for UX improvements)
  - [ ] Track zero-result searches (identify missing data or search issues)
  - [ ] Track click-through rate (did user click a result or refine search?)
- [ ] Performance optimization
  - [ ] Implement search result caching (Redis or in-memory)
  - [ ] Cache TTL: 5 minutes (balance freshness vs performance)
  - [ ] Invalidate cache on object updates (requires cache keys per object type)
  - [ ] Load facet counts asynchronously (don't block initial results)
- [ ] Future: Elasticsearch migration path
  - [ ] Document Elasticsearch index schema for each object type
  - [ ] Create sync script to populate Elasticsearch from PostgreSQL
  - [ ] Implement dual-read (query both, compare results during testing)
  - [ ] Gradual rollout: Search power users first, then all users

#### 2.4 Custom Reports & Analytics
**Goal**: Drag-and-drop report builder with scheduling, exports, and pre-built templates

**Research Summary**: Open-source react-querybuilder provides drag-and-drop query building with visual rule creation. Commercial solutions (Bold Reports, Joyfill) offer more features but add licensing costs. Recommend starting with react-querybuilder + custom report templates.

**Implementation Steps**:
- [ ] Choose report builder library
  - [ ] Evaluate react-querybuilder (open-source, MIT license)
  - [ ] Test drag-and-drop rule creation with sample data
  - [ ] Verify SQL generation from rules (or use custom query builder)
  - [ ] Decision: Use react-querybuilder for UI, custom backend for query execution
- [ ] Design report data model
  - [ ] Create `reports` table (name, description, object_type, query, columns, filters, created_by, created_at)
  - [ ] Create `scheduled_reports` table (report_id, schedule, recipients, format, last_run, next_run)
  - [ ] Create `report_runs` table (report_id, run_at, status, result_count, file_url)
  - [ ] Support report sharing: `report_shares` table (report_id, shared_with_user_id, permission)
- [ ] Build report builder UI
  - [ ] Create `/reports/new` page with report builder interface
  - [ ] Step 1: Select object type (devices, people, networks, etc.)
  - [ ] Step 2: Select columns to include (drag from available fields)
  - [ ] Step 3: Add filters using react-querybuilder (field, operator, value)
  - [ ] Step 4: Add sorting (drag to reorder, select ASC/DESC)
  - [ ] Step 5: Preview results (show first 20 rows)
  - [ ] Save report button → store in `reports` table
- [ ] Implement query builder backend
  - [ ] API endpoint `/api/reports/execute` to run report queries
  - [ ] Convert react-querybuilder rules to SQL WHERE clause
  - [ ] Security: Whitelist allowed columns and tables (prevent SQL injection)
  - [ ] Apply column selection dynamically (SELECT specified columns)
  - [ ] Apply sorting dynamically (ORDER BY specified columns)
  - [ ] Return results as JSON with total count
- [ ] Add aggregation support
  - [ ] Support GROUP BY (e.g., "Count devices by location")
  - [ ] Support aggregation functions: COUNT, SUM, AVG, MIN, MAX
  - [ ] UI: Toggle "Aggregate" mode in report builder
  - [ ] Show aggregate results in table or chart format
- [ ] Create pre-built report templates
  - [ ] Template: "Devices by Location" (grouped by location, count)
  - [ ] Template: "Expiring Warranties" (devices with warranty < 90 days)
  - [ ] Template: "Unassigned Devices" (devices with no person assigned)
  - [ ] Template: "License Utilization" (licenses with seat usage %)
  - [ ] Template: "Network Inventory" (networks with IP count and utilization)
  - [ ] Template: "Inactive Users" (people with status = inactive)
  - [ ] Store templates in database with `is_template=true` flag
  - [ ] UI: "Create from Template" button → duplicate template as new report
- [ ] Implement report export
  - [ ] Export to CSV (all columns, all rows)
  - [ ] Export to Excel (with formatting, headers, formulas)
  - [ ] Export to PDF (table layout with page breaks)
  - [ ] Export to JSON (for API consumers or integrations)
  - [ ] Store exported files in configured storage backend (local, NFS, S3)
  - [ ] Download link valid for 24 hours (presigned URL for S3)
- [ ] Add report scheduling
  - [ ] UI: "Schedule Report" button on report detail page
  - [ ] Select frequency: daily, weekly, monthly, quarterly
  - [ ] Select day/time for execution (e.g., "Every Monday at 8 AM")
  - [ ] Add email recipients (comma-separated)
  - [ ] Select export format (CSV, Excel, PDF)
  - [ ] Save to `scheduled_reports` table
- [ ] Build report scheduler service
  - [ ] Create cron job or background worker to check `scheduled_reports.next_run`
  - [ ] Execute report query and generate export file
  - [ ] Send email with attachment or download link
  - [ ] Update `last_run` and `next_run` timestamps
  - [ ] Log execution in `report_runs` table with status (success, failed)
  - [ ] Handle errors: Retry 3 times, then mark as failed and notify admin
- [ ] Create report dashboard
  - [ ] URL: `/reports` - list all reports with search and filters
  - [ ] Show: Report name, object type, created by, last run, next run (if scheduled)
  - [ ] Actions: Run now, edit, duplicate, share, delete
  - [ ] Filter by object type, created by, scheduled vs on-demand
  - [ ] Sort by name, last run, created date
- [ ] Add report sharing
  - [ ] "Share" button → modal to select users or roles
  - [ ] Permission levels: view (run report), edit (modify report), admin (delete, share)
  - [ ] Shared reports appear in "Shared with Me" section
  - [ ] Email notification when report is shared
- [ ] Implement chart visualizations
  - [ ] Support chart types: bar, line, pie, donut, area
  - [ ] UI: Toggle between table view and chart view
  - [ ] Use Chart.js or Recharts for rendering
  - [ ] Auto-detect chart type based on data (1 dimension = pie, 2 dimensions = bar)
  - [ ] Export charts as PNG images
- [ ] Add report versioning (optional)
  - [ ] Track changes to report queries in `report_versions` table
  - [ ] Show version history on report detail page
  - [ ] Revert to previous version if needed
  - [ ] Compare versions side-by-side
- [ ] Performance optimization
  - [ ] Cache report results for 5 minutes (avoid re-running expensive queries)
  - [ ] Implement query timeouts (30 seconds max)
  - [ ] For large datasets, paginate results (server-side pagination)
  - [ ] Add indexes on commonly filtered columns (status, location_id, etc.)

#### 2.5 Enhanced RBAC - **IN PROGRESS** (Started 2025-10-12)
**Goal**: Hierarchical roles with attribute-based permissions, object-level overrides, and location scoping

**Research Summary**: Core RBAC (roles + permissions) is sufficient for basic needs. Hierarchical RBAC adds role inheritance (e.g., Manager inherits Employee permissions). Attribute-Based Access Control (ABAC) enables fine-grained rules based on user attributes, object attributes, and context. Recommend Hierarchical RBAC with location scoping for Phase 2.

**Implementation Progress** (as of 2025-10-12):

✅ **Phase 1: Database & Core Infrastructure** (COMPLETE)
- [x] Extend RBAC data model
  - [x] Add `roles.parent_role_id` for hierarchical roles (tree structure) - migration 006
  - [x] Add `role_assignments.granted_by` for audit trail - migration 006
  - [x] Add `object_permissions.granted_by` for audit trail - migration 006
  - [x] Create helper function `check_role_hierarchy_cycle()` - migration 006
  - [x] Create view `role_hierarchy_permissions` for inheritance - migration 006
  - [x] Run migration to update database schema - ✓ Applied successfully
- [x] Update TypeScript types
  - [x] Add `parent_role_id` to Role interface (src/types/index.ts)
  - [x] Add `granted_by` to RoleAssignment and ObjectPermission (src/types/index.ts)
  - [x] Update Zod schemas for parent_role_id (src/lib/schemas/rbac.ts)
- [x] Build permission checking middleware (src/lib/rbac.ts)
  - [x] Create `checkPermission(user, action, objectType, objectId?)` function
  - [x] Implement `getRoleHierarchy()` with recursive CTE
  - [x] Implement `getRolePermissions()` with inheritance support
  - [x] Implement `getUserPermissions()` aggregating all role assignments
  - [x] Implement `hasLocationAccess()` for location scoping
  - [x] Implement `checkPermissionWithLocation()` combining permission + location checks
  - [x] Logic: Check object permissions first, then role permissions, then default deny
  - [x] Handle location scoping: If role is location-scoped, check object's location
  - [x] Cache permission checks with 5-minute TTL (avoid repeated database queries)
  - [x] Invalidate cache when role assignments or permissions change
  - [x] Validation: Prevent circular role hierarchies with `checkRoleHierarchyCycle()`

✅ **Phase 2: API Routes** (100% COMPLETE - as of 2025-10-12)
- [x] Build Permissions API (src/app/api/permissions/) ✅ COMPLETE
  - [x] GET /api/permissions - List with filters (object_type, action)
  - [x] POST /api/permissions - Create permission (super_admin only)
  - [x] GET /api/permissions/:id - Get single
  - [x] PATCH /api/permissions/:id - Update (super_admin only)
  - [x] DELETE /api/permissions/:id - Delete with usage check (super_admin only)
- [x] Build Role Assignments API (src/app/api/role-assignments/) ✅ COMPLETE
  - [x] GET /api/role-assignments - List with JOINs (person, group, role, locations)
  - [x] POST /api/role-assignments - Create with location scoping + transaction
  - [x] GET /api/role-assignments/:id - Get single with locations JOIN
  - [x] PATCH /api/role-assignments/:id - Update scope/locations (transaction)
  - [x] DELETE /api/role-assignments/:id - Revoke assignment + invalidate cache
- [x] Build Object Permissions API (src/app/api/object-permissions/) ✅ COMPLETE
  - [x] route.ts: GET (list with filters), POST (grant permission)
  - [x] [id]/route.ts: DELETE (revoke permission)
- [x] Enhance Roles API (src/app/api/roles/) ✅ COMPLETE
  - [x] Update [id]/route.ts: Add parent_role_id to PATCH with cycle detection
  - [x] Create [id]/hierarchy/route.ts: GET role tree (use getRoleHierarchy from rbac.ts)
  - [x] Update [id]/permissions/route.ts: GET with inherited flag (use getRolePermissions)
  - [x] Create [id]/permissions/[permissionId]/route.ts: DELETE remove permission
- [x] Create Permission Testing API (src/app/api/rbac/) ✅ COMPLETE
  - [x] Create test-permission/route.ts: POST endpoint
  - [x] Call checkPermission() from rbac.ts
  - [x] Returns: { granted, reason, path } for debugging

✅ **Phase 3: Admin UI** (100% COMPLETE - as of 2025-10-12)

✅ **Phase 4: RBAC Enhancements** (COMPLETE - as of 2025-10-16)
- [x] Add permission audit logging to admin_audit_log ✅ **COMPLETE**
  - [x] Added logAdminAction() calls to all RBAC API routes
  - [x] Logs role creation/update/deletion with before/after values
  - [x] Logs role assignment creation/update/revocation
  - [x] Logs role permission changes with added/removed permission IDs
  - [x] Captures IP address and user agent for audit trail
- [x] Add edit assignment functionality ✅ **COMPLETE**
  - [x] Created EditRoleAssignmentModal component (src/components/EditRoleAssignmentModal.tsx)
  - [x] Supports editing scope (global, location, specific_objects)
  - [x] Supports editing location assignments with checkbox selection
  - [x] Supports editing notes field
  - [x] Wired up to assignments page Edit button
  - [x] Uses existing PATCH /api/role-assignments/:id endpoint
- [x] Implement role templates seed data ✅ **COMPLETE**
  - [x] Created seeds/004_role_templates.sql with 5 IT-specific roles
  - [x] **IT Admin**: Full access to IT infrastructure (devices, networks, software, IOs, IPs)
  - [x] **Help Desk**: View all, edit people/devices/licenses
  - [x] **Network Admin**: Full network infrastructure access, view others
  - [x] **Security Auditor**: Read-only access to everything
  - [x] **Location Manager**: Full access within assigned locations (for location-scoped assignments)
  - [x] All roles have appropriate permission assignments

✅ **Phase 5: Role Hierarchy Visualization** (COMPLETE - as of 2025-10-16)
- [x] Implement permission inheritance visualization ✅ **COMPLETE**
  - [x] Created RoleHierarchyTree component (src/components/RoleHierarchyTree.tsx)
  - [x] Displays roles in tree structure with parent-child relationships
  - [x] Shows visual connector lines between parent and child roles
  - [x] Displays permission counts (direct, inherited, total) for each role
  - [x] Interactive expand/collapse functionality for tree nodes
  - [x] Click-to-navigate to role detail pages
  - [x] Expand All / Collapse All controls
  - [x] Created dedicated hierarchy view page (src/app/admin/rbac/hierarchy/page.tsx)
  - [x] Added "View Hierarchy" button to roles list page
  - [x] Includes educational info card explaining how role inheritance works

**Remaining Tasks** (Future Enhancements - deferred to Phase 6):
- [ ] Implement attribute-based rules (future ABAC)
- [ ] Add permission groups (optional - group related permissions for bulk assignment)
- [ ] Playwright E2E tests for RBAC workflows (requires running dev server)

#### 2.6 Bulk Operations ✓ COMPLETE
**Goal**: CSV import/export, bulk edit, bulk delete with validation and error handling

**Research Summary**: Papa Parse chosen for CSV handling. Implemented field mapping, validation, error reporting, and batch processing (100 records per chunk).

**Implementation Completed** (2025-10-12):
**Future Enhancements** (deferred to Phase 3):
  - [ ] Check foreign key references exist during validation (currently checked at database level)
  - [ ] Check unique constraints during validation (currently checked at database level)
  - [ ] Download error report as CSV (for fixing and re-importing)
  - [ ] Option: "Import valid rows only" (skip invalid rows)
  - [ ] Create import history tracking
    - [ ] Store import jobs in `import_jobs` table
    - [ ] Store import results in `import_results` table
    - [ ] UI: `/imports/history` - list all imports with status
  - [ ] CSV export column selection (currently exports all columns)
  - [ ] Streaming CSV downloads for very large exports
  - [ ] Implement bulk edit
    - [ ] Checkboxes for row selection
    - [ ] Bulk edit modal with field selection
    - [ ] API: PATCH `/api/:objectType/bulk`
  - [ ] Implement bulk delete
    - [ ] Bulk delete with confirmation
    - [ ] Dependency checking
    - [ ] API: DELETE `/api/:objectType/bulk`
  - [ ] Add bulk operations audit logging
  - [ ] Log all bulk deletes to admin_audit_log (with deleted IDs)
  - [ ] Include: User, timestamp, operation type, object type, count, status
- [ ] Build import templates
  - [ ] Provide downloadable CSV templates for each object type
  - [ ] Templates include column headers with correct field names
  - [ ] Include sample data (1-2 rows) to show expected format
  - [ ] Link on import page: "Download template for devices"
- [ ] Implement duplicate detection
  - [ ] Before importing, check for duplicates by unique fields (e.g., serial_number)
  - [ ] Modal: "Found X potential duplicates. Choose action:"
  - [ ] Options: Skip duplicates, update existing, create new
  - [ ] Show duplicate matches: CSV row vs existing record (side-by-side comparison)
  - [ ] User selects action per duplicate or applies to all
- [ ] Add data validation preview
  - [ ] After field mapping, show validation results in real-time
  - [ ] Table: Row, all mapped fields, validation status (✓ valid, ✗ error)
  - [ ] Color-code rows: Green=valid, red=errors, yellow=warnings
  - [ ] Click row → show detailed validation errors
  - [ ] "Export validation report" → CSV with all errors
- [ ] Performance optimization
  - [ ] Use Web Workers for CSV parsing (don't block UI thread)
  - [ ] Lazy-load preview table (virtualize rows with react-window)
  - [ ] Debounce validation checks (wait for user to stop typing)
  - [ ] Backend: Use bulk INSERT queries (faster than individual INSERTs)
  - [ ] Backend: Disable triggers during bulk import (if safe), re-enable after

#### 2.7 File Uploads & Attachments ✅ **CORE COMPLETE** (2025-10-12)
**Goal**: Upload and attach files to any object (devices, people, documents, etc.) with secure storage

**Research Summary**: Best practice for file uploads is presigned URLs (S3, R2, etc.) for direct client-to-storage uploads, avoiding server bandwidth and processing. react-dropzone is the most popular drag-and-drop library. Support multiple storage backends (local, NFS, S3-compatible).

**Implementation Completed** (2025-10-12):
**Future Enhancements** (deferred to Phase 3):
- [ ] Add file preview features
  - [ ] Image preview: Show thumbnail in list, click to view full size
  - [ ] PDF preview: Embed PDF viewer (use PDF.js or browser native viewer)
  - [ ] Office docs: Show preview using Office Online Viewer (requires Office 365) or Google Docs Viewer
  - [ ] Text files: Syntax highlighting for code files (use Prism.js or Highlight.js)
  - [ ] Video/audio: Embed HTML5 player with controls
- [ ] Implement NetworkStorageAdapter for NFS/SMB shares
- [ ] Add file metadata
  - [ ] Store file metadata in `file_attachments` table: width/height (images), duration (videos), page count (PDFs)
  - [ ] Generate thumbnails for images (resize to 200x200px)
  - [ ] Extract EXIF data from images (camera model, location, date taken)
  - [ ] Store in JSONB column `metadata` for flexible schema
- [ ] Implement access control
  - [ ] User can only download attachment if they have view permission on parent object
  - [ ] User can only delete attachment if they have edit permission on parent object
  - [ ] Check permissions in API before generating download URL
  - [ ] Presigned URLs should be short-lived (1 hour max) to prevent unauthorized sharing
- [ ] Add virus scanning (optional, security)
  - [ ] Integrate ClamAV or cloud-based virus scanning (VirusTotal API)
  - [ ] Scan file after upload, before making available for download
  - [ ] Quarantine infected files (set status=quarantined in database)
  - [ ] Notify admin of infected uploads
- [ ] Build attachment search
  - [ ] Index attachment filenames in PostgreSQL full-text search
  - [ ] Search by filename: "contract 2024"
  - [ ] Filter by MIME type: "Show all PDFs"
  - [ ] Filter by uploaded date: "Uploaded in last 30 days"
  - [ ] Filter by uploader: "Uploaded by John Doe"
- [ ] Implement storage quota management
  - [ ] Admin setting: Max storage per user or per organization
  - [ ] Track storage usage per user in `users` table (storage_used_bytes)
  - [ ] Show storage usage in user settings: "4.2 GB / 10 GB used"
  - [ ] Block uploads if quota exceeded (API returns 413 Payload Too Large)
  - [ ] Admin dashboard: Total storage used across all users
- [ ] Add bulk attachment operations
  - [ ] Bulk download: Select multiple attachments → download as ZIP file
  - [ ] Bulk delete: Select multiple attachments → delete with confirmation
  - [ ] Bulk move: Move attachments to different object (if applicable)
- [ ] Optimize image uploads
  - [ ] Client-side image compression before upload (reduce file size)
  - [ ] Use browser-image-compression library (lossy or lossless)
  - [ ] Resize large images to max 4096x4096px (reduce storage costs)
  - [ ] Convert HEIC (iOS photos) to JPEG for compatibility
- [ ] Create attachment analytics
  - [ ] Track: Most uploaded file types (for storage planning)
  - [ ] Track: Most downloaded attachments (identify popular files)
  - [ ] Track: Storage usage trends over time (for capacity planning)
  - [ ] Dashboard widget: "Storage Usage by File Type" (pie chart)

#### 2.8 SaaS Service Integrations
**Goal**: Connect M.O.S.S. to external SaaS services via REST APIs, webhooks, and OAuth2

**Research Summary**: Integration patterns include webhooks (service → M.O.S.S. notifications), REST APIs (M.O.S.S. → service queries), and OAuth2 for authentication. Key services: Okta (user sync), Jamf (device inventory), Jira (ticketing), Slack (notifications).

**Implementation Steps**:
- [ ] Design integrations data model (already exists)
  - [ ] Review `integrations` table schema (type, provider, config JSONB, sync settings)
  - [ ] Review `integration_sync_logs` table for sync history
  - [ ] Ensure support for OAuth2 tokens in config JSONB (access_token, refresh_token, expires_at)
- [ ] Build OAuth2 flow
  - [ ] Create `/api/integrations/oauth/authorize` endpoint (redirect to provider)
  - [ ] Generate state parameter (CSRF protection) and store in session
  - [ ] Redirect to provider's authorization URL (e.g., Okta, Google, Microsoft)
  - [ ] Create `/api/integrations/oauth/callback` endpoint (handle authorization code)
  - [ ] Exchange authorization code for access token + refresh token
  - [ ] Store tokens in `integrations.config` JSONB field (encrypted)
  - [ ] Redirect user back to integration settings page with success message
- [ ] Implement token refresh
  - [ ] Before each API call, check if access token is expired
  - [ ] If expired, call refresh token endpoint to get new access token
  - [ ] Update `integrations.config` with new tokens
  - [ ] If refresh fails (e.g., user revoked access), mark integration as "disconnected"
- [ ] Build integration connector framework
  - [ ] Create `src/lib/integrations/BaseConnector.ts` abstract class
  - [ ] Methods: connect(), disconnect(), testConnection(), sync(), fetchData()
  - [ ] Implement connector per provider: OktaConnector, JamfConnector, JiraConnector, etc.
  - [ ] Load connector dynamically based on `integrations.provider`
- [ ] Implement Okta integration
  - [ ] Connector: `OktaConnector.ts` using Okta API v1 (REST)
  - [ ] Sync users from Okta to M.O.S.S. people table
  - [ ] Mapping: Okta user → M.O.S.S. person (email, full_name, status)
  - [ ] Sync groups from Okta to M.O.S.S. groups table
  - [ ] Mapping: Okta group → M.O.S.S. group (group_name, group_type=okta)
  - [ ] Handle pagination (Okta API returns 200 users per page)
  - [ ] Incremental sync: Only fetch users updated since last sync (use lastUpdated filter)
- [ ] Implement Jamf integration
  - [ ] Connector: `JamfConnector.ts` using Jamf Pro API (REST)
  - [ ] Sync devices (Macs, iPads, iPhones) from Jamf to M.O.S.S. devices table
  - [ ] Mapping: Jamf computer → M.O.S.S. device (serial_number, hostname, os_name, os_version)
  - [ ] Sync installed applications from Jamf to M.O.S.S. installed_applications table
  - [ ] Sync smart groups from Jamf to M.O.S.S. groups table
  - [ ] Handle Jamf API authentication (bearer token or basic auth)
- [ ] Implement Jira integration
  - [ ] Connector: `JiraConnector.ts` using Jira Cloud REST API
  - [ ] Create Jira issues from M.O.S.S. (e.g., "Device needs repair")
  - [ ] Update Jira issue status from M.O.S.S. (e.g., mark as resolved)
  - [ ] Sync Jira projects to M.O.S.S. (optional, for linking tickets)
  - [ ] Store Jira issue keys in M.O.S.S. external_documents table
- [ ] Implement Slack integration
  - [ ] Connector: `SlackConnector.ts` using Slack Web API
  - [ ] Send notifications to Slack channels (e.g., "Warranty expiring soon")
  - [ ] Support for Slack commands: `/moss device search` (responds with search results)
  - [ ] OAuth2 flow for Slack app installation (user authorizes M.O.S.S. to access workspace)
- [ ] Build webhook receiver
  - [ ] Create `/api/webhooks/:integrationId` endpoint (POST)
  - [ ] Verify webhook signature (HMAC-SHA256) to prevent spoofing
  - [ ] Parse webhook payload (JSON or form-encoded)
  - [ ] Route to appropriate handler based on event type (e.g., user.created, device.updated)
  - [ ] Process event asynchronously (queue with background worker)
  - [ ] Return 200 OK immediately (don't block webhook sender)
- [ ] Implement webhook handlers
  - [ ] Okta webhook: user.lifecycle.created → create person in M.O.S.S.
  - [ ] Okta webhook: user.lifecycle.deactivated → set person status=inactive
  - [ ] Jamf webhook: ComputerAdded → create device in M.O.S.S.
  - [ ] Jamf webhook: ComputerCheckIn → update device last_seen timestamp
  - [ ] Jira webhook: issue.created → link issue to M.O.S.S. object (if related)
- [ ] Add integration settings UI
  - [ ] URL: `/admin/integrations` - list all integrations (already exists)
  - [ ] Actions: Add integration, edit settings, test connection, disconnect, trigger sync
  - [ ] Add integration modal: Select provider from dropdown (Okta, Jamf, Jira, Slack, etc.)
  - [ ] Provider-specific configuration forms (dynamic based on provider)
  - [ ] OAuth2 providers: "Authorize with Okta" button → redirect to OAuth flow
  - [ ] API key providers: Input field for API key + base URL
- [ ] Build integration sync UI
  - [ ] "Sync Now" button on integration detail page
  - [ ] Show sync status: In progress (spinner), success (green checkmark), failed (red X)
  - [ ] Show sync stats: "Processed 150 users, created 5, updated 12, failed 2"
  - [ ] Link to sync logs: Click to view detailed log entries
  - [ ] Auto-refresh sync status every 5 seconds (polling or SSE)
- [ ] Implement sync scheduling
  - [ ] UI: Select sync frequency (manual, hourly, daily, weekly)
  - [ ] Store in `integrations.sync_frequency` field
  - [ ] Background worker: Check for integrations due for sync
  - [ ] Execute sync and log results to `integration_sync_logs`
  - [ ] Send notification if sync fails (email to admin)
- [ ] Add integration monitoring
  - [ ] Dashboard widget: "Integration Health" (green=connected, yellow=warning, red=failed)
  - [ ] Show last sync time and status per integration
  - [ ] Alert if integration hasn't synced in 24+ hours
  - [ ] Track API rate limits (e.g., Okta has 1000 requests/minute limit)
  - [ ] Show remaining rate limit quota in integration settings
- [ ] Implement error handling and retry
  - [ ] Catch API errors: Network errors, 401 Unauthorized, 429 Rate Limit, 500 Server Error
  - [ ] Retry transient errors with exponential backoff (1s, 2s, 4s, 8s, 16s)
  - [ ] Max 5 retries, then mark sync as failed
  - [ ] Log all errors to `integration_sync_logs.error_message`
  - [ ] Show user-friendly error messages in UI
- [ ] Build integration marketplace (future)
  - [ ] Pre-built connectors for popular services (Okta, Jamf, Jira, Slack, etc.)
  - [ ] One-click install with guided setup wizard
  - [ ] Community-contributed connectors (hosted on GitHub)
  - [ ] Connector ratings and reviews (optional)
- [ ] Add integration webhooks for outbound events
  - [ ] M.O.S.S. can call external webhooks when events occur (e.g., device.created)
  - [ ] Admin settings: Configure webhook URL + secret for each event type
  - [ ] Send POST request to webhook URL with event payload (JSON)
  - [ ] Sign payload with HMAC-SHA256 (recipient can verify authenticity)
  - [ ] Retry failed webhooks up to 3 times

#### 2.9 Mobile Enhancements
**Goal**: Responsive design, PWA capabilities, offline mode, and mobile-optimized workflows

**Research Summary**: PWAs are the future of mobile web apps with offline support, app-like UX, and no app store distribution. Key features: Service workers for caching, responsive design for all screen sizes, touch-optimized UI, push notifications. Expected to hit $2.8B market in 2025.

**Implementation Steps**:
- [ ] Audit responsive design
  - [ ] Test all pages on mobile breakpoints: 375px (iPhone SE), 768px (iPad), 1024px (iPad Pro)
  - [ ] Use browser DevTools responsive mode + real devices (iOS Safari, Android Chrome)
  - [ ] Check for: Text overflow, unreadable font sizes, broken layouts, inaccessible buttons
  - [ ] Priority pages: Dashboard, device list, device detail, person detail, global search
- [ ] Optimize mobile navigation
  - [ ] Convert header navigation to hamburger menu on mobile (< 768px)
  - [ ] Slide-out drawer navigation with smooth animation
  - [ ] Touch-friendly tap targets (44x44px minimum per Apple HIG)
  - [ ] Show breadcrumbs on mobile (truncate if too long)
  - [ ] Sticky header on scroll (navigation always accessible)
- [ ] Implement mobile-optimized tables
  - [ ] Replace table layout with card layout on mobile (< 768px)
  - [ ] Each row becomes a card with stacked fields
  - [ ] Show most important fields only (e.g., name, status, location)
  - [ ] "View More" button to expand card and show all fields
  - [ ] Swipe actions: Swipe left to edit, swipe right to delete
- [ ] Build mobile-optimized forms
  - [ ] Stack form fields vertically (full width) on mobile
  - [ ] Use native input types: type="tel", type="email", type="date" (triggers mobile keyboard)
  - [ ] Increase input field height (48px min) for touch targets
  - [ ] Replace dropdowns with bottom sheet pickers (better UX on mobile)
  - [ ] Floating action button (FAB) for submit (always visible)
- [ ] Implement Progressive Web App (PWA)
  - [ ] Create `manifest.json` with app metadata (name, icons, theme colors)
  - [ ] Add manifest link to HTML head: `<link rel="manifest" href="/manifest.json">`
  - [ ] Add app icons in multiple sizes (192x192, 512x512) for home screen
  - [ ] Set theme-color meta tag: `<meta name="theme-color" content="#1C7FF2">`
  - [ ] Set viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Build service worker for offline support
  - [ ] Create `public/service-worker.js` with caching strategies
  - [ ] Cache strategy: Network-first for API calls, cache-first for static assets
  - [ ] Cache app shell (HTML, CSS, JS) for offline UI rendering
  - [ ] Cache recent pages (e.g., last 10 visited device detail pages)
  - [ ] Cache images and fonts (long-term cache with versioning)
  - [ ] Precache critical assets on service worker install
- [ ] Implement offline detection
  - [ ] Detect network status with `navigator.onLine` API
  - [ ] Show banner when offline: "You are offline. Some features may be limited."
  - [ ] Disable actions that require network (e.g., save, delete)
  - [ ] Enable read-only access to cached data (view device details)
  - [ ] Queue actions when offline (sync when back online)
- [ ] Add offline data sync
  - [ ] Use IndexedDB to store offline data (devices, people, locations)
  - [ ] When offline, read from IndexedDB instead of API
  - [ ] When user edits data offline, store in IndexedDB outbox
  - [ ] When back online, sync outbox to server (POST/PATCH requests)
  - [ ] Handle conflicts: Server data changed since last sync (show diff and ask user)
- [ ] Optimize mobile performance
  - [ ] Lazy-load images with Intersection Observer API
  - [ ] Use responsive images with srcset (different sizes for different screens)
  - [ ] Reduce bundle size: Code splitting by route (load only what's needed)
  - [ ] Preload critical resources: Fonts, above-the-fold images
  - [ ] Defer non-critical JavaScript (analytics, chat widgets)
  - [ ] Target: < 3 second load time on 3G network
- [ ] Add mobile-specific features
  - [ ] QR code scanner: Scan asset tags to open device detail page
  - [ ] Use browser WebRTC API or library (react-qr-reader)
  - [ ] Camera integration: Take photos of devices and attach to records
  - [ ] Use HTML5 `<input type="file" accept="image/*" capture="environment">`
  - [ ] GPS location tagging: Capture location when creating devices on-site
  - [ ] Use Geolocation API to get lat/long coordinates
  - [ ] Tap-to-call: Phone numbers should be clickable links (`tel:+1234567890`)
  - [ ] Tap-to-email: Email addresses should be clickable links (`mailto:user@example.com`)
- [ ] Implement touch gestures
  - [ ] Swipe gestures on cards: Swipe left to edit, swipe right to delete
  - [ ] Pull-to-refresh on list views (refresh data from server)
  - [ ] Pinch-to-zoom on network topology diagrams
  - [ ] Long-press to select multiple items (bulk actions)
  - [ ] Use Hammer.js or native touch events
- [ ] Add push notifications (PWA)
  - [ ] Request notification permission on first login (mobile only)
  - [ ] Subscribe to push notifications via service worker
  - [ ] Backend: Send push notifications via Web Push API (VAPID keys)
  - [ ] Use cases: Warranty expiring soon, license expiring, sync completed, ticket assigned
  - [ ] Notification includes: Title, body, icon, action buttons (view, dismiss)
  - [ ] Clicking notification opens relevant page in PWA
- [ ] Build install prompt
  - [ ] Detect if PWA is installable (beforeinstallprompt event)
  - [ ] Show custom install banner: "Install M.O.S.S. for offline access"
  - [ ] Button: "Add to Home Screen" triggers install prompt
  - [ ] Track install success/failure (analytics)
  - [ ] Hide banner after install or dismiss
- [ ] Optimize mobile search
  - [ ] Autofocus search input on mobile (if user taps search icon)
  - [ ] Show search suggestions immediately (no need to type 3+ characters)
  - [ ] Larger tap targets for suggestions (48px height)
  - [ ] Voice search button (use Web Speech API)
  - [ ] Recent searches shown as chips (tap to re-run)
- [ ] Test on real devices
  - [ ] iOS Safari (iPhone SE, iPhone 15, iPad)
  - [ ] Android Chrome (Samsung Galaxy, Pixel)
  - [ ] Test PWA install flow on both platforms
  - [ ] Test offline mode: Enable airplane mode, use app
  - [ ] Test performance: Use Lighthouse mobile audit (target 90+ score)
- [ ] Add mobile analytics
  - [ ] Track: Mobile vs desktop usage (screen size detection)
  - [ ] Track: PWA installs (home screen adds)
  - [ ] Track: Offline sessions (time spent offline)
  - [ ] Track: Mobile-specific features (QR scan, camera, GPS)
  - [ ] Track: Mobile performance metrics (LCP, FID, CLS)

#### 2.10 UI Polish & Animations [IN PROGRESS - Started 2025-10-25]
**Goal**: Smooth animations, micro-interactions, loading states, and accessibility-friendly motion

**Research Summary**: Framer Motion is the most popular React animation library with intuitive API and performance optimizations. React Spring offers physics-based animations for realism. Key: Respect prefers-reduced-motion for accessibility, use performant CSS properties (transform, opacity), keep animations subtle (<300ms).

**Implementation Steps**:
- [ ] Choose animation library
  - [ ] Evaluate Framer Motion (recommended for most use cases)
  - [ ] Test: Page transitions, modal animations, list item animations
  - [ ] Evaluate React Spring (for complex physics-based animations)
  - [ ] Decision: Use Framer Motion for general animations, React Spring for special effects
  - [ ] Install: `npm install framer-motion`
- [ ] Implement page transitions
  - [ ] Wrap page content in Framer Motion `<motion.div>`
  - [ ] Fade in on mount: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}`
  - [ ] Slide up on mount: `initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`
  - [ ] Exit animations: Use AnimatePresence for unmount animations
  - [ ] Keep duration short: 200-300ms (feels instant but smooth)
- [ ] Add micro-interactions
  - [ ] Button hover: Scale up slightly (1.02x) with smooth transition
  - [ ] Button click: Scale down (0.98x) for tactile feedback
  - [ ] Card hover: Lift with shadow increase (elevation change)
  - [ ] Input focus: Border color change + subtle glow effect
  - [ ] Checkbox check: Checkmark draws in with SVG animation
  - [ ] Toggle switch: Knob slides with spring physics
- [ ] Animate list items
  - [ ] Stagger list items on mount: Each item fades in with 50ms delay
  - [ ] Use Framer Motion `staggerChildren` in parent container
  - [ ] Animate item removal: Fade out + slide out before DOM removal
  - [ ] Animate item addition: Fade in + slide in after DOM insertion
  - [ ] Drag-to-reorder: Animate position changes smoothly (layout animations)
- [ ] Implement loading states
  - [ ] Skeleton screens: Show loading placeholders with shimmer animation
  - [ ] Use Framer Motion for shimmer: Gradient moves left-to-right
  - [ ] Spinner: Rotating circle with smooth easing (not linear)
  - [ ] Progress bars: Animate width from 0 to 100% with spring physics
  - [ ] Button loading: Disable + show spinner inside button (preserve layout)
- [ ] Add modal animations
  - [ ] Backdrop: Fade in background overlay (opacity 0 → 0.5)
  - [ ] Modal content: Scale up from 0.95 to 1.0 + fade in
  - [ ] Exit: Reverse animation (scale down + fade out)
  - [ ] Keep duration: 250ms for smooth but fast transitions
  - [ ] Use AnimatePresence to enable exit animations
- [ ] Implement toast notifications
  - [ ] Slide in from top or bottom (depending on position)
  - [ ] Auto-dismiss after 5 seconds with fade out
  - [ ] User can swipe to dismiss (swipe down = slide out)
  - [ ] Stack multiple toasts with stagger animation (50ms delay each)
  - [ ] Use Framer Motion for animations, Sonner library already installed
- [ ] Add scroll animations
  - [ ] Fade in elements as they enter viewport (Intersection Observer)
  - [ ] Parallax effect on hero sections (background moves slower than foreground)
  - [ ] Sticky header: Show/hide on scroll direction (up=show, down=hide)
  - [ ] Scroll progress indicator: Bar at top shows % scrolled
  - [ ] Use Framer Motion's `useScroll` hook for scroll-driven animations
- [ ] Implement navigation animations
  - [ ] Sidebar expand/collapse: Smooth width animation with spring
  - [ ] Dropdown menus: Slide down with scale origin at top
  - [ ] Tab switching: Slide content left/right based on tab direction
  - [ ] Breadcrumb updates: Fade out old, fade in new (slight delay for readability)
- [ ] Add form validation animations
  - [ ] Error shake: Input shakes left-right on validation error
  - [ ] Success checkmark: Green checkmark fades in + scales up
  - [ ] Field focus: Subtle scale + border color transition
  - [ ] Validation message: Slide down from input field
- [ ] Implement data visualization animations
  - [ ] Charts: Animate bars/lines drawing in from 0
  - [ ] Use Recharts built-in animations or Framer Motion
  - [ ] Pie charts: Animate slice angles from 0 to final value
  - [ ] Number counters: Animate from 0 to target value (count up)
  - [ ] Use react-countup library or custom hook
- [ ] Add accessibility features
  - [ ] Respect `prefers-reduced-motion` media query
  - [ ] Framer Motion: Set `reducedMotion: "user"` in config
  - [ ] Reduced motion: Disable transform animations, keep opacity fades
  - [ ] Disable parallax and auto-playing animations for reduced motion users
  - [ ] Provide "Disable animations" toggle in user settings
- [ ] Optimize animation performance
  - [ ] Use GPU-accelerated properties: transform, opacity (avoid animating layout properties)
  - [ ] Avoid animating: width, height, top, left, margin, padding (causes reflow)
  - [ ] Use `will-change` CSS property sparingly (for complex animations only)
  - [ ] Monitor performance with DevTools: 60 FPS target, no frame drops
  - [ ] Test on low-end devices (e.g., older iPhones, budget Android)
- [ ] Implement theme transition
  - [ ] Smooth color transitions when switching light/dark mode
  - [ ] Animate background color, text color, border colors
  - [ ] Duration: 300ms with ease-in-out easing
  - [ ] Use CSS transitions on `:root` CSS variables
- [ ] Add empty state animations
  - [ ] Empty state illustrations fade in + float gently
  - [ ] Use subtle hover animations on empty state CTAs
  - [ ] Animate list when first item is added (celebrate with confetti? 🎉)
- [ ] Build animation design system
  - [ ] Define standard durations: fast (150ms), normal (250ms), slow (400ms)
  - [ ] Define standard easings: easeInOut, easeOut, spring
  - [ ] Create reusable animation presets (fadeIn, slideUp, scaleUp, etc.)
  - [ ] Document in design system guide (animation principles)
- [ ] Test animations thoroughly
  - [ ] Test on multiple browsers (Chrome, Safari, Firefox, Edge)
  - [ ] Test with reduced motion enabled (verify animations still work but simpler)
  - [ ] Test performance: No jank, smooth 60 FPS
  - [ ] Test accessibility: Animations don't cause motion sickness
  - [ ] Use Lighthouse audit to check animation performance

#### 2.11 Equipment Check-Out & Reservation System
**Goal**: Implement a Cheqroom-inspired equipment checkout system for media production workflows with barcode scanning, reservations, digital agreements, and equipment kits

**Research Summary** (2025-10-16): Cheqroom is preferred in media industry for being purpose-built for equipment operations (not just static tracking), user accessibility for non-technical users, strong accountability via digital signatures and audit trails, mobile-first barcode scanning, equipment kits/bundles support, and real-time availability tracking. Key workflow: Reserve → Check-out (scan, sign agreement) → Check-in (scan, report condition). Supports QR, Code 39, Code 128, PDF417, DataMatrix, EAN-8, UPC-12 barcode formats.

**Implementation Steps**:

**Phase 1: Database Schema & Core Models**
- [ ] Create database migration (migrations/022_equipment_checkout.sql)
  - [ ] `equipment_checkouts` table
    - Columns: id, device_id (FK), checked_out_by (FK people), checked_out_at, expected_return_date, actual_return_date, status ('checked_out', 'returned', 'overdue', 'lost'), agreement_signed_at, signature_data (TEXT), late_fee_amount, condition_on_checkout, condition_on_return, notes
    - Indices: device_id, checked_out_by, status, expected_return_date, created_at
  - [ ] `equipment_reservations` table
    - Columns: id, device_id (FK), reserved_by (FK people), reservation_start, reservation_end, status ('pending', 'approved', 'active', 'completed', 'cancelled'), purpose, approval_required (BOOLEAN), approved_by (FK people), approved_at, notes
    - Indices: device_id, reserved_by, status, reservation_start, reservation_end
    - Check constraint: reservation_end > reservation_start
  - [ ] `equipment_kits` table
    - Columns: id, kit_name, description, is_template (BOOLEAN), created_by (FK people), kit_qr_code (TEXT), is_active (BOOLEAN), notes
    - Note: Kit items use existing parent_device_id relationships
  - [ ] `checkout_agreements` table
    - Columns: id, checkout_id (FK), agreement_template_id (FK), agreement_text (TEXT), signature_image_url, signed_at, signer_ip_address, user_agent
  - [ ] `agreement_templates` table
    - Columns: id, template_name, template_text (TEXT), is_default (BOOLEAN), created_by (FK people), is_active (BOOLEAN)
  - [ ] `equipment_condition_logs` table
    - Columns: id, device_id (FK), logged_by (FK people), checkout_id (FK), condition ('excellent', 'good', 'fair', 'damaged', 'broken'), damage_description (TEXT), requires_repair (BOOLEAN), logged_at
  - [ ] `condition_photos` junction table
    - Columns: condition_log_id (FK), file_attachment_id (FK) - uses existing file_attachments table
- [ ] Create TypeScript types (src/types/checkout.ts)
  - [ ] CheckoutStatus, ReservationStatus, EquipmentCondition enums
  - [ ] EquipmentCheckout, EquipmentReservation, EquipmentKit, CheckoutAgreement, ConditionLog interfaces
  - [ ] Create/Update input types for each
- [ ] Create Zod validation schemas (src/lib/schemas/checkout.ts)
- [ ] Add `checkout_status` computed field to devices (helper function in src/lib/equipmentStatus.ts)
  - Available: No active checkout or reservation
  - Reserved: Has future reservation
  - Checked Out: Has active checkout
  - Maintenance: Flagged for repair

**Phase 2: Barcode/QR Code Generation & Management**
- [ ] Install barcode libraries
  - [ ] `npm install qrcode jsbarcode html5-qrcode`
  - [ ] `npm install --save-dev @types/qrcode @types/jsbarcode`
- [ ] Create QR code generation utility (src/lib/qrcode-utils.ts)
  - [ ] generateDeviceQRCode(deviceId, assetTag) - Returns data URL
  - [ ] generateKitQRCode(kitId) - Returns data URL
  - [ ] parseQRCodeData(qrData) - Extract device/kit ID
  - [ ] Support QR, Code 39, Code 128 formats
- [ ] Build QR code label printing (src/components/QRCodeLabel.tsx)
  - [ ] Device info (name, asset tag, location)
  - [ ] QR code image (centered, 2-3 inch size)
  - [ ] Barcode below QR (asset tag in Code 39/128)
  - [ ] Print-optimized CSS (300 DPI, 4x6 inch labels)
- [ ] Bulk QR generation API (/api/devices/generate-qr-codes)
  - [ ] POST with device IDs array
  - [ ] Generate and store QR codes in file_attachments
  - [ ] Update devices.asset_tag if missing (auto-generate from pattern)
- [ ] Device list "Generate QR Codes" bulk action
  - [ ] Checkbox selection
  - [ ] "Print Labels" button → PDF with labels grid
- [ ] Custom QR code import
  - [ ] Admin UI to import existing barcode mappings (CSV: barcode → device_id)
  - [ ] Validation: Ensure barcode uniqueness

**Phase 3: Reservation System**
- [ ] Build reservation calendar API
  - [ ] GET /api/reservations/calendar - Returns availability by date range
  - [ ] GET /api/reservations/conflicts - Check conflicts for device + date range
  - [ ] POST /api/reservations - Create reservation with validation
  - [ ] PATCH /api/reservations/:id - Update (admin can override, user can cancel own)
  - [ ] DELETE /api/reservations/:id - Cancel reservation
- [ ] Create ReservationCalendar component (src/components/ReservationCalendar.tsx)
  - [ ] Weekly/monthly views (use react-big-calendar or custom)
  - [ ] Color-coded events (pending=yellow, approved=green, active=blue, completed=gray)
  - [ ] Click date → "Create Reservation" modal
  - [ ] Drag to resize reservation duration
  - [ ] Filter by device, person, location
- [ ] Build reservation wizard (src/components/ReservationWizard.tsx)
  - [ ] Step 1: Select device(s) or kit
  - [ ] Step 2: Select date range (start/end date-time)
  - [ ] Step 3: Add purpose and notes
  - [ ] Step 4: Confirmation with conflict check
  - [ ] Auto-approval or "Pending Approval" based on settings
- [ ] Reservation approval workflow
  - [ ] Admin UI: /equipment/reservations/pending
  - [ ] "Approve" / "Deny" actions with notes
  - [ ] Email notification to requester on approval/denial
- [ ] Recurring reservations support
  - [ ] Weekly recurrence (e.g., "Every Monday 9 AM - 5 PM for Studio A")
  - [ ] End date for recurrence series
  - [ ] "Edit series" vs "Edit this occurrence"
- [ ] Automated reminder notifications (use existing notification system)
  - [ ] 24 hours before pickup
  - [ ] Day of pickup (morning)
  - [ ] 1 hour before pickup

**Phase 4: Check-Out Workflow**
- [ ] Build check-out API
  - [ ] POST /api/checkouts - Create checkout (from reservation or ad-hoc)
  - [ ] Validation: Device available, no conflicts, required fields
  - [ ] Generate PDF agreement from template
  - [ ] Send email confirmation with agreement PDF
- [ ] Create CheckOutWizard component (src/components/CheckOutWizard.tsx)
  - [ ] Step 1: Scan device QR code (or manual search)
  - [ ] Step 2: Verify availability (show conflicts if any)
  - [ ] Step 3: Set expected return date
  - [ ] Step 4: Review checkout agreement (scrollable text, require scroll to bottom)
  - [ ] Step 5: Digital signature capture (react-signature-canvas)
  - [ ] Progress indicator (5 circles, current highlighted)
  - [ ] Mobile-optimized (large buttons, 48px min tap targets)
- [ ] Agreement generation (src/lib/agreementGenerator.ts)
  - [ ] Load template from agreement_templates
  - [ ] Replace placeholders: {{person_name}}, {{device_name}}, {{return_date}}, {{today_date}}
  - [ ] Convert to PDF (use existing PDF library or jsPDF)
  - [ ] Store in file_attachments with object_type='checkout'
- [ ] Multi-device checkout
  - [ ] Scan multiple devices (add to cart)
  - [ ] Single agreement for all items
  - [ ] All items must be available
- [ ] Kit checkout
  - [ ] Scan kit QR code
  - [ ] Auto-populate all child devices (query devices WHERE parent_device_id = kit_id)
  - [ ] Show kit contents with individual availability
  - [ ] Check out all items together (transaction)
- [ ] Mobile checkout page (/equipment/checkout/scan)
  - [ ] Camera view with scan overlay
  - [ ] Large "Scan QR Code" button
  - [ ] Manual entry fallback (search by asset tag)
  - [ ] Recent scans list (quick re-select)

**Phase 5: Check-In Workflow**
- [ ] Build check-in API
  - [ ] POST /api/checkouts/:id/checkin - Complete checkout
  - [ ] Record actual_return_date, condition_on_return
  - [ ] Calculate late fees if overdue (configurable rate)
  - [ ] Update device status to 'maintenance' if damaged
- [ ] Create CheckInWizard component (src/components/CheckInWizard.tsx)
  - [ ] Step 1: Scan device QR code
  - [ ] Step 2: Report equipment condition (excellent, good, fair, damaged)
  - [ ] Step 3: Upload damage photos if damaged (camera or file upload)
  - [ ] Step 4: Confirm return (show late fees if applicable)
  - [ ] Auto-dismiss modal on success
- [ ] Damage reporting workflow
  - [ ] If condition = 'damaged' → require damage_description
  - [ ] Upload photos to file_attachments
  - [ ] Create entry in equipment_condition_logs
  - [ ] Flag device for maintenance (update devices.status = 'repair')
  - [ ] Notify admin/maintenance team (email or Slack)
- [ ] Late fee calculation
  - [ ] Configurable per device_type (admin setting)
  - [ ] Daily rate (e.g., $5/day for cameras, $2/day for accessories)
  - [ ] Store in equipment_checkouts.late_fee_amount
  - [ ] Optional: Invoice generation (future enhancement)
- [ ] Mobile check-in page (/equipment/checkin/scan)
  - [ ] Similar to checkout page (camera, manual entry)
  - [ ] Quick condition selection (large buttons)

**Phase 6: Barcode Scanning Integration**
- [ ] Create BarcodeScanner component (src/components/BarcodeScanner.tsx)
  - [ ] Use html5-qrcode library (MIT license, 13k+ stars)
  - [ ] Request camera permission (navigator.mediaDevices.getUserMedia)
  - [ ] Show camera preview with scan overlay
  - [ ] Support QR, Code 39, Code 128, PDF417, DataMatrix, EAN-8, UPC-12
  - [ ] Emit onScan event with barcode data
  - [ ] Handle errors (no camera, permission denied) gracefully
- [ ] Manual barcode entry fallback
  - [ ] Input field with autofocus
  - [ ] Search devices by asset_tag
  - [ ] Typeahead suggestions
- [ ] Scan history (localStorage or IndexedDB)
  - [ ] Store last 10 scanned devices
  - [ ] Quick re-select from history
  - [ ] Clear history button
- [ ] Offline scanning support (PWA enhancement)
  - [ ] Queue scans in IndexedDB when offline
  - [ ] Sync to server when back online
  - [ ] Show "offline mode" badge

**Phase 7: Equipment Kits & Bundles**
- [ ] Kit creation UI (/equipment/kits/new)
  - [ ] Kit name and description
  - [ ] Select devices (search with filters)
  - [ ] Use parent_device_id relationships (kit = parent, items = children)
  - [ ] Generate kit QR code
  - [ ] Mark as template (reusable)
- [ ] Kit templates
  - [ ] Pre-defined kits: "Camera Kit A", "Interview Setup", "Studio Lighting"
  - [ ] Clone template to create new kit instance
  - [ ] Admin can create/edit templates
- [ ] Kit availability calculation
  - [ ] API: GET /api/kits/:id/availability
  - [ ] Check all child devices: ALL must be available
  - [ ] Return: available (BOOLEAN), unavailable_items (array), reason
- [ ] Kit checkout workflow
  - [ ] Scan kit QR code → auto-populate all items
  - [ ] Show kit contents list with per-item status
  - [ ] "Check Out All" button (disabled if any item unavailable)
  - [ ] Single agreement for entire kit
- [ ] Partial kit checkout (optional - future enhancement)
  - [ ] Allow subset of kit items if some unavailable
  - [ ] Warning: "Kit incomplete - missing items: X, Y, Z"

**Phase 8: Mobile PWA Enhancements**
- [ ] Camera access UI improvements
  - [ ] Permissions onboarding ("Allow camera to scan barcodes")
  - [ ] Test camera on iOS Safari and Android Chrome
  - [ ] Fallback to file input if camera unavailable
- [ ] Dedicated routes
  - [ ] /equipment/checkout/scan (check-out wizard)
  - [ ] /equipment/checkin/scan (check-in wizard)
  - [ ] /equipment/scan (general scanner → choose action)
- [ ] Touch-optimized scan UI
  - [ ] Large scan button (64×64px, centered)
  - [ ] Haptic feedback on successful scan (navigator.vibrate(200))
  - [ ] Audio beep on scan (optional, toggle in settings)
- [ ] Offline queue
  - [ ] IndexedDB table: pending_checkouts, pending_checkins
  - [ ] Sync when online (POST to API)
  - [ ] Show sync status (badge with count)

**Phase 9: Notifications & Reminders**
- [ ] Email notifications (use existing notification system)
  - [ ] Checkout confirmation (includes PDF agreement)
  - [ ] Return reminder (24 hrs before due, day of, 1 hr before)
  - [ ] Overdue notice (1 day, 3 days, 7 days)
  - [ ] Damage report (to admin/maintenance team)
- [ ] In-app notifications
  - [ ] Dashboard widget: "My Checkouts" (show current + upcoming returns)
  - [ ] Badge count on navigation (e.g., "Equipment (3)" for 3 checked-out items)
- [ ] Automated reminder schedule (cron job or Next.js scheduled API)
  - [ ] Check equipment_checkouts WHERE expected_return_date BETWEEN now AND now+24hrs
  - [ ] Send reminder emails
  - [ ] Update checkout.status = 'overdue' if past due date
- [ ] SMS notifications (optional - Twilio integration)
  - [ ] Admin setting: Enable SMS notifications
  - [ ] Send to people.mobile if populated
  - [ ] Use case: Overdue equipment (more urgent than email)
- [ ] Slack integration (optional)
  - [ ] Post to #equipment channel when equipment overdue
  - [ ] Mention @admin when damage reported

**Phase 10: Dashboard & Reporting**
- [ ] "My Checkouts" dashboard widget
  - [ ] Show current user's checked-out equipment
  - [ ] Due date with countdown ("Due in 3 days")
  - [ ] "Check In" quick action button
  - [ ] Overdue items highlighted in red
- [ ] "Overdue Equipment" admin widget
  - [ ] List all overdue checkouts
  - [ ] Sort by days overdue (descending)
  - [ ] Contact person button (mailto: link)
  - [ ] "Mark as Returned" admin override
- [ ] Equipment utilization report (/equipment/reports/utilization)
  - [ ] Chart: % time each device is checked out (last 30/90/365 days)
  - [ ] Table: Device, total checkouts, total days out, utilization %
  - [ ] Filter by device_type, location, date range
- [ ] Most popular equipment report
  - [ ] Rank devices by checkout frequency
  - [ ] Identify high-demand equipment (consider purchasing more)
- [ ] User checkout history (/equipment/reports/user-history)
  - [ ] Audit trail per person
  - [ ] Table: Device, checkout date, return date, late fees, condition
  - [ ] Filter by person, date range
- [ ] Equipment checkout history (/equipment/reports/equipment-history)
  - [ ] Audit trail per device
  - [ ] Show all checkouts with person, dates, condition
  - [ ] Track condition degradation over time

**Phase 11: Admin Configuration**
- [ ] Checkout policies (/admin/equipment/policies)
  - [ ] Max checkout duration per device_type (e.g., 7 days for cameras)
  - [ ] Max items per user (e.g., 5 devices at once)
  - [ ] Approval required for certain devices (e.g., high-value items)
  - [ ] Late fee rates per device_type
  - [ ] Auto-extend checkout if not overdue (optional)
- [ ] Agreement templates (/admin/equipment/agreements)
  - [ ] List all templates
  - [ ] Create/edit template (rich text editor)
  - [ ] Placeholders: {{person_name}}, {{device_name}}, {{return_date}}, etc.
  - [ ] Mark as default (used if no specific template selected)
  - [ ] Preview with sample data
- [ ] Late fee configuration
  - [ ] Per device_type: Daily rate (numeric input)
  - [ ] Grace period (e.g., 1 day grace before fees start)
  - [ ] Max late fee cap (optional)
- [ ] Approval workflow settings
  - [ ] Enable/disable approval requirement
  - [ ] Approvers: Select people with permission
  - [ ] Auto-approve for certain users/groups (e.g., staff)
  - [ ] Notification email on new reservation request
- [ ] Notification settings
  - [ ] Email templates (checkout confirmation, return reminder, overdue)
  - [ ] Reminder schedule (24hrs, 1hr, etc.)
  - [ ] Enable/disable SMS, Slack
- [ ] Barcode format preferences
  - [ ] Default format: QR Code, Code 39, Code 128
  - [ ] Label size: 4×6 inch, 2×3 inch
  - [ ] Include logo on labels (optional)

**Integration with Existing Features**:
- [ ] Devices table: Add checkout_status computed field (uses helper function)
- [ ] People table: Link checkouts via checked_out_by and reserved_by
- [ ] RBAC: Create "Equipment Manager" role
  - [ ] Permissions: Approve reservations, override checkout limits, view all checkouts, generate reports
- [ ] File Attachments: Store agreement PDFs, damage photos, QR code images
- [ ] Notifications: Use existing notification infrastructure (already planned in Phase 2)

**Key Technical Decisions**:
- [ ] Barcode Library: html5-qrcode (MIT license, 13k+ stars, active development, supports all major formats)
- [ ] QR Generation: qrcode npm package (simple, reliable, 7k+ stars)
- [ ] Signature Capture: react-signature-canvas (canvas-based, touch-optimized, 600+ stars)
- [ ] PDF Generation: Use existing file attachment system + jsPDF for agreement PDFs
- [ ] Offline Support: Service workers + IndexedDB (already planned in Phase 2.9)

**Success Metrics**:
- [ ] Adoption: % of devices with QR codes generated (target: 90%+)
- [ ] Usage: # of checkouts per month (track growth)
- [ ] Efficiency: Average checkout time (target: <2 minutes)
- [ ] Accountability: % of checkouts with signed agreements (target: 100%)
- [ ] Mobile: % of checkouts via mobile device (indicates mobile UX success)
- [ ] On-time returns: % of equipment returned by due date (target: 95%+)
- [ ] Damage tracking: # of damage reports (helps identify problem equipment)

### Phase 3: Automation & Integration

#### 3.1 SAML 2.0 Authentication with SCIM Provisioning
- [ ] Research and choose SAML library (Passport-SAML, node-saml, or saml2-js)
- [ ] Create SAML 2.0 service provider configuration
  - [ ] Generate service provider metadata (entity ID, ACS URL, certificate)
  - [ ] Implement /saml/login endpoint (initiate SSO)
  - [ ] Implement /saml/acs endpoint (assertion consumer service)
  - [ ] Implement /saml/metadata endpoint (SP metadata XML)
  - [ ] Configure session management with SAML attributes
  - [ ] Map SAML attributes to user fields (email, full_name, roles)
- [ ] Implement SCIM 2.0 endpoints for user provisioning
  - [ ] Create /scim/v2/Users endpoint (GET, POST, PUT, PATCH, DELETE)
  - [ ] Create /scim/v2/Groups endpoint (GET, POST, PUT, PATCH, DELETE)
  - [ ] Implement SCIM schema responses (Core User, Enterprise User)
  - [ ] Add bearer token authentication for SCIM endpoints
  - [ ] Implement user lifecycle management (create, update, deactivate)
  - [ ] Implement group membership sync from identity provider
  - [ ] Add SCIM provisioning audit logs
- [ ] Test integration with Okta
  - [ ] Configure Okta SAML application
  - [ ] Enable SCIM provisioning in Okta
  - [ ] Test user creation/update/deactivation flow
  - [ ] Test group membership synchronization
  - [ ] Verify role mapping from IdP to M.O.S.S. roles
- [ ] Test integration with Microsoft Entra ID (Azure AD)
  - [ ] Configure enterprise application in Entra ID
  - [ ] Enable automatic provisioning with SCIM
  - [ ] Test user and group sync
- [ ] Create admin UI for SAML/SCIM configuration
  - [ ] IdP metadata upload interface
  - [ ] Attribute mapping configuration
  - [ ] Role mapping rules (IdP groups → M.O.S.S. roles)
  - [ ] SCIM token generation and management

#### 3.2 OpenAPI Specification for ChatGPT Integration
- [ ] Generate OpenAPI 3.1 specification for all API endpoints
  - [ ] Document all REST endpoints with request/response schemas
  - [ ] Add authentication schemes (OAuth2, Bearer token)
  - [ ] Define data models for all core objects (devices, people, networks, etc.)
  - [ ] Add operation descriptions and examples
  - [ ] Include error response schemas
  - [ ] Add tags for endpoint categorization
- [ ] Create OpenAPI metadata file (openapi.json/yaml)
  - [ ] Configure server URLs for production/staging
  - [ ] Add API versioning information
  - [ ] Include contact and license information
- [ ] Implement ChatGPT Action integration
  - [ ] Create actions.json manifest for ChatGPT
  - [ ] Define action metadata (name, description, capabilities)
  - [ ] Configure OAuth2 flow for ChatGPT authentication
  - [ ] Test ChatGPT queries against M.O.S.S. API
  - [ ] Optimize responses for natural language context
- [ ] Add API documentation UI
  - [ ] Integrate Swagger UI or Scalar for interactive docs
  - [ ] Add "Try It Out" functionality for testing endpoints
  - [ ] Create endpoint at /api/docs for documentation access
- [ ] Implement rate limiting and usage tracking for LLM access
  - [ ] Add API key management for ChatGPT integrations
  - [ ] Track API usage by consumer
  - [ ] Implement throttling for high-volume queries

#### 3.3 MCP (Model Context Protocol) Server with OAuth2 ✅ **COMPLETE** (2025-10-13)
- [x] Research MCP specification (March 2025 / June 2025 updates)
  - [x] Review OAuth 2.1 requirements for MCP
  - [x] Understand Streamable HTTP transport implementation (SSE is deprecated)
  - [x] Study resource server metadata discovery (RFC 9728)
- [x] Implement MCP Streamable HTTP server
  - [x] Create HTTP endpoints for client requests (POST /api/mcp)
  - [x] Implement Streamable HTTP transport (SSE deprecated as of 2025)
  - [x] Add support for streaming responses to LLM clients
  - [x] Implement MCP protocol message handling (initialize, tools, resources, prompts)
- [x] Implement OAuth 2.1 authorization for MCP
  - [x] Configure OAuth 2.1 authorization server (src/app/api/oauth/)
  - [x] Implement PKCE (Proof Key for Code Exchange) - S256 mandatory
  - [x] Create /.well-known/oauth-protected-resource metadata endpoint (RFC 9728)
  - [x] Implement token validation for MCP requests (src/lib/mcp/auth.ts)
  - [x] Implement Authorization Server Metadata (RFC 8414) at /.well-known/oauth-authorization-server
  - [x] Add token revocation endpoint (POST /api/oauth/revoke)
- [x] Define MCP tools for M.O.S.S. operations (8 tools implemented)
  - [x] search_devices tool (search inventory with filters)
  - [x] get_device_details tool (retrieve full device information with interfaces)
  - [x] search_people tool (find users by name, email, type, status)
  - [x] get_network_topology tool (retrieve IO connectivity chains)
  - [x] search_licenses tool (license queries with expiration filters)
  - [x] get_warranty_status tool (warranty expiration lookups)
  - [x] create_device tool (add new devices via LLM - requires mcp:write scope)
  - [ ] update_device tool (deferred - future enhancement)
- [x] Define MCP resources for context provision (5 resources)
  - [x] Device schemas (resource://moss/schemas/device)
  - [x] Person schemas (resource://moss/schemas/person)
  - [x] Network schemas (resource://moss/schemas/network)
  - [x] Network topology resource (resource://moss/network/topology)
- [x] Implement MCP prompts for common workflows (2 prompts)
  - [x] Network troubleshooting prompt (guided diagnostic workflow)
  - [x] License audit prompt (compliance review workflow)
  - [ ] Asset inventory prompt (deferred - future enhancement)
  - [ ] Warranty review prompt (deferred - future enhancement)
- [x] Test MCP admin UI with Playwright ✅ **COMPLETE** (2025-10-13)
  - [x] Navigate to /admin/mcp page - ✅ PASSED
  - [x] Verify empty state displays correctly - ✅ PASSED
  - [x] Create OAuth client with all scopes (mcp:read, mcp:tools, mcp:resources, mcp:prompts, mcp:write) - ✅ PASSED
  - [x] Verify client secret is displayed (kP6FnxiaTsTuoF3TN-qYtIvE6l4BoSqndMOULLJ473B3N9HI) - ✅ PASSED
  - [x] Verify client appears in table with correct details - ✅ PASSED
  - [x] Test OAuth discovery endpoints (RFC 8414 and RFC 9728) - ✅ PASSED
- [ ] Test MCP integration with Claude Desktop (requires manual setup)
  - [ ] Configure MCP server in Claude Desktop settings (docs/mcp-setup-guide.md)
  - [ ] Test OAuth2 authorization flow with real client
  - [ ] Verify tool calling functionality (8 tools)
  - [ ] Test resource access (5 resources)
  - [ ] Test prompt workflows (2 prompts)
- [ ] Deploy MCP server to production (deferred)
  - [ ] Set NEXTAUTH_SECRET environment variable
  - [ ] Set NEXT_PUBLIC_APP_URL to production URL
  - [ ] Enable HTTPS (required for OAuth2)
  - [ ] Configure CORS if needed
- [x] Create admin UI for MCP configuration ✅ **COMPLETE**
  - [x] OAuth client registration interface (/admin/mcp)
  - [x] Client creation with scope selection (5 scopes: read, tools, resources, prompts, write)
  - [x] Client secret display (one-time only with copy button)
  - [x] Client list with status badges and delete functionality
  - [x] API routes for client management (GET/POST/PATCH/DELETE)
  - [ ] Tool permission management UI (deferred - currently managed via scopes)
  - [ ] Resource access control UI (deferred - currently managed via scopes)
  - [ ] Usage analytics and monitoring dashboard (deferred - audit logs exist in database)

**Test Results Summary** (2025-10-13):
✅ All UI components working correctly
✅ OAuth client creation successful
✅ Client secret generation and display working
✅ RFC 8414 OAuth Authorization Server Metadata endpoint operational
✅ RFC 9728 OAuth Protected Resource Metadata endpoint operational
✅ All API routes functional (no compilation errors)
✅ Database migrations applied successfully (020_oauth_tables, 021_mcp_audit_log)

**Documentation**:
- Setup guide: docs/mcp-setup-guide.md (200+ lines)
- Implementation summary: MCP-IMPLEMENTATION-SUMMARY.md (276 lines)
- CORS configuration: docs/cors-configuration.md (complete guide)
- 55 files created/modified (dependencies, migrations, OAuth layer, MCP core, tools, resources, prompts, admin UI, CORS)

**CORS Implementation** ✅ (2025-10-13):
- [x] Created CORS utility function (src/lib/cors.ts)
- [x] Applied CORS to OAuth token endpoint
- [x] Applied CORS to OAuth authorize endpoint
- [x] Applied CORS to OAuth revoke endpoint
- [x] Applied CORS to MCP endpoint
- [x] Applied CORS to discovery endpoints (RFC 8414 & RFC 9728)
- [x] Tested CORS with curl (all tests passed)
- [x] Documented CORS configuration
- **Features**:
  - Automatic preflight (OPTIONS) handling on all endpoints
  - Origin reflection for secure cross-origin requests
  - Credentials support for OAuth cookies/tokens
  - Configurable allowed origins (development: `*`, production: env var)
  - 24-hour preflight cache for performance
- **Test Results**:
  - ✅ OPTIONS requests return 204 with proper CORS headers
  - ✅ GET/POST requests include CORS headers
  - ✅ Origin validation working correctly
  - ✅ Credentials support enabled

**Next Steps**: Manual testing with Claude Desktop using generated OAuth credentials

#### 3.4 External System Integrations
- [ ] Active Directory sync
- [ ] MDM integration (Jamf/Intune)
- [ ] Cloud provider APIs
- [ ] Network device polling
- [ ] Automated alerts & notifications
- [ ] Webhook support
- [ ] Auto-discovery
- [ ] Scheduled jobs & maintenance