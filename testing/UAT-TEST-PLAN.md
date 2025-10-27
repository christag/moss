# M.O.S.S. MVP - Comprehensive UAT Test Plan

**Version**: 1.0
**Date**: 2025-10-11
**Status**: Ready for Execution
**Target Environment**: Development (localhost:3001)

---

## Executive Summary

This document outlines the complete User Acceptance Testing (UAT) strategy for the M.O.S.S. (Material Organization & Storage System) MVP. The testing covers all 16 core object types, authentication system, admin panel (4 completed sections), and supporting infrastructure.

**Scope**:
- ✅ **16 Core Objects**: Companies, Locations, Rooms, People, Devices, Groups, Networks, IOs, IP Addresses, Software, SaaS Services, Installed Applications, Software Licenses, Documents, External Documents, Contracts
- ✅ **Authentication**: Login/logout, session management, role-based access
- ✅ **Admin Panel**: Branding, Storage, Integrations, Audit Logs (4/11 sections complete)
- ✅ **Supporting Features**: Navigation, relationships, junction tables, design system compliance

**Out of Scope**:
- Dashboard (not yet implemented)
- Global Search (not yet implemented)
- 7 placeholder admin sections (Authentication, Fields, RBAC, Import/Export, Notifications, Backup)
- Network topology visualization (Phase 2)
- IP subnet visualization (Phase 2)

---

## Testing Strategy

### Multi-Agent Parallel Testing Approach

To maximize efficiency and prevent conflicts, testing is divided among 6 specialized agents:

| Agent | Focus Area | Tools | Test Count |
|-------|-----------|-------|------------|
| **Agent 1** | Playwright UI/UX | Playwright MCP only | ~120 |
| **Agent 2** | API/Backend | Bash (curl), Read | ~200 |
| **Agent 3** | Database | Bash (psql), Read | ~80 |
| **Agent 4** | Security/Auth | Bash, Playwright | ~50 |
| **Agent 5** | Integration/Relationships | Bash (curl), Read | ~60 |
| **Agent 6** | Admin Panel | Bash (curl), Playwright | ~40 |

**Total Test Scenarios**: ~550

---

## Test Categories

### 1. Frontend/UI Testing (Agent 1 - Playwright)

**Objective**: Verify visual presentation, user workflows, and design system compliance

#### Test Areas:
- **List Pages** (16 objects)
  - Empty state display
  - Table layout and columns
  - Search functionality
  - Filter controls
  - Sort functionality
  - Pagination
  - "Add New" button
  - Column management (enhanced tables)
  - Per-column filtering

- **Create Forms** (16 objects)
  - All fields render correctly
  - Required field validation
  - Dropdown population
  - Date pickers
  - Text areas
  - Conditional fields
  - Error message display
  - Success redirect

- **Detail Pages** (16 objects)
  - Overview tab display
  - Relationship tabs
  - Action buttons (Edit, Delete)
  - Badge styling (status indicators)
  - Field formatting
  - Tab navigation
  - Related items lists

- **Edit Forms** (16 objects)
  - Pre-population with existing data
  - Update functionality
  - Validation on update
  - Success feedback

- **Delete Flows** (16 objects)
  - Confirmation dialog
  - Dependency checking messages
  - Successful deletion
  - Redirect to list

- **Navigation**
  - Dropdown menus (Places, Assets, IT Services, Docs & Contracts)
  - Active state highlighting
  - Breadcrumbs (if present)
  - Hover interactions
  - Click outside to close

- **Design System Compliance**
  - Color usage (Morning Blue #1C7FF2, Brew Black #231F20, Off White #FAF9F5)
  - Typography (Inter font, 18px base)
  - Badge colors (Green, Light Blue, Orange for statuses)
  - Button styling (primary, secondary, destructive)
  - Spacing and grid alignment

- **Responsive Design**
  - Mobile layout (320px - 767px)
  - Tablet layout (768px - 1023px)
  - Desktop layout (1024px+)
  - Touch target sizes

- **Accessibility**
  - Color contrast ratios (WCAG AA)
  - Form labels
  - ARIA attributes
  - Keyboard navigation
  - Screen reader text

**Expected Outputs**: Screenshots, pass/fail status, visual regression notes

---

### 2. API/Backend Testing (Agent 2 - curl)

**Objective**: Verify REST API endpoints, validation, error handling

#### Test Areas:

**For Each Core Object** (16 × 12 operations):
- **GET /api/[object]** (List)
  - Returns 200 OK
  - Returns array of objects
  - Pagination works (limit, offset)
  - Filtering works (query params)
  - Sorting works (order_by, order_direction)
  - Empty array when no data

- **POST /api/[object]** (Create)
  - Returns 201 Created
  - Returns created object with ID
  - Validates required fields (400 if missing)
  - Validates field types (400 if wrong type)
  - Validates enum values (400 if invalid)
  - Rejects duplicate unique fields (409 Conflict)
  - Optional fields can be omitted

- **GET /api/[object]/[id]** (Read)
  - Returns 200 OK
  - Returns single object
  - Returns 404 for non-existent ID
  - Returns 400 for invalid UUID format

- **PATCH /api/[object]/[id]** (Update)
  - Returns 200 OK
  - Returns updated object
  - Validates field types
  - Validates enum values
  - Returns 404 for non-existent ID
  - Allows partial updates

- **DELETE /api/[object]/[id]** (Delete)
  - Returns 200 OK for successful delete
  - Returns 404 for non-existent ID
  - Returns 409 for dependency conflicts
  - Includes helpful error messages

**Special API Endpoints**:
- Health check: GET /api/health
- Search: GET /api/search (if implemented)
- Authentication: POST /api/auth/[...nextauth]
- Admin settings: GET/PUT /api/admin/settings/*
- Admin integrations: CRUD /api/admin/integrations
- Admin audit logs: GET /api/admin/audit-logs
- Junction tables: 15+ association endpoints

**Validation Testing**:
- Zod schema enforcement
- SQL injection prevention (parameterized queries)
- XSS prevention
- Type coercion handling
- Null vs undefined handling
- Empty string handling

**Expected Outputs**: curl commands, HTTP status codes, response bodies, timing data

---

### 3. Database Testing (Agent 3 - psql)

**Objective**: Verify schema integrity, constraints, relationships

#### Test Areas:

**Schema Validation**:
- All tables exist (companies, locations, rooms, people, devices, groups, networks, ios, ip_addresses, software, saas_services, installed_applications, software_licenses, documents, external_documents, contracts, users, roles, system_settings, integrations, custom_fields, admin_audit_log, + 20+ junction tables)
- All columns have correct data types
- All primary keys are UUID with default uuid_generate_v4()
- All timestamps have default CURRENT_TIMESTAMP
- All foreign keys reference correct tables

**Constraints**:
- Primary key uniqueness
- Foreign key relationships
- Check constraints (enums: device_type, person_type, company_type, etc.)
- Unique constraints (where applicable)
- Not null constraints on required fields

**Triggers**:
- updated_at timestamp auto-update on UPDATE
- Works for all tables with updated_at column

**Cascade Behavior**:
- ON DELETE CASCADE (e.g., location deleted → rooms deleted)
- ON DELETE SET NULL (e.g., person deleted → device.assigned_to_id set to NULL)
- Orphan prevention

**Data Integrity**:
- Insert valid data → success
- Insert invalid enum → rejection
- Insert null into required field → rejection
- Insert invalid foreign key → rejection
- Insert duplicate unique value → rejection
- Update timestamp auto-updates

**Junction Tables**:
- group_members
- person_software_licenses
- group_software_licenses
- io_tagged_networks
- document_devices
- document_networks
- document_saas_services
- document_locations
- document_rooms
- group_installed_applications
- person_saas_services
- group_saas_services
- contract_software_licenses
- network_ios

**Query Performance**:
- Index usage verification (EXPLAIN ANALYZE)
- Slow query detection (>100ms for simple queries)
- Join performance
- Pagination performance

**Expected Outputs**: SQL queries, query results, EXPLAIN ANALYZE output, constraint violation messages

---

### 4. Security & Authentication Testing (Agent 4)

**Objective**: Verify authentication, authorization, role-based access, security best practices

#### Test Areas:

**Authentication System**:
- **Login** (POST /api/auth/signin)
  - Valid credentials → redirect to home
  - Invalid credentials → error message
  - Empty credentials → validation error
  - SQL injection attempts → blocked
  - Session cookie created on success

- **Logout** (POST /api/auth/signout)
  - Session destroyed
  - Redirect to login
  - Cannot access protected routes after logout

- **Session Management**
  - Session persists across page loads
  - Session expires after 30 days (configured duration)
  - Session refresh works

- **Protected Routes**
  - Unauthenticated → redirect to /login?callbackUrl=[path]
  - Authenticated → access granted
  - After login → redirect to original callbackUrl

**Role-Based Access Control**:
- **User Role** (basic access)
  - Can view all objects
  - Can create/edit/delete owned objects
  - Cannot access /admin routes

- **Admin Role** (elevated access)
  - All user permissions
  - Can access /admin routes (except super_admin sections)
  - Can view audit logs
  - Can configure branding, storage, integrations

- **Super Admin Role** (full access)
  - All admin permissions
  - Can access authentication settings
  - Can access RBAC configuration
  - Can manage user roles

**Middleware Protection**:
- /admin/* routes require authentication
- Admin check in page components (Edge Runtime limitation)
- requireAdmin() helper works
- requireSuperAdmin() helper works
- Non-admin users redirected from /admin

**Admin Audit Logging**:
- All admin actions logged to admin_audit_log table
- Captures: user_id, action, category, target_object_id, target_object_type, details (JSONB), ip_address, user_agent, timestamp
- Log entries persisted correctly
- Audit log viewer displays entries
- Filtering works

**Security Best Practices**:
- **Password Security**
  - Bcrypt hashing with proper rounds
  - Passwords not stored in plaintext
  - Cannot retrieve original password

- **SQL Injection Prevention**
  - Parameterized queries used everywhere
  - Test with `'; DROP TABLE users; --`
  - Test with `OR 1=1`

- **XSS Prevention**
  - React automatic escaping works
  - User input sanitized
  - Test with `<script>alert('XSS')</script>`
  - Test with `<img src=x onerror=alert('XSS')>`

- **CSRF Protection**
  - NextAuth.js CSRF token validation
  - POST requests require valid token

- **Environment Variables**
  - Sensitive values not exposed to client
  - DATABASE_URL not leaked
  - SESSION_SECRET not leaked

**Expected Outputs**: Authentication flow results, access control matrix, security test results, vulnerability scan report

---

### 5. Integration & Relationships Testing (Agent 5)

**Objective**: Verify cross-object workflows, data relationships, junction tables

#### Test Areas:

**Object Hierarchies**:
- **Company → Location → Room → Device → Person**
  - Create company
  - Create location for company
  - Create room for location
  - Create device in room at location
  - Assign device to person
  - Verify full relationship chain
  - Verify navigation works (click through relationships)

- **Manager Hierarchy**
  - Create person A (manager)
  - Create person B with manager_id = A.id
  - Verify hierarchy displays
  - Verify recursive lookups work

- **Parent-Child Devices**
  - Create parent device (chassis)
  - Create child device (line card) with parent_device_id
  - Verify parent displays child devices
  - Verify child displays parent
  - Delete parent → child deleted (CASCADE)

**Junction Table Workflows**:

- **VLAN Tagging (io_tagged_networks)**
  - Create network (VLAN 10)
  - Create network (VLAN 20)
  - Create IO (trunk port)
  - Set native_network_id (VLAN 10)
  - Add tagged_network (VLAN 20)
  - Verify both VLANs associated
  - Remove tagged_network
  - Verify association removed

- **Software License Assignments**
  - Create software license (10 seats)
  - Assign to person A (seats_assigned = 1)
  - Assign to person B (seats_assigned = 2)
  - Attempt to assign 9 more people (should succeed until seats_assigned = 10)
  - Attempt to assign when full (should fail with seat exhaustion message)
  - Unassign person A (seats_assigned = 9)
  - Assign to group (no seat limit)
  - Verify group assignments don't affect seat count

- **Document Associations**
  - Create document
  - Associate with device
  - Associate with network
  - Associate with SaaS service
  - Associate with location
  - Associate with room
  - Verify all 5 associations display
  - Remove device association
  - Verify only 4 associations remain

- **Group Memberships**
  - Create group
  - Add person A to group
  - Add person B to group
  - Verify group shows 2 members
  - Remove person A
  - Verify group shows 1 member
  - Delete group → memberships deleted (CASCADE)

**Cross-Object Navigation**:
- Location detail → Rooms tab → click room → Room detail
- Device detail → Assigned To → click person → Person detail
- Person detail → Devices tab → click device → Device detail
- Network detail → Interfaces tab → click IO → IO detail
- Software License detail → Assignments → click person → Person detail

**Cascade Behavior**:
- Delete location → rooms cascade delete
- Delete room → devices set room_id to NULL
- Delete person → device assignment set to NULL
- Delete network → ip_addresses cascade delete
- Delete software → licenses cascade delete (if configured)

**Orphan Prevention**:
- Cannot create room without valid location_id
- Cannot create device with invalid location_id
- Cannot assign device to non-existent person
- Cannot tag IO with non-existent network

**Expected Outputs**: Workflow documentation, relationship verification, cascade test results, junction table state

---

### 6. Admin Panel Testing (Agent 6)

**Objective**: Verify admin settings, integrations, audit logging, access control

#### Test Areas:

**Admin Authentication**:
- User role → denied access to /admin
- Admin role → granted access to /admin (except super_admin sections)
- Super admin → full access to all /admin sections
- Non-authenticated → redirect to /login

**Admin Navigation**:
- Sidebar displays 11 sections
- Active state highlighting works
- "Requires Super Admin" indicator shown for restricted sections
- All links navigate correctly
- Layout consistent across all pages

**Implemented Sections**:

- **1. Overview/Dashboard** (/admin)
  - Page loads
  - Quick action cards display
  - Session information shown

- **2. Branding Settings** (/admin/branding)
  - GET /api/admin/settings/branding returns current settings
  - Form displays site_name, logo_url, favicon_url, colors
  - Color pickers work
  - Hex input validation
  - PUT /api/admin/settings/branding saves changes
  - Changes persist to system_settings table
  - Audit log entry created

- **3. Storage Configuration** (/admin/storage)
  - GET /api/admin/settings/storage returns current settings
  - Backend selection dropdown (Local, S3, NFS, SMB)
  - Dynamic form shows relevant fields per backend
  - S3 fields: bucket, region, access_key, secret_key, endpoint
  - NFS fields: host, path, mount_options
  - SMB fields: host, share, username, password
  - PUT /api/admin/settings/storage saves changes
  - Changes persist to system_settings table
  - Audit log entry created

- **4. Integrations Management** (/admin/integrations)
  - GET /api/admin/integrations returns list
  - Card-based UI displays integrations
  - Status indicators (active/inactive dots)
  - Integration types: IdP, MDM, RMM, Cloud Provider, Ticketing, Monitoring, Backup, Other
  - Color coding by type
  - Add new integration modal
  - POST /api/admin/integrations creates integration
  - PATCH /api/admin/integrations/[id] updates integration
  - DELETE /api/admin/integrations/[id] removes integration
  - Sync configuration: manual, hourly, daily, weekly
  - Last sync timestamp displayed
  - Audit log entries for all CRUD

- **5. Audit Logs Viewer** (/admin/audit-logs)
  - GET /api/admin/audit-logs returns logs
  - Table displays: timestamp, category, action, target, IP address
  - Category filter dropdown
  - Action filter dropdown
  - Result limit dropdown (25, 50, 100, 250)
  - Expandable JSON details per log entry
  - Color-coded category badges
  - Real-time filtering without page reload
  - Pagination (if >limit entries)

**Placeholder Sections**:
- Authentication (/admin/authentication) → "Under Construction" message
- Fields (/admin/fields) → "Under Construction" message
- RBAC (/admin/rbac) → "Under Construction" message
- Import/Export (/admin/import-export) → "Under Construction" message
- Notifications (/admin/notifications) → "Under Construction" message
- Backup (/admin/backup) → "Under Construction" message

**Admin Audit Logging**:
- Branding changes logged
- Storage changes logged
- Integration CRUD logged
- Logs include ip_address and user_agent
- Details field contains before/after values (JSONB)
- Logs queryable by category, action, date range

**Database Validation**:
- system_settings table populated with 46 default settings
- integrations table structure correct
- integration_sync_logs table structure correct
- custom_fields table structure correct
- admin_audit_log table structure correct
- Indexes created for performance

**Expected Outputs**: Admin workflow results, settings persistence verification, audit log verification, access control matrix

---

## Test Execution Plan

### Pre-Test Setup

**Database State**:
```bash
# Rebuild database to known state
node scripts/rebuild-database.js

# Verify database connection
psql -h 192.168.64.2 -U moss -d moss -c "SELECT COUNT(*) FROM companies;"

# Run migrations
cat migrations/002_add_authentication.sql | container exec -i moss-postgres psql -U moss -d moss
cat migrations/003_add_admin_settings.sql | container exec -i moss-postgres psql -U moss -d moss
```

**Test Users**:
```sql
-- Create test users with different roles
INSERT INTO users (username, email, password_hash, role) VALUES
  ('testuser', 'testuser@moss.local', '$2b$10$...', 'user'),
  ('testadmin', 'testadmin@moss.local', '$2b$10$...', 'admin'),
  ('testsuperadmin', 'testsuperadmin@moss.local', '$2b$10$...', 'super_admin');
```

**Development Server**:
```bash
npm run dev
# Verify server running on http://localhost:3001
```

**Container Status**:
```bash
container ps
# Verify moss-postgres container running
```

---

### Agent Assignments

#### Agent 1: Playwright UI/UX Testing
**File**: `UAT-RESULTS-PLAYWRIGHT-UI.md`

**Test Suites**:
1. List Pages (16 objects × 9 checks = 144 tests)
2. Create Forms (16 objects × 8 checks = 128 tests)
3. Detail Pages (16 objects × 7 checks = 112 tests)
4. Edit Forms (16 objects × 4 checks = 64 tests)
5. Delete Flows (16 objects × 4 checks = 64 tests)
6. Navigation (10 tests)
7. Design System Compliance (25 tests)
8. Responsive Design (15 tests)
9. Accessibility (20 tests)

**Total**: ~580 UI checks (many automated via Playwright loops)

**Playwright MCP Tools**:
- `mcp__playwright__browser_navigate`
- `mcp__playwright__browser_snapshot`
- `mcp__playwright__browser_take_screenshot`
- `mcp__playwright__browser_click`
- `mcp__playwright__browser_type`
- `mcp__playwright__browser_fill_form`
- `mcp__playwright__browser_evaluate`

---

#### Agent 2: API/Backend Testing
**File**: `UAT-RESULTS-API-BACKEND.md`

**Test Suites**:
1. Core Object APIs (16 objects × 12 operations = 192 tests)
2. Special Endpoints (Health, Search, Auth = 10 tests)
3. Admin APIs (Settings, Integrations, Audit = 30 tests)
4. Junction Table APIs (15 endpoints × 3 operations = 45 tests)
5. Validation Testing (50 tests)

**Total**: ~327 API tests

**Tools**: Bash (curl), Read (for API route code inspection)

---

#### Agent 3: Database Testing
**File**: `UAT-RESULTS-DATABASE.md`

**Test Suites**:
1. Schema Validation (40 tables × 3 checks = 120 tests)
2. Constraints (50 tests)
3. Triggers (10 tests)
4. Cascade Behavior (20 tests)
5. Data Integrity (30 tests)
6. Junction Tables (15 tables × 3 checks = 45 tests)
7. Query Performance (20 tests)

**Total**: ~295 database tests

**Tools**: Bash (psql), Read (for schema inspection)

---

#### Agent 4: Security & Authentication Testing
**File**: `UAT-RESULTS-SECURITY-AUTH.md`

**Test Suites**:
1. Authentication System (15 tests)
2. Role-Based Access Control (20 tests)
3. Middleware Protection (10 tests)
4. Admin Audit Logging (10 tests)
5. Security Best Practices (25 tests)

**Total**: ~80 security tests

**Tools**: Bash (curl), Playwright (for login flows)

---

#### Agent 5: Integration & Relationships Testing
**File**: `UAT-RESULTS-INTEGRATION-RELATIONSHIPS.md`

**Test Suites**:
1. Object Hierarchies (15 tests)
2. Junction Table Workflows (40 tests)
3. Cross-Object Navigation (20 tests)
4. Cascade Behavior (15 tests)
5. Orphan Prevention (10 tests)

**Total**: ~100 integration tests

**Tools**: Bash (curl), Read (for data verification)

---

#### Agent 6: Admin Panel Testing
**File**: `UAT-RESULTS-ADMIN-PANEL.md`

**Test Suites**:
1. Admin Authentication (8 tests)
2. Admin Navigation (6 tests)
3. Branding Settings (12 tests)
4. Storage Configuration (15 tests)
5. Integrations Management (20 tests)
6. Audit Logs Viewer (12 tests)
7. Placeholder Sections (6 tests)
8. Database Validation (10 tests)

**Total**: ~89 admin tests

**Tools**: Bash (curl), Playwright (for UI testing)

---

## Test Case Numbering Convention

**Format**: `TC-[AGENT]-[SUITE]-[NUMBER]`

Examples:
- `TC-PW-LIST-001`: Playwright → List Pages → Test 001
- `TC-API-CORE-042`: API → Core Object APIs → Test 042
- `TC-DB-SCHEMA-010`: Database → Schema Validation → Test 010
- `TC-SEC-AUTH-005`: Security → Authentication System → Test 005
- `TC-INT-HIER-003`: Integration → Object Hierarchies → Test 003
- `TC-ADM-BRAND-008`: Admin → Branding Settings → Test 008

---

## Defect Numbering Convention

**Format**: `DEF-UAT-[NUMBER]`

Examples:
- `DEF-UAT-001`: First defect discovered during UAT
- `DEF-UAT-042`: Defect number 42

**Severity Levels**:
- **Critical**: System unusable, data loss, security vulnerability
- **High**: Major feature broken, workaround difficult
- **Medium**: Feature partially broken, workaround available
- **Low**: Minor issue, cosmetic, enhancement suggestion

---

## Success Criteria

### Overall Targets
- **Pass Rate**: ≥85% (across all agents)
- **Critical Defects**: 0
- **High Defects**: ≤5
- **Test Coverage**: 100% of implemented features
- **Documentation**: All tests documented with evidence

### Agent-Specific Targets
- **Agent 1 (Playwright)**: ≥90% pass rate (UI should be stable)
- **Agent 2 (API)**: ≥95% pass rate (APIs should be well-tested)
- **Agent 3 (Database)**: ≥98% pass rate (Schema should be solid)
- **Agent 4 (Security)**: 100% pass rate (Security critical)
- **Agent 5 (Integration)**: ≥85% pass rate (Complex workflows)
- **Agent 6 (Admin)**: ≥80% pass rate (New feature, 4/11 complete)

### Evidence Requirements
- **Playwright Tests**: Screenshots for key workflows
- **API Tests**: curl commands + response bodies
- **Database Tests**: SQL queries + results
- **Security Tests**: Test payloads + responses
- **Integration Tests**: Workflow documentation
- **Admin Tests**: Screenshots + API responses

---

## Post-UAT Activities

### 1. Consolidation
- Compile all 6 agent reports into master report
- Calculate overall pass rate
- Categorize defects by severity and feature area
- Identify common themes/root causes

### 2. Defect Triage
- Review all failed tests
- Determine if failure is defect or test issue
- Prioritize defects by severity and impact
- Assign owners for remediation

### 3. Remediation Planning
- Create separate JIRA/GitHub issues for each defect
- Estimate effort for fixes
- Create remediation sprint plan
- Schedule regression testing

### 4. Documentation
- Archive UAT results
- Update project status documents
- Document known issues
- Create release notes

---

## Appendix A: Test Data Requirements

### Seed Data (Already in database via rebuild script)
- 7 Companies
- 5 Locations
- 13 Rooms
- 15 People
- Various devices, networks, etc.

### Test Data to Create During UAT
- Test users (user, admin, super_admin roles)
- Test objects for each feature
- Test relationships and associations
- Test edge cases (empty strings, nulls, max lengths)

---

## Appendix B: Environment Details

**Application**:
- URL: http://localhost:3001
- Framework: Next.js 15 + React 19
- Node.js: v18+

**Database**:
- Host: 192.168.64.2
- Port: 5432
- Database: moss
- User: moss
- Container: moss-postgres

**Authentication**:
- Provider: NextAuth.js v5
- Session: JWT with 30-day expiration

**Design System**:
- Colors: Morning Blue (#1C7FF2), Brew Black (#231F20), Off White (#FAF9F5)
- Font: Inter family
- Base size: 18px
- Scale ratio: 1.25

---

## Appendix C: Known Limitations (Out of Scope for UAT)

1. Dashboard not implemented (Phase 1 remaining)
2. Global Search not implemented (Phase 1 remaining)
3. 7 Admin sections placeholder only (Phase 2+)
4. Network topology visualization (Phase 2)
5. IP subnet visualization (Phase 2)
6. Bulk import/export (Phase 2)
7. File attachments (Phase 2)
8. SAML/SSO authentication (Phase 3)
9. External integrations sync (Phase 3)
10. API documentation (Phase 3)

---

## Appendix D: Test Execution Checklist

### Pre-Test (30 minutes)
- [ ] Rebuild database from scratch
- [ ] Run all migrations (002, 003)
- [ ] Create test users (user, admin, super_admin)
- [ ] Start development server (npm run dev)
- [ ] Verify server accessible at localhost:3001
- [ ] Verify Playwright MCP connection
- [ ] Verify database connection via psql
- [ ] Take baseline screenshots
- [ ] Document environment state

### During Test (Parallel execution)
- [ ] Each agent running independently
- [ ] No Playwright conflicts (only Agent 1 uses)
- [ ] Document all test results in agent markdown files
- [ ] Capture evidence (screenshots, curl output, SQL results)
- [ ] Note any blockers or test environment issues
- [ ] Track progress in agent-specific files

### Post-Test (2 hours)
- [ ] Collect all 6 agent result files
- [ ] Compile master UAT report
- [ ] Calculate pass rates per agent and overall
- [ ] Categorize defects by severity
- [ ] Create defect tracking spreadsheet
- [ ] Update CLAUDE-TODO.md with results
- [ ] Update STATUS.md with UAT completion
- [ ] Schedule remediation planning session

---

**Document Owner**: Claude Code Agent (Master)
**Last Updated**: 2025-10-11
**Next Review**: After UAT execution completion
