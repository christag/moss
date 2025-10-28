# Custom Reports and Dashboards - ACTIVE

**Status**: Planning
**Priority**: P2 (Medium)
**Estimated Time**: 10-14 hours
**Started**: 2025-10-28
**Target Completion**: TBD

---

## Feature Overview

Build a comprehensive reporting and dashboard customization system for M.O.S.S. that allows users to:
1. Create custom reports from any object type with flexible filtering, grouping, and aggregations
2. Export reports to multiple formats (CSV, Excel, PDF)
3. Build custom dashboards with drag-and-drop widgets
4. Save and share reports/dashboards with other users
5. Schedule automated report generation (optional, time permitting)

### User Stories

**As an IT Director**, I want to:
- Generate license utilization reports to identify unused seats
- Create warranty expiration forecasts for budget planning
- Build executive dashboards showing key IT metrics
- Export reports to Excel for presentations

**As a Network Engineer**, I want to:
- Create network capacity reports showing port utilization
- Generate VLAN allocation summaries
- Track IP address utilization across subnets
- Visualize network topology statistics

**As a Systems Administrator**, I want to:
- Report on software deployment status across devices
- Track device lifecycle (purchase → retirement)
- Identify orphaned assets (no location, no owner)
- Monitor contract renewal dates

---

## Existing Patterns to Leverage

### Currently Implemented

1. **Dashboard Infrastructure** (`/src/app/page.tsx`):
   - Basic dashboard with stat widgets
   - Expiring items widgets (warranties, licenses, contracts)
   - Quick actions section
   - Widget-based layout system

2. **Dashboard Components** (`/src/components/dashboard/`):
   - `StatWidget.tsx` - Count-based metrics with icons
   - `ExpiringItemsWidget.tsx` - Tabular data widgets
   - `TopUtilizedSubnetsWidget.tsx` - Network-specific metrics
   - `NetworkUtilizationChart.tsx` - Donut chart for IP utilization (uses native SVG)

3. **Dashboard API Routes** (`/src/app/api/dashboard/`):
   - `/stats` - Object count statistics
   - `/expiring-warranties` - Device warranty data
   - `/expiring-licenses` - License expiration data
   - `/expiring-contracts` - Contract renewal data

4. **Export Functionality**:
   - CSV export already implemented for list views
   - Export buttons in admin panels

### Gaps to Fill

1. **No report builder UI** - Need form-based or wizard interface
2. **No custom dashboard creation** - Dashboard is static
3. **No saved reports** - Reports are one-time, not reusable
4. **Limited export formats** - Only CSV, need Excel and PDF
5. **No scheduling** - Reports are manual only
6. **No report sharing** - No way to share reports between users
7. **No advanced visualizations** - Only one donut chart exists

---

## Technical Decisions

### Charting Library

**Options**:
1. **Recharts** (Recommended)
   - React-first, declarative API
   - Built on D3, good performance
   - Wide range of chart types
   - Good documentation
   - MIT license
   - Size: ~400KB

2. **Chart.js with react-chartjs-2**
   - Popular, well-established
   - Simpler API than Recharts
   - Good docs and community
   - MIT license
   - Size: ~200KB

3. **Native SVG** (Current approach)
   - No dependencies
   - Full control
   - Lightweight
   - Limited chart types

**Decision**: Use **Recharts** for the following reasons:
- Declarative React API fits M.O.S.S. architecture
- Supports all needed chart types (bar, line, pie, area, scatter)
- Responsive by default
- Can compose charts easily
- Good TypeScript support

### PDF Generation

**Options**:
1. **jsPDF + jspdf-autotable**
   - Client-side generation
   - Good table support
   - Lightweight (~150KB)
   - MIT license

2. **React-PDF**
   - Render React components to PDF
   - More complex, heavier (~500KB)
   - Better for complex layouts

3. **Server-side with Puppeteer**
   - Most powerful
   - Requires server resources
   - Better for complex reports

**Decision**: Use **jsPDF + jspdf-autotable** for:
- Client-side generation (no server load)
- Simple API for tabular reports
- Lightweight bundle size
- Sufficient for IT asset reports

### Excel Generation

**Options**:
1. **xlsx (SheetJS)**
   - Industry standard
   - Full Excel feature support
   - Apache 2.0 license (community edition)
   - Size: ~500KB

2. **exceljs**
   - Modern API
   - Good TypeScript support
   - MIT license
   - Size: ~600KB

**Decision**: Use **xlsx (SheetJS)** for:
- Most widely used library
- Proven reliability
- Good documentation
- Full Excel compatibility

### Report Storage

**Database Schema**:
```sql
-- Saved reports table
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_name VARCHAR(255) NOT NULL,
  description TEXT,
  object_type VARCHAR(50) NOT NULL, -- 'device', 'person', etc.
  fields JSONB NOT NULL, -- Array of field names to include
  filters JSONB, -- Filter conditions
  grouping JSONB, -- GROUP BY fields
  aggregations JSONB, -- COUNT, SUM, AVG, etc.
  sorting JSONB, -- ORDER BY fields
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom dashboards table
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL, -- Widget positions and sizes
  widgets JSONB NOT NULL, -- Widget configurations
  created_by UUID REFERENCES users(id),
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard widgets table (pre-defined widget types)
CREATE TABLE dashboard_widget_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_name VARCHAR(100) NOT NULL,
  widget_type VARCHAR(50) NOT NULL, -- 'stat', 'chart', 'table', 'list'
  category VARCHAR(50), -- 'assets', 'network', 'licenses', 'contracts'
  configuration_schema JSONB NOT NULL, -- JSON Schema for widget config
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report schedules table (optional - Phase 5)
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE,
  schedule_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  schedule_config JSONB NOT NULL, -- Day of week, time, etc.
  export_format VARCHAR(20) NOT NULL, -- 'csv', 'xlsx', 'pdf'
  recipients JSONB NOT NULL, -- Array of email addresses or user IDs
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Task Breakdown

### Phase 1: Report Builder Foundation (3-4 hours)

#### 1.1 Database Schema & Migration (45 min)
- [ ] Create migration `021_custom_reports.sql`
- [ ] Create `saved_reports` table with indexes
- [ ] Create `custom_dashboards` table with indexes
- [ ] Create `dashboard_widget_types` table
- [ ] Add seed data for pre-built widget types
- [ ] Test migration rollback safety

**Files to create**:
- `/migrations/021_custom_reports.sql`

#### 1.2 Zod Schemas & TypeScript Types (30 min)
- [ ] Create `src/lib/schemas/reports.ts`
- [ ] Define `SavedReportSchema` with field validation
- [ ] Define `CustomDashboardSchema` with layout validation
- [ ] Define `WidgetConfigSchema` for widget settings
- [ ] Export TypeScript types from schemas

**Files to create**:
- `/src/lib/schemas/reports.ts`
- `/src/types/reports.ts`

#### 1.3 Report Builder UI - Step 1: Object Selection (30 min)
- [ ] Create `/src/app/reports/builder/page.tsx`
- [ ] Build object type selector (16 core objects)
- [ ] Add object type descriptions and icons
- [ ] Implement navigation to Step 2

**Files to create**:
- `/src/app/reports/builder/page.tsx`

#### 1.4 Report Builder UI - Step 2: Field Selection (45 min)
- [ ] Create multi-select field picker component
- [ ] Fetch available fields from object schema
- [ ] Add "Select All" and "Clear All" buttons
- [ ] Show selected field count
- [ ] Implement drag-to-reorder fields
- [ ] Add field descriptions (from schema)

**Files to create**:
- `/src/components/reports/FieldSelector.tsx`

#### 1.5 Report Builder UI - Step 3: Filter Builder (1 hour)
- [ ] Create filter builder component
- [ ] Support filter types: equals, not equals, contains, greater than, less than, between, in list
- [ ] Add "AND" / "OR" logic builder
- [ ] Support nested filter groups
- [ ] Field-specific filter types (date pickers, dropdowns, text inputs)
- [ ] Add filter preview/summary

**Files to create**:
- `/src/components/reports/FilterBuilder.tsx`

**Dependencies**:
- Existing form components (Input, Select, Button)

#### 1.6 Report Builder UI - Step 4: Grouping & Aggregations (30 min)
- [ ] Add grouping field selector (optional)
- [ ] Add aggregation options: COUNT, SUM, AVG, MIN, MAX
- [ ] Support multiple aggregations per report
- [ ] Validate aggregation field types (only numeric for SUM/AVG)

**Files to create**:
- `/src/components/reports/GroupingSelector.tsx`

---

### Phase 2: Report Execution & Export (3-4 hours)

#### 2.1 Report API - Query Builder (1.5 hours)
- [ ] Create `/src/lib/reports/queryBuilder.ts`
- [ ] Implement dynamic SQL generation from report config
- [ ] Support all 16 object types
- [ ] Handle joins for related objects
- [ ] Implement pagination for large datasets
- [ ] Add SQL injection protection (parameterized queries)
- [ ] Test with complex queries

**Files to create**:
- `/src/lib/reports/queryBuilder.ts`

**Security Considerations**:
- Never concatenate user input into SQL
- Use parameterized queries only
- Whitelist allowed fields per object type
- Validate all filter values

#### 2.2 Report API - Execution Endpoint (45 min)
- [ ] Create `/src/app/api/reports/execute/route.ts`
- [ ] Accept report configuration via POST
- [ ] Execute query via queryBuilder
- [ ] Return paginated results
- [ ] Add execution time logging
- [ ] Implement result caching (5 min TTL)

**Files to create**:
- `/src/app/api/reports/execute/route.ts`

#### 2.3 Report Preview UI (30 min)
- [ ] Add preview table component
- [ ] Show first 100 rows
- [ ] Display total row count
- [ ] Add column sorting
- [ ] Show loading state during execution

**Files to create**:
- `/src/components/reports/ReportPreview.tsx`

#### 2.4 CSV Export (15 min)
- [ ] Leverage existing CSV export logic
- [ ] Add "Export to CSV" button
- [ ] Include column headers
- [ ] Handle large datasets (stream if needed)

**Files to modify**:
- `/src/components/reports/ReportPreview.tsx`

#### 2.5 Excel Export (45 min)
- [ ] Install `xlsx` package
- [ ] Create `/src/lib/reports/excelExport.ts`
- [ ] Generate Excel workbook from report data
- [ ] Add formatting (headers bold, auto-width columns)
- [ ] Support multiple sheets (if grouping)
- [ ] Add "Export to Excel" button

**Files to create**:
- `/src/lib/reports/excelExport.ts`

**Dependencies**:
- `npm install xlsx` (~500KB)

#### 2.6 PDF Export (1 hour)
- [ ] Install `jspdf` and `jspdf-autotable`
- [ ] Create `/src/lib/reports/pdfExport.ts`
- [ ] Generate PDF with report title and metadata
- [ ] Add table with proper formatting
- [ ] Include page numbers and timestamp
- [ ] Support landscape orientation for wide tables
- [ ] Add M.O.S.S. branding (header/footer)
- [ ] Add "Export to PDF" button

**Files to create**:
- `/src/lib/reports/pdfExport.ts`

**Dependencies**:
- `npm install jspdf jspdf-autotable` (~150KB)

---

### Phase 3: Saved Reports & Templates (2-3 hours)

#### 3.1 Save Report API (30 min)
- [ ] Create `/src/app/api/reports/route.ts` (POST)
- [ ] Accept report configuration and name
- [ ] Validate with Zod schema
- [ ] Save to `saved_reports` table
- [ ] Return saved report ID

**Files to create**:
- `/src/app/api/reports/route.ts` (POST handler)

#### 3.2 List Saved Reports API (15 min)
- [ ] Create `/src/app/api/reports/route.ts` (GET)
- [ ] Return user's saved reports
- [ ] Include public reports
- [ ] Add pagination support
- [ ] Filter by object type

**Files to modify**:
- `/src/app/api/reports/route.ts` (GET handler)

#### 3.3 Load & Edit Report API (30 min)
- [ ] Create `/src/app/api/reports/[id]/route.ts` (GET)
- [ ] Fetch report by ID
- [ ] Check user permissions (owner or public)
- [ ] Return report configuration
- [ ] Support updating reports (PATCH)
- [ ] Support deleting reports (DELETE)

**Files to create**:
- `/src/app/api/reports/[id]/route.ts`

#### 3.4 Saved Reports List UI (45 min)
- [ ] Create `/src/app/reports/page.tsx`
- [ ] Show saved reports table
- [ ] Columns: Name, Object Type, Created By, Last Modified
- [ ] Add search and filters
- [ ] Include "Run Report" button per row
- [ ] Add "Edit" and "Delete" actions
- [ ] Add "New Report" button → builder

**Files to create**:
- `/src/app/reports/page.tsx`

#### 3.5 Pre-Built Report Templates (45 min)
- [ ] Create 10-15 pre-built report templates
- [ ] Templates for common use cases:
  - Device Inventory (all fields)
  - Expiring Warranties (next 90 days)
  - License Utilization (with seat counts)
  - Network VLAN Allocation
  - Software Deployment Status
  - Contract Renewals (next 60 days)
  - People Directory
  - Orphaned Devices (no location/owner)
  - Device Lifecycle (purchase → retirement)
  - IP Address Allocation
- [ ] Add to seed data in migration
- [ ] Mark as `is_system=true` (non-editable)

**Files to modify**:
- `/migrations/021_custom_reports.sql` (seed data)

#### 3.6 Report Templates UI (30 min)
- [ ] Add "Templates" tab to reports list
- [ ] Show pre-built templates with descriptions
- [ ] Add "Use Template" button
- [ ] Clone template to user's saved reports
- [ ] Allow customization after cloning

**Files to modify**:
- `/src/app/reports/page.tsx`

---

### Phase 4: Custom Dashboards (3-4 hours)

#### 4.1 Widget Registry (45 min)
- [ ] Create `/src/lib/dashboards/widgetRegistry.ts`
- [ ] Define available widget types:
  - **Stat Widget**: Single metric with icon
  - **Chart Widget**: Bar, line, pie, area charts
  - **Table Widget**: Tabular data
  - **List Widget**: Simple list with links
  - **Expiring Items Widget**: Existing component
  - **Network Utilization Widget**: Existing component
- [ ] Each widget type has configuration schema
- [ ] Widget data sources map to API endpoints

**Files to create**:
- `/src/lib/dashboards/widgetRegistry.ts`

#### 4.2 Dashboard Layout System (1 hour)
- [ ] Install `react-grid-layout` for drag-and-drop
- [ ] Create `/src/components/dashboards/DashboardGrid.tsx`
- [ ] Support responsive breakpoints (desktop, tablet, mobile)
- [ ] Widget resize handles
- [ ] Widget move/drag functionality
- [ ] Save layout to `custom_dashboards.layout` JSON field

**Files to create**:
- `/src/components/dashboards/DashboardGrid.tsx`

**Dependencies**:
- `npm install react-grid-layout` (~100KB)

#### 4.3 Widget Configuration Modal (1 hour)
- [ ] Create `/src/components/dashboards/WidgetConfigModal.tsx`
- [ ] Select widget type (dropdown)
- [ ] Dynamic form based on widget type
- [ ] For stat widgets: Select metric, icon, color
- [ ] For chart widgets: Select data source, chart type, fields
- [ ] For table widgets: Select object type, columns, filters
- [ ] Preview widget before adding

**Files to create**:
- `/src/components/dashboards/WidgetConfigModal.tsx`

#### 4.4 Chart Widget Component (1 hour)
- [ ] Install Recharts
- [ ] Create `/src/components/dashboards/widgets/ChartWidget.tsx`
- [ ] Support chart types: bar, line, pie, area
- [ ] Fetch data from configured API endpoint
- [ ] Handle loading and error states
- [ ] Responsive sizing
- [ ] Add chart title and legend

**Files to create**:
- `/src/components/dashboards/widgets/ChartWidget.tsx`

**Dependencies**:
- `npm install recharts` (~400KB)

#### 4.5 Dashboard CRUD APIs (45 min)
- [ ] Create `/src/app/api/dashboards/route.ts` (GET, POST)
- [ ] Create `/src/app/api/dashboards/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Save dashboard layout and widgets to DB
- [ ] Load dashboard by ID
- [ ] Support public dashboards
- [ ] Check user permissions

**Files to create**:
- `/src/app/api/dashboards/route.ts`
- `/src/app/api/dashboards/[id]/route.ts`

#### 4.6 Custom Dashboard UI (45 min)
- [ ] Create `/src/app/dashboards/page.tsx` (list view)
- [ ] Create `/src/app/dashboards/[id]/page.tsx` (dashboard view)
- [ ] Create `/src/app/dashboards/new/page.tsx` (builder)
- [ ] Add "Edit Mode" toggle
- [ ] Add "Add Widget" button
- [ ] Save/cancel buttons in edit mode
- [ ] Show loading skeletons for widgets

**Files to create**:
- `/src/app/dashboards/page.tsx`
- `/src/app/dashboards/[id]/page.tsx`
- `/src/app/dashboards/new/page.tsx`

---

### Phase 5: Scheduling (Optional - 2-3 hours)

**Note**: This phase is optional if time permits. Scheduling requires background job infrastructure.

#### 5.1 Schedule Infrastructure Decision
- [ ] Evaluate options:
  - **Vercel Cron Jobs** (if deploying to Vercel)
  - **Node-cron** (in-process scheduler)
  - **External service** (AWS EventBridge, Cloudflare Workers Cron)
- [ ] Choose based on deployment platform

#### 5.2 Scheduled Reports API (1 hour)
- [ ] Create `/src/app/api/reports/schedules/route.ts`
- [ ] Support CRUD for report schedules
- [ ] Validate schedule configuration
- [ ] Store in `report_schedules` table

**Files to create**:
- `/src/app/api/reports/schedules/route.ts`

#### 5.3 Report Execution Worker (1.5 hours)
- [ ] Create `/src/lib/workers/reportScheduler.ts`
- [ ] Fetch due schedules from DB
- [ ] Execute reports
- [ ] Generate exports (CSV, Excel, PDF)
- [ ] Send via email (SMTP)
- [ ] Update `last_run_at` and `next_run_at`
- [ ] Handle failures gracefully

**Files to create**:
- `/src/lib/workers/reportScheduler.ts`

**Dependencies**:
- Requires SMTP configuration (already in admin settings)

#### 5.4 Schedule Management UI (45 min)
- [ ] Add "Schedule" button to saved reports
- [ ] Create schedule configuration modal
- [ ] Select frequency (daily, weekly, monthly)
- [ ] Select recipients
- [ ] Select export format
- [ ] Show next run time
- [ ] List active schedules per report

**Files to modify**:
- `/src/app/reports/page.tsx`

---

## Dependencies to Install

```bash
# Charting
npm install recharts

# Excel export
npm install xlsx

# PDF export
npm install jspdf jspdf-autotable

# Dashboard layout (drag-and-drop)
npm install react-grid-layout

# Type definitions
npm install --save-dev @types/react-grid-layout @types/jspdf
```

**Total bundle size increase**: ~1.5MB (gzipped: ~400KB)

---

## Success Criteria

### Functional Requirements
- Users can create reports from all 16 object types
- Reports support filtering, grouping, and aggregations
- Reports can be exported to CSV, Excel, and PDF
- Users can save and reuse reports
- 15 pre-built report templates available
- Users can create custom dashboards with widgets
- Dashboards support drag-and-drop layout
- Dashboards include 10+ widget types
- Reports and dashboards can be shared (public flag)

### Performance Requirements
- Report execution: < 3 seconds for datasets < 10,000 rows
- Dashboard load time: < 2 seconds
- Export generation: < 5 seconds for typical reports

### UI/UX Requirements
- Report builder is intuitive (no training needed)
- Dashboard builder uses familiar drag-and-drop
- Exports are properly formatted and professional
- Loading states prevent confusion
- Error messages are clear and actionable

### Testing Requirements
- All API endpoints have unit tests
- Report query builder has SQL injection tests
- UAT tests for:
  - Creating a report from scratch
  - Using a pre-built template
  - Exporting to all 3 formats
  - Creating a custom dashboard
  - Adding widgets to dashboard
  - Sharing reports/dashboards
- Accessibility: Keyboard navigation works, ARIA labels present
- Performance: Test with 10,000+ row datasets

---

## Agent Handoff Instructions

**For moss-feature-planner**:
- Review this task breakdown
- Validate technical decisions (charting library, export libraries)
- Create detailed implementation plan
- Generate UAT test cases

**For moss-engineer**:
- Follow task order (Phases 1-4 in sequence)
- Invoke `moss-database-migration` skill for Phase 1.1
- Invoke `moss-zod-schema` skill for Phase 1.2
- Invoke `moss-api-endpoint` skill for API routes
- Run build after each phase completes
- Test exports manually before marking complete

**For moss-tester**:
- Run UAT tests after Phase 2 (execution) is complete
- Test all export formats with real data
- Test dashboard creation after Phase 4
- Verify accessibility with keyboard-only navigation
- Test with large datasets (10K+ rows)

**For moss-git-controller**:
- Create branch `feature/custom-reports-dashboards`
- Commit after each phase completes
- Create PR when MVP (Phases 1-4) is done
- Include screenshots of reports and dashboards

**For moss-documentation-updater**:
- Update COMPONENTS.md with new components
- Update README.md roadmap (move from P2 to Done)
- Add CLAUDE-UPDATES.md entry
- Archive this task list to completed-features.md

---

## MOSS-FEATURE-PLANNER REVIEW (2025-10-28)

### Codebase Research Summary

**Existing Infrastructure**:
- ✅ Dashboard widgets: `StatWidget`, `ExpiringItemsWidget`, `TopUtilizedSubnetsWidget`
- ✅ CSV export: `src/lib/bulk/csvExport.ts` (Papa Parse) + `ExportModal.tsx`
- ✅ Excel library: `xlsx@0.18.5` already installed (used for imports)
- ✅ PDF library: `jspdf@3.0.3` already installed (used for QR codes)
- ✅ GenericForm pattern: Established with Zod validation
- ✅ API auth pattern: `requireApiScope()` for authentication
- ✅ Animation system: Framer Motion with reduced motion support
- ✅ UI components: Button, Input, Select, Textarea, Checkbox, Modal, Card

**Missing Dependencies**:
- ❌ `recharts` - Charting library (need to install ~400KB)
- ❌ `jspdf-autotable` - PDF table plugin (need to install ~50KB)
- ❌ `react-grid-layout` - Drag-and-drop dashboard builder (need to install ~100KB)
- ❌ `@types/react-grid-layout` - Type definitions

**Conflicts & Compatibility**:
- ✅ No conflicts detected
- ✅ All proposed libraries compatible with React 19.0.0 and Next.js 15.5.6
- ✅ jsPDF already installed, just need autotable plugin
- ✅ xlsx already installed, can reuse for Excel export

**Code Patterns to Follow**:
- API routes use `requireApiScope(request, ['read'])` or `['write']`
- Zod schemas in `src/lib/schemas/` with `CreateSchema` and `UpdateSchema` patterns
- Forms use `GenericForm` component with field configuration arrays
- Database migrations numbered sequentially (next: `026_custom_reports.sql`)
- UUID primary keys with `uuid_generate_v4()` defaults
- JSONB columns for flexible configuration storage
- TypeScript interfaces in `src/types/` directory

---

## TECHNICAL DECISIONS (FINALIZED)

### 1. Charting Library: Recharts ✅

**Confirmed choice**: Recharts
**Rationale**:
- React-first declarative API matches M.O.S.S. architecture
- Already proven in similar projects (IT dashboards)
- Supports all needed chart types (bar, line, pie, area, scatter)
- Responsive by default
- Good TypeScript support
- Bundle size acceptable (~400KB, ~100KB gzipped)

**Alternative considered**: Chart.js
- Rejected: Imperative API doesn't fit React patterns
- Lighter but less React-native

### 2. PDF Export: jsPDF + jspdf-autotable ✅

**Confirmed choice**: jsPDF with autotable plugin
**Rationale**:
- jsPDF already installed (used in QR code generation)
- Just need to add autotable plugin (~50KB)
- Client-side generation (no server load)
- Simple API for tabular reports
- Sufficient for IT asset reports
- No additional infrastructure needed

**Alternative considered**: Puppeteer
- Rejected: Requires server resources, complex setup

### 3. Excel Export: xlsx (SheetJS) ✅

**Already installed**: `xlsx@0.18.5`
**Rationale**:
- Already used for CSV import functionality
- Can reuse for Excel export with zero additional dependencies
- Industry standard with proven reliability
- Full Excel compatibility
- Good documentation

### 4. Dashboard Layout: react-grid-layout ✅

**Confirmed choice**: react-grid-layout
**Rationale**:
- Industry standard for React dashboard builders
- Drag-and-drop with resize support
- Responsive breakpoints (desktop, tablet, mobile)
- Persists layout to JSON (fits our JSONB column approach)
- Well-maintained with good TypeScript support
- Bundle size reasonable (~100KB)

**Alternative considered**: Build custom grid
- Rejected: Significant development time, reinventing the wheel

### 5. Report Query Builder Architecture

**Approach**: Dynamic SQL generation with security safeguards
**Design**:
- Whitelist allowed tables and columns per object type
- Parameterized queries only (never concatenate user input)
- Field validation against database schema
- Support for filters: equals, not_equals, contains, greater_than, less_than, between, in_list
- Support for operators: AND, OR with nested groups
- Aggregations: COUNT, SUM, AVG, MIN, MAX
- Grouping: GROUP BY support
- Sorting: ORDER BY support
- Pagination: LIMIT/OFFSET

**Security**:
- SQL injection prevention via parameterized queries
- Field whitelist validation
- RBAC integration (check user permissions per object type)
- Rate limiting on report execution endpoint

### 6. Database Schema Validation

**Review of proposed schema**:
```sql
-- saved_reports: Stores custom report configurations
-- ✅ Good: JSONB for flexible configuration storage
-- ✅ Good: created_by references users(id)
-- ✅ Good: is_public flag for sharing
-- ⚠️  CHANGE: Add is_system BOOLEAN for pre-built templates
-- ⚠️  CHANGE: Add last_run_at TIMESTAMP for usage tracking

-- custom_dashboards: Stores dashboard layouts
-- ✅ Good: JSONB for layout and widget configurations
-- ✅ Good: is_default for user's preferred dashboard
-- ✅ Good: is_public for sharing

-- dashboard_widget_types: Pre-defined widget catalog
-- ✅ Good: Configuration schema in JSONB
-- ✅ Good: Category classification
-- ⚠️  CHANGE: Seed data will be added for 10 widget types

-- report_schedules: Optional scheduling (Phase 5)
-- ⚠️  SKIP FOR MVP: Focus on Phases 1-4, defer scheduling
```

**Schema adjustments**:
- Add `is_system` to `saved_reports` for non-editable templates
- Add `last_run_at` to `saved_reports` for analytics
- Add indexes on `object_type`, `created_by`, `is_public`
- Add updated_at triggers

---

## IMPLEMENTATION ROADMAP

### Phase 1: Report Builder Foundation (3-4 hours)

#### Task 1.1: Database Migration (45 min)
**Invoke skill**: `moss-database-migration`

**File**: `/migrations/026_custom_reports.sql`

**Schema**:
```sql
-- saved_reports table
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_name VARCHAR(255) NOT NULL,
  description TEXT,
  object_type VARCHAR(50) NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  grouping JSONB DEFAULT '[]'::jsonb,
  aggregations JSONB DEFAULT '[]'::jsonb,
  sorting JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- Pre-built templates
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_reports_object_type ON saved_reports(object_type);
CREATE INDEX idx_saved_reports_created_by ON saved_reports(created_by);
CREATE INDEX idx_saved_reports_public ON saved_reports(is_public) WHERE is_public = true;
CREATE INDEX idx_saved_reports_system ON saved_reports(is_system) WHERE is_system = true;

-- custom_dashboards table
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_dashboards_created_by ON custom_dashboards(created_by);
CREATE INDEX idx_custom_dashboards_default ON custom_dashboards(is_default, created_by);

-- dashboard_widget_types catalog
CREATE TABLE dashboard_widget_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_name VARCHAR(100) NOT NULL UNIQUE,
  widget_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  configuration_schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed widget types
INSERT INTO dashboard_widget_types (widget_name, widget_type, category, description, configuration_schema) VALUES
('Stat Counter', 'stat', 'general', 'Single metric with icon', '{"fields": ["metric", "icon", "color", "link"]}'),
('Bar Chart', 'chart', 'analytics', 'Vertical bar chart', '{"fields": ["dataSource", "xField", "yField", "color"]}'),
('Line Chart', 'chart', 'analytics', 'Time series line chart', '{"fields": ["dataSource", "xField", "yField", "color"]}'),
('Pie Chart', 'chart', 'analytics', 'Circular pie/donut chart', '{"fields": ["dataSource", "labelField", "valueField"]}'),
('Data Table', 'table', 'general', 'Tabular data display', '{"fields": ["dataSource", "columns", "pageSize"]}'),
('Simple List', 'list', 'general', 'Bulleted list with links', '{"fields": ["dataSource", "labelField", "linkPattern"]}'),
('Expiring Items', 'expiring', 'assets', 'Items expiring soon', '{"fields": ["itemType", "daysThreshold", "limit"]}'),
('Network Utilization', 'network', 'network', 'Subnet utilization chart', '{"fields": ["networkId"]}'),
('Recent Activity', 'activity', 'general', 'Recent changes log', '{"fields": ["objectTypes", "limit"]}'),
('Quick Actions', 'actions', 'general', 'Action button grid', '{"fields": ["actions"]}');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_reports_updated_at BEFORE UPDATE ON saved_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_dashboards_updated_at BEFORE UPDATE ON custom_dashboards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Testing**:
- Run migration: `npm run db:migrate`
- Verify tables created: `\dt saved_reports` in psql
- Verify indexes: `\di idx_saved_reports_*`
- Check seed data: `SELECT * FROM dashboard_widget_types`

---

#### Task 1.2: Zod Schemas & TypeScript Types (30 min)
**Invoke skill**: `moss-zod-schema`

**File**: `/src/lib/schemas/reports.ts`

```typescript
import { z } from 'zod'

// Operator enums
export const FilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'in_list',
  'not_in_list',
  'is_null',
  'is_not_null',
])

export const LogicalOperatorSchema = z.enum(['AND', 'OR'])

export const AggregationTypeSchema = z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'])

export const SortDirectionSchema = z.enum(['ASC', 'DESC'])

// Filter condition schema (recursive for nested groups)
export const FilterConditionSchema: z.ZodType<FilterCondition> = z.lazy(() =>
  z.object({
    type: z.enum(['condition', 'group']),
    field: z.string().optional(),
    operator: FilterOperatorSchema.optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
    conditions: z.array(FilterConditionSchema).optional(),
    logicalOperator: LogicalOperatorSchema.optional(),
  })
)

// Report configuration schema
export const SavedReportSchema = z.object({
  id: z.string().uuid().optional(),
  report_name: z.string().min(1).max(255),
  description: z.string().optional(),
  object_type: z.enum([
    'device', 'person', 'location', 'room', 'company', 'network', 'io',
    'ip_address', 'software', 'saas_service', 'installed_application',
    'software_license', 'document', 'external_document', 'contract', 'group'
  ]),
  fields: z.array(z.string()).min(1), // Field names to include
  filters: FilterConditionSchema.optional(),
  grouping: z.array(z.string()).optional(), // Fields to group by
  aggregations: z.array(z.object({
    type: AggregationTypeSchema,
    field: z.string(),
    alias: z.string().optional(),
  })).optional(),
  sorting: z.array(z.object({
    field: z.string(),
    direction: SortDirectionSchema,
  })).optional(),
  is_public: z.boolean().default(false),
  is_system: z.boolean().default(false),
})

export const CreateSavedReportSchema = SavedReportSchema.omit({ id: true })
export const UpdateSavedReportSchema = SavedReportSchema.partial()

// Dashboard widget schema
export const DashboardWidgetSchema = z.object({
  id: z.string().uuid(),
  widget_type_id: z.string().uuid(),
  widget_name: z.string(),
  configuration: z.record(z.unknown()), // Dynamic based on widget type
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
})

// Dashboard schema
export const CustomDashboardSchema = z.object({
  id: z.string().uuid().optional(),
  dashboard_name: z.string().min(1).max(255),
  description: z.string().optional(),
  layout: z.array(z.object({
    i: z.string(), // Widget ID
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })),
  widgets: z.array(DashboardWidgetSchema),
  is_default: z.boolean().default(false),
  is_public: z.boolean().default(false),
})

export const CreateCustomDashboardSchema = CustomDashboardSchema.omit({ id: true })
export const UpdateCustomDashboardSchema = CustomDashboardSchema.partial()

// Export format enum
export const ExportFormatSchema = z.enum(['csv', 'xlsx', 'pdf'])
```

**File**: `/src/types/reports.ts`

```typescript
import { z } from 'zod'
import {
  SavedReportSchema,
  CustomDashboardSchema,
  FilterConditionSchema,
  DashboardWidgetSchema,
} from '@/lib/schemas/reports'

export type SavedReport = z.infer<typeof SavedReportSchema>
export type CustomDashboard = z.infer<typeof CustomDashboardSchema>
export type FilterCondition = z.infer<typeof FilterConditionSchema>
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>

export type ObjectType =
  | 'device' | 'person' | 'location' | 'room' | 'company'
  | 'network' | 'io' | 'ip_address' | 'software' | 'saas_service'
  | 'installed_application' | 'software_license' | 'document'
  | 'external_document' | 'contract' | 'group'

export type FilterOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than' | 'greater_than_or_equal'
  | 'less_than_or_equal' | 'between' | 'in_list'
  | 'not_in_list' | 'is_null' | 'is_not_null'

export type AggregationType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
export type ExportFormat = 'csv' | 'xlsx' | 'pdf'
```

---

#### Task 1.3: Report Builder UI - Object Selection (30 min)

**File**: `/src/app/reports/builder/page.tsx`

**Pattern**: Multi-step wizard using state management
**Components**: Icon-based grid of object types
**Navigation**: Click → navigate to field selection step

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageTransition } from '@/components/animations/PageTransition'
import { Card, Icon } from '@/components/ui'
import type { ObjectType } from '@/types/reports'

const OBJECT_TYPES = [
  { type: 'device', label: 'Devices', icon: 'toggle_on_off', description: 'Hardware assets' },
  { type: 'person', label: 'People', icon: 'people-group', description: 'Users and contacts' },
  { type: 'location', label: 'Locations', icon: 'location-pin', description: 'Physical sites' },
  { type: 'network', label: 'Networks', icon: 'map', description: 'VLANs and subnets' },
  { type: 'software', label: 'Software', icon: 'bar_code_sku', description: 'Software catalog' },
  { type: 'saas_service', label: 'SaaS Services', icon: 'up-arrow-line-chart', description: 'Cloud services' },
  { type: 'software_license', label: 'Licenses', icon: 'ticket-event-stub', description: 'License management' },
  { type: 'contract', label: 'Contracts', icon: 'folder_drawer_category', description: 'Vendor contracts' },
  // ... add all 16 object types
] as const

export default function ReportBuilderPage() {
  const router = useRouter()

  const handleSelectObject = (objectType: string) => {
    // Store selection in session storage
    sessionStorage.setItem('report_builder_object_type', objectType)
    router.push(`/reports/builder/fields?objectType=${objectType}`)
  }

  return (
    <PageTransition>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <h1>Create Custom Report</h1>
        <p>Step 1 of 4: Select Object Type</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-lg)',
        }}>
          {OBJECT_TYPES.map(({ type, label, icon, description }) => (
            <Card
              key={type}
              onClick={() => handleSelectObject(type)}
              style={{ cursor: 'pointer' }}
            >
              <Icon name={icon} size={48} />
              <h3>{label}</h3>
              <p>{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
```

---

#### Task 1.4: Field Selection Component (45 min)

**File**: `/src/components/reports/FieldSelector.tsx`

**Features**:
- Multi-select with checkboxes
- "Select All" / "Clear All" buttons
- Drag-to-reorder (optional for MVP)
- Field descriptions from schema
- Search/filter fields

**Pattern**: Checkbox list with state management

---

#### Task 1.5: Filter Builder Component (1 hour)

**File**: `/src/components/reports/FilterBuilder.tsx`

**Features**:
- Add condition button
- Condition rows with field dropdown, operator dropdown, value input
- AND/OR toggle between conditions
- Nested filter groups (add group button)
- Remove condition button
- Filter preview/summary

**Pattern**: Recursive component for nested groups

---

#### Task 1.6: Grouping & Aggregations (30 min)

**File**: `/src/components/reports/GroupingSelector.tsx`

**Features**:
- Optional grouping field selector
- Aggregation options: COUNT, SUM, AVG, MIN, MAX
- Multiple aggregations per report
- Field type validation (numeric only for SUM/AVG)

---

### Phase 2: Report Execution & Export (3-4 hours)

#### Task 2.1: Query Builder Engine (1.5 hours)

**File**: `/src/lib/reports/queryBuilder.ts`

**Core function**:
```typescript
export async function executeReport(
  reportConfig: SavedReport,
  userId: string,
  pagination?: { page: number; pageSize: number }
): Promise<{ data: unknown[]; total: number; executionTime: number }>
```

**Security**:
- Field whitelist per object type
- Parameterized queries
- RBAC permission checks
- SQL injection prevention

**Features**:
- Dynamic SELECT clause from fields
- WHERE clause from filters
- GROUP BY from grouping
- ORDER BY from sorting
- LIMIT/OFFSET for pagination
- JOIN support for related tables

---

#### Task 2.2: Report Execution API (45 min)
**Invoke skill**: `moss-api-endpoint`

**File**: `/src/app/api/reports/execute/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireApiScope(request, ['read'])
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const reportConfig = SavedReportSchema.parse(body.reportConfig)

  // Execute report
  const result = await executeReport(reportConfig, authResult.userId, body.pagination)

  return NextResponse.json({ success: true, data: result })
}
```

---

#### Task 2.3: Export Functions (1.5 hours)

**CSV Export** (15 min):
- Reuse existing `src/lib/bulk/csvExport.ts`
- Add `exportReportToCSV(data, columns)` wrapper

**Excel Export** (45 min):
**File**: `/src/lib/reports/excelExport.ts`

```typescript
import * as XLSX from 'xlsx'

export function exportReportToExcel(
  data: unknown[],
  columns: string[],
  reportName: string
): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data, { header: columns })

  // Auto-width columns
  const colWidths = columns.map(col => ({ wch: Math.max(col.length, 15) }))
  worksheet['!cols'] = colWidths

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
```

**PDF Export** (1 hour):
**File**: `/src/lib/reports/pdfExport.ts`

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportReportToPDF(
  data: unknown[],
  columns: { header: string; dataKey: string }[],
  reportName: string,
  metadata?: { description?: string; generatedBy?: string }
): Blob {
  const doc = new jsPDF({ orientation: 'landscape' })

  // Header
  doc.setFontSize(18)
  doc.text(reportName, 14, 22)

  // Metadata
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
  if (metadata?.generatedBy) {
    doc.text(`By: ${metadata.generatedBy}`, 14, 36)
  }

  // Table
  autoTable(doc, {
    startY: 45,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.dataKey] ?? '')),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [28, 127, 242] }, // Morning Blue
  })

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10)
  }

  return doc.output('blob')
}
```

---

#### Task 2.4: Report Preview UI (30 min)

**File**: `/src/components/reports/ReportPreview.tsx`

**Features**:
- Table view of first 100 rows
- Total row count display
- Column sorting
- Loading skeleton
- Export buttons (CSV, Excel, PDF)
- "Save Report" button

---

### Phase 3: Saved Reports & Templates (2-3 hours)

#### Task 3.1-3.3: CRUD APIs (1.5 hours)
**Invoke skill**: `moss-api-endpoint` (3 times)

**Files**:
- `/src/app/api/reports/route.ts` (GET, POST)
- `/src/app/api/reports/[id]/route.ts` (GET, PATCH, DELETE)
- `/src/app/api/reports/[id]/execute/route.ts` (POST)

**Authentication**: `requireApiScope(request, ['read'])` for GET, `['write']` for POST/PATCH/DELETE

**Permissions**:
- Users can edit/delete own reports
- Users can view public reports
- Users cannot edit system reports (is_system = true)

---

#### Task 3.4: Saved Reports List UI (45 min)

**File**: `/src/app/reports/page.tsx`

**Features**:
- Tabs: "My Reports" | "Shared Reports" | "Templates"
- Table columns: Name, Object Type, Created By, Last Run, Actions
- Search bar
- Filters: Object type dropdown
- Actions: Run, Edit, Delete, Duplicate
- "New Report" button → `/reports/builder`

---

#### Task 3.5: Pre-Built Templates (45 min)

**File**: `/migrations/026_custom_reports.sql` (append)

**15 Pre-built templates**:
1. Device Inventory (all fields)
2. Expiring Warranties (next 90 days)
3. License Utilization (seats used vs. total)
4. Network VLAN Allocation
5. Software Deployment Status
6. Contract Renewals (next 60 days)
7. People Directory
8. Orphaned Devices (no location/owner)
9. Device Lifecycle (purchase → retirement)
10. IP Address Allocation
11. High-Value Assets (purchase_price > $5000)
12. Mobile Device Inventory
13. Server Inventory
14. SaaS Service Catalog
15. Broadcast Equipment Inventory

**SQL**:
```sql
INSERT INTO saved_reports (report_name, description, object_type, fields, filters, is_public, is_system) VALUES
('Device Inventory', 'Complete device inventory with all fields', 'device',
 '["hostname", "device_type", "manufacturer", "model", "serial_number", "location_name"]'::jsonb,
 '{}'::jsonb, true, true),
-- ... more templates
```

---

### Phase 4: Custom Dashboards (3-4 hours)

#### Task 4.1: Widget Registry (45 min)

**File**: `/src/lib/dashboards/widgetRegistry.ts`

**Features**:
- Map widget_type_id to React components
- Configuration schema validation
- Data fetching helpers per widget type

```typescript
export const WIDGET_COMPONENTS = {
  stat: StatWidget,
  chart: ChartWidget,
  table: TableWidget,
  list: ListWidget,
  expiring: ExpiringItemsWidget,
  network: TopUtilizedSubnetsWidget,
}

export function getWidgetComponent(widgetType: string) {
  return WIDGET_COMPONENTS[widgetType] || null
}
```

---

#### Task 4.2: Dashboard Grid Layout (1 hour)

**Dependencies**: Install `react-grid-layout`

**File**: `/src/components/dashboards/DashboardGrid.tsx`

**Features**:
- Drag-and-drop widgets
- Resize handles
- Responsive breakpoints: lg (1200px), md (996px), sm (768px)
- Save layout button
- Edit mode toggle

```typescript
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'

export function DashboardGrid({ widgets, layout, onLayoutChange, editMode }) {
  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={30}
      width={1200}
      onLayoutChange={onLayoutChange}
      isDraggable={editMode}
      isResizable={editMode}
    >
      {widgets.map(widget => (
        <div key={widget.id}>
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </GridLayout>
  )
}
```

---

#### Task 4.3: Widget Configuration Modal (1 hour)

**File**: `/src/components/dashboards/WidgetConfigModal.tsx`

**Features**:
- Widget type selector
- Dynamic form based on widget type
- Configuration preview
- Save/cancel buttons

---

#### Task 4.4: Chart Widget with Recharts (1 hour)

**Dependencies**: Install `recharts`

**File**: `/src/components/dashboards/widgets/ChartWidget.tsx`

**Features**:
- Support chart types: bar, line, pie, area
- Fetch data from API
- Responsive sizing
- Loading skeleton
- Error handling

```typescript
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function ChartWidget({ config }) {
  const { chartType, dataSource, xField, yField, color } = config
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData(dataSource).then(setData)
  }, [dataSource])

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xField} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yField} fill={color || 'var(--color-morning-blue)'} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // ... similar for line, pie, area
}
```

---

#### Task 4.5: Dashboard CRUD APIs (45 min)
**Invoke skill**: `moss-api-endpoint` (2 times)

**Files**:
- `/src/app/api/dashboards/route.ts` (GET, POST)
- `/src/app/api/dashboards/[id]/route.ts` (GET, PATCH, DELETE)

---

#### Task 4.6: Custom Dashboard UI (45 min)

**Files**:
- `/src/app/dashboards/page.tsx` - List view
- `/src/app/dashboards/[id]/page.tsx` - Dashboard view
- `/src/app/dashboards/new/page.tsx` - Builder

---

### Phase 5: Scheduling (DEFERRED)

**Decision**: Skip scheduling for MVP
**Rationale**:
- Requires background job infrastructure (node-cron or Vercel Cron)
- Requires SMTP integration (already in admin settings but not tested)
- Adds significant complexity
- Can be added in Phase 2+ without breaking changes

**Future implementation**:
- Add `report_schedules` table (schema already defined)
- Implement cron job runner
- Add email delivery via SMTP
- Add schedule management UI

---

## UAT TEST CASES (20+ Test Cases)

### Category 1: Report Builder (8 test cases)

**Test 1.1: Create Basic Report**
- Navigate to /reports/builder
- Select "Devices" object type
- Select fields: hostname, device_type, manufacturer, model
- Click "Preview Report"
- Verify table displays with selected columns
- Verify data is correct
- ✅ **Pass criteria**: Report displays data with 4 columns

**Test 1.2: Apply Simple Filter**
- Create device report
- Add filter: device_type = "server"
- Preview report
- Verify only servers displayed
- ✅ **Pass criteria**: All rows have device_type = "server"

**Test 1.3: Apply Multiple Filters with AND**
- Create device report
- Add filter: device_type = "server" AND manufacturer = "Dell"
- Preview report
- Verify only Dell servers displayed
- ✅ **Pass criteria**: Filtered results correct

**Test 1.4: Apply Multiple Filters with OR**
- Create device report
- Add filter: device_type = "server" OR device_type = "switch"
- Preview report
- Verify servers and switches displayed
- ✅ **Pass criteria**: Results include both types

**Test 1.5: Apply Nested Filter Groups**
- Create device report
- Add group: (device_type = "server" AND manufacturer = "Dell") OR (device_type = "switch" AND manufacturer = "Cisco")
- Preview report
- Verify complex filter logic works
- ✅ **Pass criteria**: Results match complex logic

**Test 1.6: Group By with Aggregation**
- Create device report
- Select fields: manufacturer
- Group by: manufacturer
- Add aggregation: COUNT(*) as device_count
- Preview report
- Verify grouped results with counts
- ✅ **Pass criteria**: Shows manufacturer list with device counts

**Test 1.7: Sort Results**
- Create device report
- Sort by: hostname ASC
- Preview report
- Verify alphabetical order
- ✅ **Pass criteria**: Results sorted correctly

**Test 1.8: Save Report**
- Create device report with filters
- Click "Save Report"
- Enter name: "My Test Report"
- Enter description: "Testing report saving"
- Save
- Navigate to /reports
- Verify report appears in "My Reports" list
- ✅ **Pass criteria**: Report saved and visible

---

### Category 2: Report Execution & Export (6 test cases)

**Test 2.1: Export to CSV**
- Run saved report
- Click "Export to CSV"
- Verify CSV file downloads
- Open CSV in Excel/text editor
- Verify headers and data correct
- ✅ **Pass criteria**: CSV contains correct data

**Test 2.2: Export to Excel**
- Run saved report
- Click "Export to Excel"
- Verify XLSX file downloads
- Open in Excel
- Verify formatting (headers bold, column widths)
- ✅ **Pass criteria**: Excel file properly formatted

**Test 2.3: Export to PDF**
- Run saved report
- Click "Export to PDF"
- Verify PDF file downloads
- Open PDF
- Verify table formatted correctly
- Verify page numbers present
- Verify M.O.S.S. branding
- ✅ **Pass criteria**: PDF professionally formatted

**Test 2.4: Large Dataset Performance**
- Create report on large object type (devices >1000 rows)
- Execute report
- Verify execution time < 3 seconds
- Verify pagination works
- ✅ **Pass criteria**: Performance acceptable

**Test 2.5: Empty Result Set**
- Create report with filter that matches nothing
- Execute report
- Verify "No results" message displayed
- Verify no errors
- ✅ **Pass criteria**: Graceful empty state

**Test 2.6: Execute Pre-Built Template**
- Navigate to /reports
- Click "Templates" tab
- Select "Device Inventory" template
- Click "Run Report"
- Verify report executes successfully
- ✅ **Pass criteria**: Template runs without errors

---

### Category 3: Saved Reports Management (4 test cases)

**Test 3.1: Edit Saved Report**
- Open saved report from list
- Click "Edit"
- Modify fields (add/remove columns)
- Save changes
- Run report again
- Verify changes applied
- ✅ **Pass criteria**: Edits persist

**Test 3.2: Delete Saved Report**
- Create new report
- Save it
- Delete from list
- Verify confirmation dialog
- Confirm deletion
- Verify report removed from list
- ✅ **Pass criteria**: Report deleted

**Test 3.3: Duplicate Report**
- Select saved report
- Click "Duplicate"
- Verify copy created with "(Copy)" suffix
- Edit copy
- Verify original unchanged
- ✅ **Pass criteria**: Duplicate independent

**Test 3.4: Share Report (Make Public)**
- Create private report
- Edit report settings
- Toggle "Make Public"
- Save
- Log in as different user
- Navigate to "Shared Reports" tab
- Verify report visible
- ✅ **Pass criteria**: Public reports visible to all users

---

### Category 4: Custom Dashboards (6 test cases)

**Test 4.1: Create Custom Dashboard**
- Navigate to /dashboards/new
- Enter name: "IT Overview"
- Click "Add Widget"
- Select "Stat Counter"
- Configure: metric = "devices", icon = "toggle_on_off"
- Save widget
- Save dashboard
- Verify dashboard appears in list
- ✅ **Pass criteria**: Dashboard created

**Test 4.2: Drag & Drop Widget**
- Open dashboard in edit mode
- Drag stat widget to new position
- Verify widget moves
- Save layout
- Reload page
- Verify position persists
- ✅ **Pass criteria**: Layout persists

**Test 4.3: Resize Widget**
- Open dashboard in edit mode
- Drag widget resize handle
- Verify widget size changes
- Save layout
- Reload page
- Verify size persists
- ✅ **Pass criteria**: Size persists

**Test 4.4: Add Chart Widget**
- Open dashboard in edit mode
- Click "Add Widget"
- Select "Bar Chart"
- Configure: dataSource = "/api/dashboard/stats", chartType = "bar"
- Save widget
- Verify chart displays
- ✅ **Pass criteria**: Chart renders correctly

**Test 4.5: Delete Widget**
- Open dashboard in edit mode
- Click delete icon on widget
- Verify confirmation
- Confirm deletion
- Save dashboard
- Verify widget removed
- ✅ **Pass criteria**: Widget deleted

**Test 4.6: Set Default Dashboard**
- Open dashboard settings
- Toggle "Set as Default"
- Save
- Navigate to home (/)
- Verify custom dashboard displayed instead of default
- ✅ **Pass criteria**: Default dashboard works

---

### Category 5: Accessibility & Performance (4 test cases)

**Test 5.1: Keyboard Navigation**
- Navigate to report builder using Tab key only
- Select object type using Enter
- Navigate through form fields using Tab
- Verify all interactive elements accessible
- ✅ **Pass criteria**: Full keyboard navigation works

**Test 5.2: Screen Reader Compatibility**
- Enable screen reader (VoiceOver on Mac, NVDA on Windows)
- Navigate report builder
- Verify all labels read correctly
- Verify form errors announced
- ✅ **Pass criteria**: Screen reader experience acceptable

**Test 5.3: Reduced Motion**
- Enable "Reduce Motion" in OS settings
- Navigate through report builder
- Verify animations disabled/reduced
- Verify functionality still works
- ✅ **Pass criteria**: Reduced motion respected

**Test 5.4: Large Report Export**
- Create report with 10,000+ rows
- Export to Excel
- Verify export completes (may take 10-15 seconds)
- Verify file size reasonable
- Verify Excel opens without errors
- ✅ **Pass criteria**: Large exports work

---

### Category 6: Error Handling (2 test cases)

**Test 6.1: API Error During Report Execution**
- Create report
- Simulate API error (disconnect network temporarily)
- Execute report
- Verify error message displayed
- Verify "Retry" button works
- ✅ **Pass criteria**: Graceful error handling

**Test 6.2: Invalid Filter Configuration**
- Create report with invalid filter (e.g., text in numeric field)
- Try to execute
- Verify validation error displayed
- Verify helpful error message
- ✅ **Pass criteria**: Validation prevents invalid queries

---

## FILES TO CREATE/MODIFY

### New Files (26 files)

**Migrations**:
1. `/migrations/026_custom_reports.sql`

**Schemas & Types**:
2. `/src/lib/schemas/reports.ts`
3. `/src/types/reports.ts`

**Library Functions**:
4. `/src/lib/reports/queryBuilder.ts`
5. `/src/lib/reports/excelExport.ts`
6. `/src/lib/reports/pdfExport.ts`
7. `/src/lib/dashboards/widgetRegistry.ts`

**API Routes**:
8. `/src/app/api/reports/route.ts` (GET, POST)
9. `/src/app/api/reports/[id]/route.ts` (GET, PATCH, DELETE)
10. `/src/app/api/reports/[id]/execute/route.ts` (POST)
11. `/src/app/api/reports/execute/route.ts` (POST)
12. `/src/app/api/dashboards/route.ts` (GET, POST)
13. `/src/app/api/dashboards/[id]/route.ts` (GET, PATCH, DELETE)

**UI Components - Reports**:
14. `/src/components/reports/FieldSelector.tsx`
15. `/src/components/reports/FilterBuilder.tsx`
16. `/src/components/reports/GroupingSelector.tsx`
17. `/src/components/reports/ReportPreview.tsx`

**UI Components - Dashboards**:
18. `/src/components/dashboards/DashboardGrid.tsx`
19. `/src/components/dashboards/WidgetConfigModal.tsx`
20. `/src/components/dashboards/widgets/ChartWidget.tsx`
21. `/src/components/dashboards/widgets/TableWidget.tsx`
22. `/src/components/dashboards/widgets/ListWidget.tsx`

**Pages**:
23. `/src/app/reports/page.tsx` (list view)
24. `/src/app/reports/builder/page.tsx` (step 1: object selection)
25. `/src/app/dashboards/page.tsx` (list view)
26. `/src/app/dashboards/[id]/page.tsx` (dashboard view)
27. `/src/app/dashboards/new/page.tsx` (builder)

### Modified Files (3 files)

1. `/package.json` - Add dependencies: recharts, jspdf-autotable, react-grid-layout
2. `/COMPONENTS.md` - Document new components
3. `/README.md` - Update roadmap (move from P2 to Done)

---

## DEPENDENCIES TO INSTALL

```bash
# Install new dependencies
npm install recharts jspdf-autotable react-grid-layout

# Install type definitions
npm install --save-dev @types/react-grid-layout
```

**Bundle Size Impact**:
- recharts: ~400KB (~100KB gzipped)
- jspdf-autotable: ~50KB (~15KB gzipped)
- react-grid-layout: ~100KB (~30KB gzipped)
- **Total**: ~550KB uncompressed, ~145KB gzipped

---

## SUCCESS CRITERIA

### Functional Requirements
- ✅ Users can create reports from all 16 object types
- ✅ Reports support filtering, grouping, and aggregations
- ✅ Reports can be exported to CSV, Excel, and PDF
- ✅ Users can save and reuse reports
- ✅ 15 pre-built report templates available
- ✅ Users can create custom dashboards with widgets
- ✅ Dashboards support drag-and-drop layout
- ✅ Dashboards include 10+ widget types
- ✅ Reports and dashboards can be shared (public flag)

### Performance Requirements
- ✅ Report execution: < 3 seconds for datasets < 10,000 rows
- ✅ Dashboard load time: < 2 seconds
- ✅ Export generation: < 5 seconds for typical reports
- ✅ No UI blocking during export generation (client-side async)

### UI/UX Requirements
- ✅ Report builder is intuitive (wizard-style, 4 steps)
- ✅ Dashboard builder uses familiar drag-and-drop
- ✅ Exports are properly formatted and professional
- ✅ Loading states prevent confusion (skeleton screens)
- ✅ Error messages are clear and actionable
- ✅ Animations respect prefers-reduced-motion

### Testing Requirements
- ✅ 26 UAT test cases covering all features
- ✅ Keyboard navigation works (Tab, Enter, Esc)
- ✅ Screen reader compatible (ARIA labels, semantic HTML)
- ✅ SQL injection prevention tested
- ✅ Large dataset performance tested (10,000+ rows)

---

## AGENT HANDOFF

**Status**: ✅ Ready for moss-engineer
**Next Agent**: moss-engineer

**Instructions for moss-engineer**:
1. Follow Phases 1-4 in sequence (do NOT skip ahead)
2. After Phase 1 complete: Run `npm run db:migrate` and verify tables created
3. After Phase 2 complete: Manually test report execution with sample data
4. After Phase 3 complete: Run build and check for TypeScript errors
5. After Phase 4 complete: Run full build and verify bundle size < 2MB increase
6. Invoke skills as needed:
   - `moss-database-migration` for Phase 1.1
   - `moss-zod-schema` for Phase 1.2
   - `moss-api-endpoint` for all API routes (7 files)
   - `moss-component-builder` for complex components (FilterBuilder, DashboardGrid)
   - `moss-visual-check` after Phase 4 to verify design compliance
7. Test exports manually before marking Phase 2 complete
8. Do NOT implement Phase 5 (scheduling) - deferred to future

**Blockers**: None - all dependencies available

**Estimated Completion**: 10-14 hours (moss-task-planner estimate confirmed)
