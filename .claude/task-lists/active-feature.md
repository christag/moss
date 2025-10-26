# Feature: JAMF Pro Integration

**Status**: In Progress
**Priority**: P2 (Phase 2 - Advanced Features → External Integrations)
**Started**: 2025-10-26
**Estimated Time**: 12-16 hours
**Actual Time**: ~3 hours (planning & foundation complete)
**Assignee**: moss-engineer
**Current Phase**: Implementation

## Overview

Implement JAMF Pro MDM integration to automatically sync users, computers, and groups from JAMF Pro into M.O.S.S. The integration follows a **reference-based** approach where M.O.S.S. stores core identity/inventory data but links to JAMF for real-time MDM details. This prevents data duplication while maintaining accurate asset tracking.

**Key Capabilities**:
- Sync computer inventory (hardware, serial numbers, user assignments, location)
- Sync user directory information (name, email, phone, job title)
- Sync static and smart groups with membership tracking
- Bi-directional mapping between JAMF objects and M.O.S.S. objects
- Deep links from M.O.S.S. pages to JAMF Pro for detailed MDM info
- Scheduled automatic sync (configurable interval, default 6 hours)
- Manual sync triggers via admin UI
- Conflict resolution for competing data sources

**User Experience Goals**:
- IT admins can configure JAMF connection without touching code
- Device/person/group pages show "View in JAMF" links for quick access
- New "MDM Info" tab on device pages shows enrollment status and security posture
- Sync history dashboard shows metrics and error tracking
- Clear indication when objects are synced from JAMF (badges/labels)

---

## Dependencies

**Completed Foundation** (3 hours):
- ✅ Database migration (024_jamf_integration.sql) - integration configs, sync history, object mappings
- ✅ Zod schemas (src/lib/schemas/integrations.ts) - JAMF API responses and config validation
- ✅ JAMF API client (src/lib/integrations/jamf-client.ts) - authentication, token management, all endpoints
- ✅ Data sync strategy documented (planning/jamf-integration-strategy.md) - field mappings and approach
- ✅ Feature branch created (feature/jamf-integration)

**External Dependencies**:
- JAMF Pro instance (user must have one)
- JAMF Pro API credentials (username/password or client credentials)
- PostgreSQL database with auto-migration enabled

**Internal Dependencies**:
- Existing device, person, and group CRUD operations
- Admin panel authentication (super_admin role)
- RBAC system for permission checks

**Potential Blockers**:
- None identified - all dependencies are met

---

## Task Breakdown

### Phase 1: Sync Service Implementation (4-5 hours)

#### 1.1 Credential Encryption Helper
**File**: `src/lib/integrations/encryption.ts`
- [ ] Create encryption/decryption functions for credentials
- [ ] Use environment variable `INTEGRATION_ENCRYPTION_KEY` (32 bytes)
- [ ] Handle missing encryption key gracefully (warn, don't crash)
- [ ] Export `encryptCredentials(credentials: object): string`
- [ ] Export `decryptCredentials(encrypted: string): object`

**Acceptance Criteria**:
- Can encrypt JSON object to base64 string
- Can decrypt back to original JSON
- Returns null and logs warning if encryption key missing
- Test with sample JAMF credentials

---

#### 1.2 Computer Sync Service
**File**: `src/lib/integrations/jamf-sync-computers.ts`
- [ ] Export `syncComputersFromJamf(integrationConfigId: string, progressCallback?)`
- [ ] Fetch integration config from database
- [ ] Decrypt credentials and create JAMF client
- [ ] Fetch all computers from JAMF (with pagination handling)
- [ ] For each computer:
  - [ ] Extract fields per strategy doc (serial, hostname, model, manufacturer, MAC addresses)
  - [ ] Check if device exists in M.O.S.S. by serial number
  - [ ] If exists: UPDATE device fields (hostname, model, assigned user, location)
  - [ ] If new: INSERT new device record
  - [ ] Handle user assignment (find/create person by email from `userAndLocation`)
  - [ ] Handle location mapping (find/create location and room)
  - [ ] Create MAC address IO objects (ethernet + wifi interfaces)
  - [ ] Create/update mapping in `integration_object_mappings` table
- [ ] Track metrics: processed, created, updated, skipped, failed
- [ ] Create sync history record in `integration_sync_history`
- [ ] Return summary: `{ success: boolean, metrics: {...}, errors: [...] }`

**Database Queries Needed**:
- `SELECT * FROM integration_configs WHERE id = $1`
- `SELECT id FROM devices WHERE serial_number = $1`
- `UPDATE devices SET ... WHERE id = $1`
- `INSERT INTO devices (...) VALUES (...) RETURNING id`
- `SELECT id FROM people WHERE email = $1 OR username = $1`
- `INSERT INTO people (...) VALUES (...) RETURNING id`
- `SELECT id FROM locations WHERE name = $1`
- `SELECT id FROM rooms WHERE name = $1 AND location_id = $2`
- `INSERT INTO integration_object_mappings (...) VALUES (...)`
- `INSERT INTO integration_sync_history (...) VALUES (...)`

**Error Handling**:
- Wrap entire sync in try/catch
- Log individual device failures but continue processing
- Set sync status to 'partial' if some failed, 'success' if all succeeded
- Store first 10 errors in `sync_history.error_details` JSONB

**Acceptance Criteria**:
- Can sync 100+ computers without crashing
- Correctly maps JAMF data to M.O.S.S. device fields
- Creates new devices for computers not in M.O.S.S.
- Updates existing devices without data loss
- Creates/links users and locations properly
- Returns accurate metrics and error details

---

#### 1.3 User Sync Service
**File**: `src/lib/integrations/jamf-sync-users.ts`
- [ ] Export `syncUsersFromJamf(integrationConfigId: string, progressCallback?)`
- [ ] Fetch all users from JAMF (Classic API)
- [ ] For each user:
  - [ ] Extract: name → username, full_name, email, phone_number, position → job_title
  - [ ] Check if person exists (match on email OR username)
  - [ ] If exists: UPDATE contact info only (email, phone, job_title)
  - [ ] If new: INSERT new person record
  - [ ] DON'T overwrite: manager_id, hire_date, termination_date, is_active
  - [ ] Create/update mapping in `integration_object_mappings`
- [ ] Track metrics and create sync history
- [ ] Return summary

**Conflict Resolution**:
- Only update: email_address, phone_number, job_title
- Skip updates if M.O.S.S. has more recent data (check updated_at timestamp)
- Log conflicts for manual review

**Acceptance Criteria**:
- Can sync users without overwriting org hierarchy (manager relationships)
- Respects M.O.S.S. as source of truth for hire dates and termination
- Correctly matches existing users by email/username
- Creates new users for JAMF accounts not in M.O.S.S.

---

#### 1.4 Group Sync Service
**File**: `src/lib/integrations/jamf-sync-groups.ts`
- [ ] Export `syncGroupsFromJamf(integrationConfigId: string, progressCallback?)`
- [ ] Fetch all computer groups from JAMF
- [ ] For each group:
  - [ ] Prefix name with `[JAMF]` (e.g., "Marketing" → "[JAMF] Marketing")
  - [ ] Set `group_type`: `jamf_static` or `jamf_smart` based on `isSmart`
  - [ ] Check if group exists in M.O.S.S. (by prefixed name)
  - [ ] If exists: UPDATE group
  - [ ] If new: INSERT new group
  - [ ] **Only for static groups**: Fetch members and sync to `group_members` table
    - Get JAMF computer IDs
    - Look up corresponding M.O.S.S. device IDs from mappings
    - Clear existing members for this group
    - Insert new members
  - [ ] **For smart groups**: Don't sync members (too dynamic, reference only)
  - [ ] Create/update mapping
- [ ] Track metrics and create sync history
- [ ] Return summary

**Member Sync Logic**:
```sql
-- Clear existing members
DELETE FROM group_members WHERE group_id = $1;

-- Insert new members (for each device)
INSERT INTO group_members (group_id, device_id) VALUES ($1, $2);
```

**Acceptance Criteria**:
- Static groups have correct membership in M.O.S.S.
- Smart groups are created but membership stays in JAMF
- Group names clearly indicate JAMF source with [JAMF] prefix
- Handles groups with 100+ members efficiently

---

### Phase 2: API Endpoints (2-3 hours)

**Base Path**: `/api/integrations/jamf/`

#### 2.1 Configuration Endpoints
**Files**:
- `src/app/api/integrations/jamf/config/route.ts` (GET, POST, PUT)
- `src/app/api/integrations/jamf/test-connection/route.ts` (POST)

**GET /api/integrations/jamf/config**:
- [ ] Require `super_admin` role
- [ ] Fetch integration_configs WHERE integration_type='jamf'
- [ ] Return config WITHOUT decrypted credentials
- [ ] Return 404 if not configured

**POST /api/integrations/jamf/config** (Create):
- [ ] Require `super_admin` role
- [ ] Validate request body with `createIntegrationConfigSchema`
- [ ] Encrypt credentials before storing
- [ ] INSERT into integration_configs
- [ ] Return created config (no credentials)

**PUT /api/integrations/jamf/config** (Update):
- [ ] Require `super_admin` role
- [ ] Validate request body
- [ ] If new credentials provided, encrypt and update
- [ ] UPDATE integration_configs
- [ ] Return updated config

**POST /api/integrations/jamf/test-connection**:
- [ ] Require `super_admin` role
- [ ] Accept credentials in request body (not saved)
- [ ] Create temporary JAMF client
- [ ] Call `testConnection()` method
- [ ] Return { success: boolean, message: string }

**Acceptance Criteria**:
- Credentials never returned in API responses
- Test connection works without saving config
- Only super_admins can access endpoints
- Proper Zod validation on all inputs

---

#### 2.2 Sync Operation Endpoints
**Files**:
- `src/app/api/integrations/jamf/sync/route.ts` (POST)
- `src/app/api/integrations/jamf/sync-status/route.ts` (GET)
- `src/app/api/integrations/jamf/sync-history/route.ts` (GET)

**POST /api/integrations/jamf/sync**:
- [ ] Require `admin` role
- [ ] Support query param `?type=computers|users|groups|all` (default: all)
- [ ] Create sync history record with status='in_progress'
- [ ] Run sync functions based on type:
  - `all`: Run computers, then users, then groups sequentially
  - `computers`: Run `syncComputersFromJamf()` only
  - `users`: Run `syncUsersFromJamf()` only
  - `groups`: Run `syncGroupsFromJamf()` only
- [ ] Update sync history with results
- [ ] Return summary with metrics

**GET /api/integrations/jamf/sync-status**:
- [ ] Require `admin` role
- [ ] Query latest sync history record
- [ ] Return: status, started_at, completed_at, metrics, errors
- [ ] If sync in progress, calculate % complete (if possible)

**GET /api/integrations/jamf/sync-history**:
- [ ] Require `admin` role
- [ ] Support pagination: `?page=0&pageSize=20`
- [ ] Query `integration_sync_history` ORDER BY sync_started_at DESC
- [ ] Return array of sync records

**Acceptance Criteria**:
- Manual sync can be triggered via API
- Sync status updates in real-time
- History shows past 30 days of syncs with metrics
- Errors are logged and retrievable

---

### Phase 3: Admin UI (3-4 hours)

#### 3.1 JAMF Integration Configuration Page
**File**: `src/app/admin/integrations/jamf/page.tsx`

- [ ] Add "Integrations" link to admin sidebar navigation
- [ ] Create integration configuration form:
  - [ ] Base URL input (with validation: must be HTTPS)
  - [ ] Username input
  - [ ] Password input (masked, show/hide toggle)
  - [ ] Timeout setting (slider, 10-300 seconds)
  - [ ] "Test Connection" button (calls test endpoint, shows success/error)
  - [ ] Sync settings:
    - [ ] Checkboxes: sync_computers, sync_users, sync_groups
    - [ ] Sync schedule (cron expression or dropdown with presets)
    - [ ] Auto-sync enabled toggle
    - [ ] Multi-select: Computer sections to sync (GENERAL, HARDWARE, etc.)
    - [ ] Checkbox: Create missing locations automatically
  - [ ] Save button (POST or PUT to config endpoint)
- [ ] Show current configuration status (if exists)
- [ ] Show last sync timestamp and status
- [ ] "Run Manual Sync" button (triggers POST /api/integrations/jamf/sync)

**Form Validation**:
- Base URL must start with https://
- Username and password required
- At least one sync type must be enabled
- Valid cron expression or preset selected

**Acceptance Criteria**:
- Form is intuitive and follows M.O.S.S. design system
- Test connection provides clear feedback
- Manual sync shows progress indicator
- Only super_admins can access page

---

#### 3.2 Sync History Dashboard
**File**: `src/app/admin/integrations/jamf/history/page.tsx`

- [ ] Table showing sync history:
  - Columns: Date/Time, Type, Status, Items Processed, Created, Updated, Failed, Duration
  - [ ] Color-coded status: green (success), yellow (partial), red (failed)
  - [ ] Click row to expand and show error details
- [ ] Pagination controls
- [ ] Filter by: status, sync_type, date range
- [ ] "View Errors" button for failed syncs (shows error_details JSON in modal)
- [ ] Auto-refresh every 30 seconds if sync in progress

**Acceptance Criteria**:
- Easy to identify failed syncs and errors
- Can drill down into specific sync for debugging
- Filters work correctly
- Performance: Renders 100+ sync records without lag

---

### Phase 4: UI Enhancements (2-3 hours)

#### 4.1 "View in JAMF" Links
**Files to Update**:
- `src/app/devices/[id]/page.tsx`
- `src/app/people/[id]/page.tsx`
- `src/app/groups/[id]/page.tsx`

**Device Page**:
- [ ] Query `integration_object_mappings` to check if device is synced from JAMF
- [ ] If synced, show button in header: "View in JAMF Pro →"
  - Opens: `https://{jamf-instance}/computers.html?id={jamf_computer_id}&o=r`
  - Use `target="_blank" rel="noopener noreferrer"`
- [ ] Add badge below device name: "[Synced from JAMF]" (light blue, subtle)

**Person Page**:
- [ ] Same pattern: Check mappings, show "View in JAMF Pro →" if exists
- [ ] Link: `https://{jamf-instance}/users.html?id={jamf_user_id}&o=r`

**Group Page**:
- [ ] For groups with `[JAMF]` prefix, show button
- [ ] Link: `https://{jamf-instance}/smartComputerGroups.html?id={jamf_group_id}&o=r`
- [ ] Add banner: "This group is synced from JAMF. Membership is managed in JAMF. Last synced: 10 minutes ago"

**Acceptance Criteria**:
- Links open correct JAMF page in new tab
- Only shown for objects actually synced from JAMF
- Buttons use M.O.S.S. design system (Morning Blue accent)
- Links work for both JAMF Cloud and on-premise instances

---

#### 4.2 MDM Info Tab (Device Detail Page)
**File**: `src/app/devices/[id]/mdm/page.tsx` (new tab)

- [ ] Add "MDM Info" tab to device detail tabs (between "IOs" and "History")
- [ ] Tab content:
  - [ ] "View in JAMF Pro →" button (prominent, top-right)
  - [ ] Last Check-In time (from JAMF, cached for 10 mins)
  - [ ] Enrollment Status widget:
    - Enrolled / Unenrolled / Pending
    - MDM Profile name
    - User Approved MDM status
  - [ ] Security Posture widget:
    - FileVault: Enabled/Disabled
    - Gatekeeper: Enabled/Disabled
    - System Integrity Protection: Enabled/Disabled
    - XProtect version
  - [ ] Installed Software widget:
    - Count: "47 applications managed by JAMF"
    - [View Full List in JAMF] button
  - [ ] Group Memberships widget:
    - List up to 5 groups
    - Click group to view in M.O.S.S. or JAMF
    - "View all X groups in JAMF" link
  - [ ] Configuration Profiles widget:
    - Count: "8 profiles applied"
    - [View Profiles in JAMF] button

**Data Fetching**:
- [ ] Optional API endpoint: `GET /api/integrations/jamf/device/[id]/live`
  - Fetches real-time data from JAMF for this specific device
  - Caches for 10 minutes to avoid rate limiting
  - Falls back to last sync data if JAMF unavailable

**Acceptance Criteria**:
- Tab only appears for devices synced from JAMF
- Shows helpful summary without duplicating all JAMF data
- Clear call-to-action to view detailed info in JAMF
- Gracefully handles JAMF being offline (shows cached data)

---

### Phase 5: Testing & Polish (1-2 hours)

#### 5.1 UAT Test Cases
**File**: `.claude/task-lists/jamf-integration-uat.md`

- [ ] Configuration workflow:
  - [ ] Can save JAMF connection settings
  - [ ] Test connection shows clear success/error
  - [ ] Invalid credentials show helpful error message
- [ ] Computer sync:
  - [ ] Creates new devices for JAMF computers not in M.O.S.S.
  - [ ] Updates existing devices (hostname, model, user)
  - [ ] Creates MAC address IO objects
  - [ ] Links users correctly (finds existing, creates new)
  - [ ] Respects location creation setting
- [ ] User sync:
  - [ ] Updates contact info (email, phone, title)
  - [ ] Doesn't overwrite manager relationships
  - [ ] Creates new people for JAMF users
- [ ] Group sync:
  - [ ] Syncs static group membership correctly
  - [ ] Marks smart groups appropriately (no member sync)
  - [ ] Prefixes all group names with [JAMF]
- [ ] UI Integration:
  - [ ] "View in JAMF" links open correct pages
  - [ ] MDM Info tab shows relevant data
  - [ ] Sync history table displays correctly
  - [ ] Manual sync shows progress feedback
- [ ] Error handling:
  - [ ] Invalid credentials handled gracefully
  - [ ] Network errors don't crash sync
  - [ ] Partial sync failures logged properly
  - [ ] Conflict resolution works as designed

**Test Data Needed**:
- Access to a JAMF Pro demo/test instance
- At least 10 test computers in JAMF
- At least 5 test users
- 2-3 static groups and 2-3 smart groups

#### 5.2 Documentation Updates
- [ ] Update `README.md` with JAMF integration section
- [ ] Document sync frequency recommendations
- [ ] Add troubleshooting guide for common issues
- [ ] Update `CLAUDE-TODO.md` to mark feature complete
- [ ] Archive feature in `.claude/task-lists/completed-features.md`

---

## Implementation Notes

**Current Status** (2025-10-26):
- Completed foundation work (DB, schemas, client, strategy)
- Ready to begin Phase 1: Sync Service Implementation
- All dependencies met, no blockers

**Key Decisions**:
1. **Reference-based sync**: Don't duplicate JAMF data, link to it
2. **Credential encryption**: Use environment variable for key, graceful degradation if missing
3. **Conflict resolution**: M.O.S.S. wins for locations/asset tags, JAMF wins for user assignments
4. **Smart groups**: Don't sync members (too dynamic), reference only
5. **Sync frequency**: Default 6 hours, configurable, manual trigger always available

**Risks & Mitigations**:
- **Risk**: Large JAMF deployments (1000+ computers) could timeout
  - **Mitigation**: Pagination in sync service, progress callbacks, consider background jobs
- **Risk**: JAMF API rate limiting
  - **Mitigation**: Respect rate limits, add delays between requests, cache where possible
- **Risk**: Data conflicts between JAMF and M.O.S.S.
  - **Mitigation**: Clear conflict resolution rules, track conflicts in mappings table

**Performance Targets**:
- Sync 100 computers: < 2 minutes
- Sync 1000 computers: < 15 minutes
- Admin UI loads in < 1 second
- Sync history queries < 500ms

---

## Dependencies

**Depends On**: None (all prerequisites met)

**Blocks**: None (this is a standalone feature)

---

## Test Results

**Status**: Not Yet Tested
**Attempts**: 0/3

(To be filled in by moss-tester)

---

## Retry Count

**Attempts**: 0/3

---

## Completion Notes

(To be filled in when feature is complete)
