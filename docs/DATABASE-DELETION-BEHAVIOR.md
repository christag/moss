# Database Deletion Behavior

This document explains how M.O.S.S. handles record deletion and the protective measures in place to prevent accidental data loss.

## Overview

M.O.S.S. uses PostgreSQL foreign key constraints with different deletion policies depending on the relationship type. Understanding these behaviors is essential for administrators managing the system.

## Deletion Policies

### CASCADE DELETE

**What it means**: When a parent record is deleted, all child records are automatically deleted.

**Where it's used**:
- **Companies → Locations**: Deleting a company deletes all its locations
- **Locations → Rooms**: Deleting a location deletes all rooms in that location
- **Devices → IOs**: Deleting a device deletes all its network interfaces/ports
- **Documents/Networks/etc → Junction Tables**: Deleting a document removes all its associations
- **Software Licenses → Person/Group Assignments**: Deleting a license removes all assignments

**Example**:
```
DELETE Company "Acme Corp"
  ↓ CASCADE
  - Location "SF Office" (deleted)
  - Location "NYC Office" (deleted)
    ↓ CASCADE
    - Room "Conference A" (deleted)
    - Room "Server Room" (deleted)
```

**Why**: These are ownership relationships where child records have no meaning without the parent.

### RESTRICT / PROTECT (ON DELETE RESTRICT)

**What it means**: Cannot delete a parent record if it has active children. The database will return an error.

**Where it's used**:
- **People with device assignments**: Cannot delete person who has devices assigned
- **Locations with devices**: Cannot delete location that has active devices
- **Rooms with devices**: Cannot delete room containing devices
- **Groups with members**: Cannot delete group that has members

**Example**:
```
Attempt: DELETE Person "John Doe"
  ✗ ERROR: Cannot delete - person has 3 devices assigned

Solution:
  1. Reassign devices to another person, OR
  2. Mark devices as unassigned, OR
  3. Delete devices first (if appropriate)
  Then retry person deletion
```

**Why**: These are reference relationships where the parent may be referenced elsewhere in the system.

### SET NULL

**What it means**: When a parent record is deleted, child records remain but the foreign key is set to NULL.

**Where it's used**:
- **Device parent relationships**: Deleting a parent device keeps child devices
- **Software → Licenses/Applications**: Deleting software keeps licenses (orphaned)
- **Company references in software**: Deleting a company nullifies software vendor reference

**Example**:
```
DELETE Device "Chassis-01" (parent_device_id)
  ↓ SET NULL
  Device "Line Card 1" → parent_device_id: NULL (orphaned but kept)
  Device "Line Card 2" → parent_device_id: NULL (orphaned but kept)
```

**Why**: Child records may have independent value even without the parent.

## User-Facing Error Messages

When a deletion is blocked by RESTRICT constraints, users see error messages like:

```
409 Conflict
{
  "success": false,
  "error": "Cannot delete: This person has assigned devices",
  "details": "Remove device assignments before deleting person"
}
```

## How to Handle Blocked Deletions

### For People with Assigned Devices

1. Navigate to the person's detail page
2. Go to "Assigned Devices" tab
3. Click "Unassign" for each device, OR reassign to another person
4. Retry deletion

### For Locations with Active Devices

1. Navigate to the location's detail page
2. Go to "Devices" tab
3. Either:
   - Move devices to another location, OR
   - Delete devices individually (if no longer needed)
4. Retry location deletion

### For Groups with Members

1. Navigate to the group's detail page
2. Go to "Members" tab
3. Remove all members from the group
4. Retry group deletion

## Administrative Tools

### Viewing Dependencies

Before deleting a record, administrators can view its dependencies:

**SQL Query Example**:
```sql
-- Check if person can be deleted
SELECT
  (SELECT COUNT(*) FROM devices WHERE assigned_to_id = '...') as assigned_devices,
  (SELECT COUNT(*) FROM group_members WHERE person_id = '...') as group_memberships;
```

### Force Deletion (Use with Caution)

In exceptional circumstances, administrators with database access can override RESTRICT constraints:

```sql
BEGIN;

-- Remove all dependencies first
UPDATE devices SET assigned_to_id = NULL WHERE assigned_to_id = '...';
DELETE FROM group_members WHERE person_id = '...';

-- Now deletion will succeed
DELETE FROM people WHERE id = '...';

COMMIT;
```

⚠️ **WARNING**: Force deletion should only be performed after careful consideration and with proper backups.

## Database Schema Reference

### Tables with CASCADE DELETE
- `locations` → `companies` (ON DELETE CASCADE)
- `rooms` → `locations` (ON DELETE CASCADE)
- `ios` → `devices` (ON DELETE CASCADE)
- `ip_addresses` → `ios` (ON DELETE CASCADE)
- Junction tables → parent records (ON DELETE CASCADE)

### Tables with RESTRICT
- `devices` → `people` (assigned_to_id, prevents deletion)
- `devices` → `locations` (prevents location deletion)
- `devices` → `rooms` (prevents room deletion)

### Tables with SET NULL
- `devices` → `devices` (parent_device_id ON DELETE SET NULL)
- `software_licenses` → `software` (ON DELETE SET NULL)
- `software` → `companies` (ON DELETE SET NULL)

## Best Practices

1. **Always check dependencies before deletion**: Use the detail view tabs to see what's connected
2. **Consider deactivation instead of deletion**: For people and some records, setting `status='inactive'` preserves history
3. **Clean up in order**: Delete leaf nodes before parent nodes (devices → rooms → locations → companies)
4. **Document deletions**: Use audit logs to track why records were deleted
5. **Test in development**: Practice complex deletions in a dev environment first

## Audit Trail

All deletions are logged in the `admin_audit_log` table:
- Who deleted the record
- When it was deleted
- What was deleted (object type + ID)
- IP address of the request

Soft deletes (status changes) are also logged for critical records.
