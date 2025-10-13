# Enhanced RBAC Implementation

This document provides detailed specifications for the Enhanced RBAC system in M.O.S.S. For high-level overview, see [CLAUDE.md](../CLAUDE.md). For database details, see [database-architecture.md](database-architecture.md). For admin UI details, see [admin-panel-architecture.md](admin-panel-architecture.md).

## Overview

The Enhanced RBAC system provides:
- **Hierarchical roles** with permission inheritance
- **Location-based scoping** for distributed teams
- **Object-level permission overrides** for granular control
- **In-memory caching** with automatic invalidation
- **Circular hierarchy prevention** at database level

**Implementation Completed**: 2025-10-12 across three phases:
1. Database schema (migration 006)
2. API routes (phase 2)
3. Admin UI (phase 3)

## Core Library: src/lib/rbac.ts

### Permission Checking Functions

**Main Permission Check**:
```typescript
async function checkPermission(
  userId: string,
  action: string,
  objectType: string,
  objectId?: string
): Promise<{ granted: boolean, reason: string, path: string[] }>
```

**Algorithm**:
1. Check object permissions first (highest priority)
2. Check role permissions (with inheritance)
3. Handle location scoping for location-scoped assignments
4. Default deny if no permission found

**Returns**:
- `granted`: Boolean indicating if permission granted
- `reason`: Human-readable explanation
- `path`: Array showing permission source for debugging

**Example Usage**:
```typescript
const { granted, reason, path } = await checkPermission(
  userId,
  'delete',
  'device',
  deviceId
)

if (!granted) {
  return res.status(403).json({ message: 'Permission denied', reason })
}
```

**Related Functions**:
```typescript
// Get complete role inheritance chain
async function getRoleHierarchy(roleId: string): Promise<Role[]>

// Get permissions with or without inherited permissions
async function getRolePermissions(
  roleId: string,
  includeInherited: boolean = true
): Promise<Permission[]>

// Get all permissions for a user (aggregated from all roles)
async function getUserPermissions(userId: string): Promise<Permission[]>

// Check if user has access to a location
async function hasLocationAccess(
  userId: string,
  locationId: string
): Promise<boolean>

// Combined permission and location check
async function checkPermissionWithLocation(
  userId: string,
  action: string,
  objectType: string,
  objectId: string,
  locationId: string
): Promise<{ granted: boolean, reason: string }>
```

### Cache Management

**In-Memory Cache**:
- TTL: 5 minutes
- Implementation: Map-based with timestamp tracking
- Auto-cleanup on TTL expiration

**Cache Keys**:
- `user:{userId}:permissions` - User's aggregated permissions
- `role:{roleId}:permissions` - Role's direct + inherited permissions
- `role:{roleId}:hierarchy` - Complete role inheritance chain

**Invalidation Functions**:
```typescript
// Called when user's role assignments change
function invalidateUserCache(userId: string): void

// Called when role permissions change
function invalidateRoleCache(roleId: string): void

// Called when group assignments change
function invalidateGroupMembersCache(groupId: string): void
```

**When to Invalidate**:
- After creating/updating/deleting role assignment
- After granting/revoking permission from role
- After updating role's parent_role_id
- After adding/removing user from group
- After granting/revoking object permission

**Example**:
```typescript
// After updating role assignment
await query('UPDATE role_assignments SET scope = $1 WHERE id = $2', [scope, id])
invalidateUserCache(userId)

// After changing role permissions
await query('DELETE FROM role_permissions WHERE role_id = $1', [roleId])
invalidateRoleCache(roleId)

// Cascading invalidation when parent role changes
const childRoles = await query('SELECT id FROM roles WHERE parent_role_id = $1', [roleId])
childRoles.forEach(child => invalidateRoleCache(child.id))
```

### Circular Hierarchy Prevention

**Database Function**: `check_role_hierarchy_cycle(p_role_id, p_new_parent_id)`

**Returns**: Boolean (true if cycle detected, false if safe)

**Implementation** (PostgreSQL):
```sql
CREATE OR REPLACE FUNCTION check_role_hierarchy_cycle(
  p_role_id UUID,
  p_new_parent_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  cycle_exists BOOLEAN;
BEGIN
  -- If new parent is NULL, no cycle possible
  IF p_new_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if new parent is descendant of role
  WITH RECURSIVE descendants AS (
    SELECT id, parent_role_id
    FROM roles
    WHERE id = p_role_id

    UNION

    SELECT r.id, r.parent_role_id
    FROM roles r
    INNER JOIN descendants d ON r.parent_role_id = d.id
  )
  SELECT EXISTS (
    SELECT 1 FROM descendants WHERE id = p_new_parent_id
  ) INTO cycle_exists;

  RETURN cycle_exists;
END;
$$ LANGUAGE plpgsql;
```

**Usage in API**:
```typescript
// Before updating parent_role_id
const hasCycle = await query(
  'SELECT check_role_hierarchy_cycle($1, $2) AS has_cycle',
  [roleId, newParentId]
)

if (hasCycle.rows[0].has_cycle) {
  return res.status(400).json({
    success: false,
    message: 'Cannot set parent: would create circular hierarchy'
  })
}

// Safe to proceed
await query(
  'UPDATE roles SET parent_role_id = $1 WHERE id = $2',
  [newParentId, roleId]
)
```

## Database Schema (Migration 006)

### Enhanced Tables

**roles**:
```sql
ALTER TABLE roles ADD COLUMN parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
```

**role_assignments**:
```sql
ALTER TABLE role_assignments ADD COLUMN granted_by UUID REFERENCES people(id) ON DELETE SET NULL;
```

**object_permissions**:
```sql
ALTER TABLE object_permissions ADD COLUMN granted_by UUID REFERENCES people(id) ON DELETE SET NULL;
```

### Helper Functions

**check_role_hierarchy_cycle** (see above)

### Views

**role_hierarchy_permissions**:
```sql
CREATE VIEW role_hierarchy_permissions AS
WITH RECURSIVE role_tree AS (
  -- Start with all roles
  SELECT id, role_name, parent_role_id, 0 AS depth
  FROM roles

  UNION

  -- Recursively get parent roles
  SELECT r.id, r.role_name, r.parent_role_id, rt.depth + 1
  FROM roles r
  INNER JOIN role_tree rt ON r.id = rt.parent_role_id
)
SELECT
  rt.id AS role_id,
  rt.role_name,
  rt.parent_role_id,
  rt.depth,
  p.*,
  CASE WHEN rt.depth > 0 THEN TRUE ELSE FALSE END AS is_inherited
FROM role_tree rt
LEFT JOIN role_permissions rp ON rt.id = rp.role_id OR rt.parent_role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
ORDER BY rt.depth, rt.role_name;
```

**Usage**:
```typescript
// Get all permissions for a role (including inherited)
const permissions = await query(
  'SELECT * FROM role_hierarchy_permissions WHERE role_id = $1',
  [roleId]
)

// Direct permissions: is_inherited = false
// Inherited permissions: is_inherited = true
```

## API Routes (Phase 2)

### Permissions API

**Base Path**: `/api/permissions`

**GET /api/permissions**:
- Query params: `object_type`, `action` (optional filters)
- Returns: Array of all permissions
- Auth: Admin only

**POST /api/permissions**:
- Body: `{ object_type, action, description }`
- Returns: Created permission
- Auth: Super admin only

**GET /api/permissions/:id**:
- Returns: Single permission with usage count
- Auth: Admin only

**PATCH /api/permissions/:id**:
- Body: `{ description }` (object_type and action immutable)
- Returns: Updated permission
- Auth: Super admin only

**DELETE /api/permissions/:id**:
- Checks if permission is in use (role_permissions, object_permissions)
- Returns error if in use, otherwise deletes
- Auth: Super admin only

### Roles API

**Base Path**: `/api/roles`

**GET /api/roles**:
- Query params: `is_system_role` (optional filter)
- Returns: Array of all roles
- Auth: All authenticated users

**POST /api/roles**:
- Body: `{ role_name, description, parent_role_id? }`
- Validates: No cycle via `check_role_hierarchy_cycle()`
- Returns: Created role with `is_system_role=false`
- Auth: Super admin only

**GET /api/roles/:id**:
- Returns: Role with metadata (permission count, assignment count)
- Auth: All authenticated users

**PATCH /api/roles/:id**:
- Body: `{ role_name?, description?, parent_role_id? }`
- Validates:
  - System roles cannot be modified
  - Cycle check if parent_role_id changed
- Invalidates cache: `invalidateRoleCache(id)` + cascading children
- Returns: Updated role
- Auth: Super admin only

**DELETE /api/roles/:id**:
- Validates: System roles cannot be deleted
- Checks: No role assignments exist
- Deletes: Role + permissions (cascade)
- Invalidates cache: `invalidateRoleCache(id)`
- Returns: Success message
- Auth: Super admin only

**GET /api/roles/:id/hierarchy**:
- Returns: Complete inheritance tree (ancestors + descendants)
- Format:
  ```json
  {
    "ancestors": [
      { "id": "...", "role_name": "Super Admin", "depth": 2 },
      { "id": "...", "role_name": "Admin", "depth": 1 }
    ],
    "self": { "id": "...", "role_name": "IT Admin", "depth": 0 },
    "descendants": [
      { "id": "...", "role_name": "Help Desk", "depth": -1 }
    ]
  }
  ```
- Auth: All authenticated users

**GET /api/roles/:id/permissions**:
- Query params: `include_inherited` (boolean, default true)
- Returns: Array of permissions with `is_inherited` flag
- Uses: `role_hierarchy_permissions` view
- Auth: All authenticated users

**DELETE /api/roles/:id/permissions/:permissionId**:
- Removes specific permission from role
- Invalidates cache: `invalidateRoleCache(id)`
- Returns: Success message
- Auth: Super admin only

### Role Assignments API

**Base Path**: `/api/role-assignments`

**GET /api/role-assignments**:
- Query params: `scope`, `person_id`, `group_id`, `role_id` (optional filters)
- Returns: Array of assignments with JOINed data:
  - Person/group name
  - Role name
  - Location names (if location-scoped)
  - Granted by person name
- Auth: Super admin only

**POST /api/role-assignments**:
- Body:
  ```json
  {
    "person_id": "uuid" | "group_id": "uuid",
    "role_id": "uuid",
    "scope": "global" | "location" | "specific_objects",
    "location_ids": ["uuid", ...],  // Required if scope=location
    "notes": "string"
  }
  ```
- Transaction:
  1. Insert `role_assignments` row
  2. If `scope=location`, insert `role_assignment_locations` rows
- Invalidates cache: `invalidateUserCache(person_id)` or `invalidateGroupMembersCache(group_id)`
- Returns: Created assignment with ID
- Auth: Super admin only

**GET /api/role-assignments/:id**:
- Returns: Single assignment with all JOINed data
- Includes: Location names array
- Auth: Super admin only

**PATCH /api/role-assignments/:id**:
- Body: `{ scope?, location_ids?, notes? }`
- Transaction:
  1. Delete old `role_assignment_locations` rows
  2. Update `role_assignments` row
  3. Insert new `role_assignment_locations` rows if needed
- Invalidates cache: User/group cache
- Returns: Updated assignment
- Auth: Super admin only

**DELETE /api/role-assignments/:id**:
- Transaction:
  1. Delete `role_assignment_locations` rows (cascade)
  2. Delete `role_assignments` row
- Invalidates cache: User/group cache
- Returns: Success message
- Auth: Super admin only

### Object Permissions API

**Base Path**: `/api/object-permissions`

**GET /api/object-permissions**:
- Query params: `object_type`, `object_id`, `person_id`, `group_id`, `action` (optional filters)
- Returns: Array of object permissions with JOINed data
- Auth: Super admin only

**POST /api/object-permissions**:
- Body:
  ```json
  {
    "person_id": "uuid" | "group_id": "uuid",
    "action": "view" | "edit" | "delete" | "manage_permissions",
    "object_type": "device" | "person" | ...,
    "object_id": "uuid",
    "granted_by": "uuid"
  }
  ```
- Returns: Created permission
- Auth: User with `manage_permissions` on object

**DELETE /api/object-permissions/:id**:
- Returns: Success message
- Auth: User with `manage_permissions` on object

### Permission Testing API

**Base Path**: `/api/rbac`

**POST /api/rbac/test-permission**:
- Body:
  ```json
  {
    "user_id": "uuid",
    "action": "view",
    "object_type": "device",
    "object_id": "uuid"  // Optional
  }
  ```
- Calls: `checkPermission(user_id, action, object_type, object_id)`
- Returns:
  ```json
  {
    "granted": true,
    "reason": "Granted via role 'IT Admin'",
    "path": ["role_assignment", "IT Admin", "device:view"],
    "test_parameters": { ... }
  }
  ```
- Auth: Super admin only

## UI Components (Phase 3)

### File Structure

**Admin Pages**:
1. `src/app/admin/rbac/page.tsx` - RBAC hub with navigation cards
2. `src/app/admin/rbac/roles/page.tsx` - Roles list view
3. `src/app/admin/rbac/roles/[id]/page.tsx` - Role detail with permission grid
4. `src/app/admin/rbac/roles/[id]/edit/page.tsx` - Edit role form
5. `src/app/admin/rbac/roles/new/page.tsx` - Create role form
6. `src/app/admin/rbac/assignments/page.tsx` - Assignments list
7. `src/app/admin/rbac/test/page.tsx` - Permission testing tool

**Components**:
1. `src/components/RoleForm.tsx` - Shared role form (name, description, parent)
2. `src/components/PermissionGrid.tsx` - Interactive permission checkbox grid
3. `src/components/AssignRoleModal.tsx` - 5-step assignment wizard

### PermissionGrid Component

**Props**:
```typescript
interface PermissionGridProps {
  roleId: string
  permissions: Permission[]  // Current permissions
  onPermissionChange: (objectType: string, action: string, granted: boolean) => Promise<void>
}
```

**Layout**:
- 6 category sections (collapsible):
  1. **Places**: Company, Location, Room
  2. **Assets**: Device, IO, IP Address
  3. **IT Services**: Software, SaaS Service, Installed Application, Software License
  4. **Organization**: Person, Group
  5. **Documentation**: Document, External Document, Contract
  6. **Network**: Network
- Each category has a table:
  - Rows: Object types in category
  - Columns: view, edit, delete, manage_permissions
  - Cells: Checkboxes (or gray read-only for inherited)
- "Select All" checkboxes:
  - Row-level: Grant all actions for object type
  - Column-level: Grant action for all object types in category

**Inherited Permissions**:
- Shown in gray with "inherited" label
- Not clickable (must modify parent role)
- Tooltip shows parent role name

**Real-time Updates**:
- Optimistic UI: Check/uncheck immediately
- API call: POST/DELETE `/api/roles/:id/permissions`
- Rollback on error: Revert checkbox state + show error toast

**Example**:
```
Places
┌─────────────┬──────┬──────┬────────┬────────────────────┐
│ Object Type │ View │ Edit │ Delete │ Manage Permissions │
├─────────────┼──────┼──────┼────────┼────────────────────┤
│ Company     │ ✓    │ ✓    │ ☐      │ ☐                  │
│ Location    │ ✓    │ ☐    │ ☐      │ ☐                  │
│ Room        │ ✓    │ ☐    │ ☐      │ ☐ (inherited)      │
└─────────────┴──────┴──────┴────────┴────────────────────┘
```

### AssignRoleModal Component

**Props**:
```typescript
interface AssignRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**5-Step Wizard**:

**Step 1: Select Assignee**
- Toggle buttons: Person / Group
- Search input (debounced)
- Results list with:
  - Name
  - Secondary info (title/department or group type)
  - Select button
- Next button (disabled until selected)

**Step 2: Select Role**
- List of all roles:
  - Role name (bold)
  - Description (gray text)
  - Parent role (badge)
  - Permission count (badge)
  - Select button
- Next button (disabled until selected)

**Step 3: Choose Scope**
- Radio buttons:
  - ⭕ Global (full access to all objects)
  - ⭕ Location (access to specific locations)
  - ⭕ Specific objects (not implemented yet)
- Description text for each option
- Next button (disabled until selected)

**Step 4: Select Locations** (only if scope=location)
- Checkboxes for all locations:
  - Location name
  - Address (gray text)
  - Device count (badge)
- "Select all" / "Deselect all" buttons
- Next button (disabled if no locations selected)

**Step 5: Review & Confirm**
- Summary card:
  - Assignee: Name + type
  - Role: Name + permission count
  - Scope: Global / Location (with names) / Specific objects
  - Notes: Textarea (optional)
- "Assign Role" button (primary)
- "Back" button (secondary)

**Progress Indicator**:
- 5 dots showing current step
- Completed steps: Filled dots (Morning Blue)
- Current step: Outlined dot (Morning Blue)
- Future steps: Gray dots

**Validation**:
- Cannot proceed if required fields missing
- API validation on final submit
- Show error toast on failure
- Close modal on success + invalidate cache

**Keyboard Support**:
- Escape key: Close modal
- Arrow keys: Navigate between options
- Enter: Select option / proceed to next step

### Permission Testing Tool

**Layout**: `src/app/admin/rbac/test/page.tsx`

**Form**:
- User selector (autocomplete, searches people)
- Action dropdown (view, edit, delete, manage_permissions)
- Object type dropdown (all 16 types)
- Object ID input (UUID, optional)
- "Test Permission" button

**Results**:
- Status indicator: ✅ Granted / ❌ Denied
- Reason: Human-readable explanation
- Permission path: Breadcrumb-style trail
  - Example: "Role Assignment → IT Admin → Parent: Admin → device:view"
- Test parameters echo (shows what was tested)

**Example Output**:
```
✅ GRANTED

Reason: User has 'view' permission on 'device' via role 'IT Admin'

Permission Path:
role_assignment → IT Admin → device:view

Test Parameters:
• User: John Doe (john@example.com)
• Action: view
• Object Type: device
• Object ID: 123e4567-e89b-12d3-a456-426614174000
```

## Permission Resolution Algorithm

### Step-by-Step Process

**1. Check Object Permissions First** (highest priority):
```sql
SELECT * FROM object_permissions
WHERE (person_id = $1 OR group_id IN (
  SELECT group_id FROM group_members WHERE person_id = $1
))
AND action = $2
AND object_type = $3
AND object_id = $4;
```

If found → **GRANT** (exit early)

**2. Check Role Permissions**:
```sql
-- Get all role assignments for user (direct + via groups)
WITH user_roles AS (
  SELECT role_id, scope FROM role_assignments
  WHERE person_id = $1

  UNION

  SELECT ra.role_id, ra.scope FROM role_assignments ra
  JOIN group_members gm ON ra.group_id = gm.group_id
  WHERE gm.person_id = $1
)
-- Get permissions from roles + parent roles
SELECT p.* FROM user_roles ur
JOIN role_hierarchy_permissions rhp ON ur.role_id = rhp.role_id
JOIN permissions p ON rhp.permission_id = p.id
WHERE p.action = $2 AND p.object_type = $3;
```

If location-scoped assignment:
```sql
-- Check if object's location matches assignment
SELECT 1 FROM role_assignment_locations ral
JOIN devices d ON ral.location_id = d.location_id
WHERE ral.assignment_id = $1 AND d.id = $2;
```

If any role grants permission (and location check passes if scoped) → **GRANT**

**3. Default Deny**:
If no object permission and no role permission → **DENY**

### Permission Path Tracking

**For Debugging**: Track how permission was granted

**Object Permission Path**:
```json
["object_permission", "Granted by: Jane Admin"]
```

**Role Permission Path**:
```json
["role_assignment", "IT Admin", "Parent: Admin", "device:view"]
```

**Location-Scoped Path**:
```json
["role_assignment", "Regional Manager", "Scope: NYC Office", "device:view"]
```

**Usage**: Return in `checkPermission()` response for debugging

## Transaction Safety

### Role Assignment Creation

```typescript
const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1. Insert role assignment
  const result = await client.query(
    `INSERT INTO role_assignments (person_id, role_id, scope, granted_by, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [personId, roleId, scope, grantedBy, notes]
  )
  const assignmentId = result.rows[0].id

  // 2. If location scope, insert location associations
  if (scope === 'location' && locationIds.length > 0) {
    await client.query(
      `INSERT INTO role_assignment_locations (assignment_id, location_id)
       SELECT $1, unnest($2::uuid[])`,
      [assignmentId, locationIds]
    )
  }

  await client.query('COMMIT')

  // 3. Invalidate cache (after commit)
  invalidateUserCache(personId)

  return { success: true, id: assignmentId }
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}
```

### Role Assignment Update

```typescript
const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1. Delete old location associations
  await client.query(
    'DELETE FROM role_assignment_locations WHERE assignment_id = $1',
    [assignmentId]
  )

  // 2. Update assignment
  await client.query(
    `UPDATE role_assignments SET scope = $1, notes = $2, updated_at = NOW()
     WHERE id = $3`,
    [scope, notes, assignmentId]
  )

  // 3. Insert new location associations if needed
  if (scope === 'location' && locationIds.length > 0) {
    await client.query(
      `INSERT INTO role_assignment_locations (assignment_id, location_id)
       SELECT $1, unnest($2::uuid[])`,
      [assignmentId, locationIds]
    )
  }

  await client.query('COMMIT')

  // 4. Invalidate cache
  invalidateUserCache(personId)

  return { success: true }
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}
```

## Usage Examples

### Checking Permission in API Route

```typescript
import { checkPermission } from '@/lib/rbac'
import { getServerSession } from 'next-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // Check permission
  const { granted, reason } = await checkPermission(
    session.user.id,
    'delete',
    'device',
    params.id
  )

  if (!granted) {
    return NextResponse.json(
      { success: false, message: 'Permission denied', reason },
      { status: 403 }
    )
  }

  // Proceed with deletion
  await query('DELETE FROM devices WHERE id = $1', [params.id])

  return NextResponse.json({ success: true })
}
```

### Creating Role with Parent

```typescript
const response = await fetch('/api/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role_name: 'Senior IT Admin',
    description: 'IT Admin with additional permissions',
    parent_role_id: itAdminRoleId, // Inherits all IT Admin permissions
    is_system_role: false
  })
})

const { data: newRole } = await response.json()
// newRole inherits all permissions from IT Admin role
```

### Assigning Location-Scoped Role

```typescript
const response = await fetch('/api/role-assignments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    person_id: userId,
    role_id: helpDeskRoleId,
    scope: 'location',
    location_ids: [nycLocationId, laLocationId],
    notes: 'Regional help desk tech'
  })
})

// User now has Help Desk permissions scoped to NYC and LA locations
// Can view/edit devices only in those locations
```

### Granting Object Permission

```typescript
const response = await fetch('/api/object-permissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    person_id: userId,
    action: 'edit',
    object_type: 'device',
    object_id: sensitiveDeviceId,
    granted_by: adminUserId
  })
})

// User now has edit permission on this specific device
// Overrides any role permissions (highest priority)
```

### Testing Permission

```typescript
const response = await fetch('/api/rbac/test-permission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    action: 'delete',
    object_type: 'device',
    object_id: deviceId
  })
})

const result = await response.json()
console.log(result.granted)  // true/false
console.log(result.reason)   // "Granted via role 'IT Admin'"
console.log(result.path)     // ["role_assignment", "IT Admin", "device:delete"]
```

## Future Enhancements (Phase 4)

**Not yet implemented** - deferred to future development:

1. **Role Hierarchy Visualization**
   - Tree diagram showing role inheritance
   - Interactive drag-and-drop to reorganize
   - Library: D3.js or React Flow

2. **Permission Audit Logging**
   - Log to `admin_audit_log` when permissions change
   - Include: Who granted, to whom, which permission, when

3. **Attribute-Based Access Control (ABAC)**
   - Add `condition` JSONB field to permissions
   - Example: `{"department": "Engineering", "clearance_level": ">=3"}`
   - Evaluate conditions at permission check time

4. **Role Templates**
   - Seed data for common roles:
     - IT Admin (full device/network/software access)
     - Help Desk (view all, edit devices/people)
     - Viewer (read-only access)
     - Manager (view reports, no edit)
     - Contractor (limited temporary access)
   - One-click role creation from template

5. **Permission Groups**
   - Bundle related permissions together
   - Example: "Device Management" = device:view + device:edit + device:delete
   - Grant permission group instead of individual permissions

6. **Edit Assignment UI**
   - Currently: Revoke old + create new assignment workflow
   - Future: In-place editing with PATCH endpoint

7. **Playwright E2E Tests**
   - Test full RBAC workflows:
     - Create role → assign permissions → assign to user → test access
     - Location-scoped assignment → verify access restrictions
     - Object permission override → verify takes precedence
     - Circular hierarchy prevention → verify error handling

8. **Performance Optimizations**
   - Redis cache instead of in-memory (for multi-instance deployments)
   - Materialized view for `role_hierarchy_permissions`
   - Denormalized permissions table for faster lookups
