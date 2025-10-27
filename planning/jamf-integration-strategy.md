# JAMF Pro Integration Strategy

## Integration Philosophy

M.O.S.S. and JAMF should **complement each other**, not duplicate data. The principle: **sync identity and inventory basics, reference everything else**.

### Source of Truth Responsibilities

**M.O.S.S. owns:**
- Asset ownership and assignments
- Network topology and connectivity (IPs, VLANs, switch ports)
- Physical location tracking (company → location → room)
- Relationships between assets (devices, people, services)
- Documentation, contracts, warranties
- Custom fields and workflows
- Non-MDM managed devices (servers, network equipment, AV equipment)

**JAMF owns:**
- MDM enrollment and compliance status
- Configuration profiles and policies
- Software deployment state (what's being pushed, install status)
- Security posture (FileVault, Gatekeeper, XProtect)
- Real-time health metrics (battery, disk space, uptime)
- Smart group membership (dynamic rule-based groups)
- Extension attributes (JAMF-specific custom data)

## Data Sync Strategy

### ✅ SYNC TO M.O.S.S. (Write)

These fields create/update records in M.O.S.S. to maintain an accurate inventory:

#### **Devices (from JAMF Computers)**

| JAMF Field | M.O.S.S. Field | Section | Reason |
|------------|----------------|---------|--------|
| `hardware.serialNumber` | `serial_number` | HARDWARE | Primary identifier for asset tracking |
| `general.name` | `hostname` | GENERAL | Device network identity |
| `hardware.model` | `model` | HARDWARE | Asset specs for inventory |
| `hardware.make` | `manufacturer` | HARDWARE | Asset specs for inventory |
| `operatingSystem.version` | Custom field or notes | OS | For support/compatibility tracking |
| `operatingSystem.build` | Custom field or notes | OS | For support/compatibility tracking |
| `hardware.macAddress` | Create IO object | HARDWARE | Network topology mapping |
| `hardware.altMacAddress` | Create IO object | HARDWARE | For WiFi/Bluetooth interfaces |
| `general.assetTag` | `asset_tag` | GENERAL | Physical asset label matching |
| `general.barcode1` | Custom field | GENERAL | QR code matching |
| `userAndLocation.username` | Link to person | USER_AND_LOCATION | Assignment tracking |
| `userAndLocation.realname` | Link to person | USER_AND_LOCATION | Assignment tracking |
| `userAndLocation.email` | Link to person | USER_AND_LOCATION | Assignment tracking |
| `userAndLocation.room` | Link to room | USER_AND_LOCATION | Physical location |
| `userAndLocation.buildingId` | Link to location | USER_AND_LOCATION | Physical location |

**Device Type Mapping:**
- JAMF computers → M.O.S.S. `device_type` = 'Workstation' or 'Laptop' (based on model)
- JAMF mobile devices → M.O.S.S. `device_type` = 'Mobile Device'

**What NOT to sync:**
- ❌ Configuration profiles (reference only)
- ❌ Installed applications (changes too frequently, JAMF has real-time data)
- ❌ Disk encryption status (changes frequently, JAMF has real-time data)
- ❌ Smart group rules/criteria (JAMF-specific, not applicable to M.O.S.S.)

#### **People (from JAMF Users)**

| JAMF Field | M.O.S.S. Field | Reason |
|------------|----------------|--------|
| `name` | `username` | Login identity |
| `full_name` | `full_name` | Display name |
| `email` | `email_address` | Contact info |
| `phone_number` | `phone_number` | Contact info |
| `position` | `job_title` | Org structure |

**Sync Logic:**
- **If person exists** (match on email or username): Update contact info only
- **If person doesn't exist**: Create new person record
- **Don't overwrite:** Manager relationships, hire date, or other M.O.S.S.-specific fields

#### **Groups (from JAMF Computer Groups)**

| JAMF Field | M.O.S.S. Field | Notes |
|------------|----------------|-------|
| `name` | `name` | Group name |
| `isSmart` | `group_type` | Static → 'custom', Smart → 'jamf_smart' |
| Group members | `group_members` junction | Only for static groups |

**Sync Logic:**
- **Static groups**: Sync membership to M.O.S.S. (allows bulk operations)
- **Smart groups**: Create reference only, don't sync members (too dynamic)
- Prefix all JAMF groups with `[JAMF]` to distinguish from M.O.S.S.-native groups

### 🔗 REFERENCE ONLY (Link, Don't Duplicate)

These should **NOT** be synced to M.O.S.S. Instead, provide deep links to JAMF:

#### **Deep Links to Include**

On each M.O.S.S. object page, add a "View in JAMF" button that links to:

**Devices:**
```
https://{jamf-instance}/computers.html?id={jamf_computer_id}&o=r
```

**People:**
```
https://{jamf-instance}/users.html?id={jamf_user_id}&o=r
```

**Groups:**
```
https://{jamf-instance}/smartComputerGroups.html?id={jamf_group_id}&o=r
```

#### **Data to Reference (Not Sync)**

Display these as **live-fetched** data on M.O.S.S. pages (optional real-time lookup):

- Configuration profiles applied
- Installed applications (show count + "View in JAMF" link)
- Security status (FileVault, Gatekeeper, etc.)
- Last check-in time
- Battery health
- Disk space
- Smart group memberships (show count + "View in JAMF" link)

## UI Integration Points

### Device Detail Page (`/devices/[id]`)

Add a new tab: **"MDM Info"**

```
┌─────────────────────────────────────────────────────┐
│ Overview | Network | IOs | MDM Info | History       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [JAMF Pro] View in JAMF →                          │
│                                                      │
│  Last Check-In: 2 hours ago                         │
│  Enrollment Status: Enrolled                        │
│  MDM Profile: Corporate - Standard                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Security Posture                              │  │
│  │ • FileVault: Enabled ✓                        │  │
│  │ • Gatekeeper: Enabled ✓                       │  │
│  │ • System Integrity Protection: Enabled ✓      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Installed Software                            │  │
│  │ 47 applications managed by JAMF               │  │
│  │ [View Full List in JAMF] →                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Group Memberships                             │  │
│  │ • [JAMF] Marketing Department                 │  │
│  │ • [JAMF] macOS Ventura Devices (Smart)        │  │
│  │ • [JAMF] Adobe Creative Cloud Users           │  │
│  │ [View All Groups in JAMF] →                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Person Detail Page (`/people/[id]`)

Add to the **Relationships Panel** (right sidebar):

```
┌─────────────────────────┐
│ Related Items           │
├─────────────────────────┤
│ Devices (3)             │
│ • MacBook Pro M3        │
│ • iPhone 15 Pro         │
│ • iPad Air              │
│                         │
│ JAMF Profile            │
│ [View in JAMF] →        │
│                         │
│ Groups (5)              │
│ • [JAMF] Marketing      │
│ • [JAMF] Adobe Users    │
│ ...                     │
└─────────────────────────┘
```

### Groups Page (`/groups/[id]`)

For JAMF-synced groups, add banner:

```
┌─────────────────────────────────────────────────────┐
│ ℹ️ This group is synced from JAMF Pro              │
│ Membership is managed in JAMF. [View in JAMF] →    │
│ Last synced: 10 minutes ago                         │
└─────────────────────────────────────────────────────┘
```

## Sync Frequency & Strategy

### Initial Sync (Full Import)
- Run once during setup
- Import all computers, users, and static groups
- Create mappings in `integration_object_mappings`
- Estimated time: 5-10 minutes per 1,000 devices

### Incremental Sync (Scheduled)
- **Default schedule**: Every 6 hours (`0 */6 * * *`)
- **What it does:**
  1. Fetch all computers (or use `lastContactTime` filter for changed devices)
  2. Update existing M.O.S.S. devices based on mappings
  3. Create new devices for new JAMF computers
  4. Mark devices as "deleted in JAMF" if no longer present
  5. Update user assignments based on `userAndLocation` data

### Real-Time Sync (Optional - Future)
- Use JAMF webhooks to trigger immediate syncs on changes
- Webhook events: computer enrollment, computer removal, user assignment change
- Requires JAMF Pro 10.25.0+

## Conflict Resolution

### When M.O.S.S. and JAMF Disagree

**Scenario**: Device serial number exists in both systems with different data

**Resolution Strategy:**

1. **Serial Number**: JAMF wins (hardware truth)
2. **Hostname**: JAMF wins (MDM has latest)
3. **User Assignment**: JAMF wins (MDM knows who's logged in)
4. **Location (Room/Building)**: M.O.S.S. wins (IT manages physical locations)
5. **Asset Tag**: M.O.S.S. wins (IT manages physical labels)
6. **Network Info (IP, VLAN)**: M.O.S.S. wins (network team manages topology)
7. **Warranty/Purchasing**: M.O.S.S. wins (finance/IT manages procurement)

**Conflict Tracking:**
- Store JAMF's last-known state in `integration_object_mappings.external_data`
- If conflict detected, set `sync_status = 'conflict'`
- Surface conflicts in admin UI for manual resolution

## API Endpoints Needed

### Configuration
- `POST /api/integrations/jamf/config` - Save JAMF connection settings
- `GET /api/integrations/jamf/config` - Get current config
- `POST /api/integrations/jamf/test-connection` - Test connection

### Sync Operations
- `POST /api/integrations/jamf/sync` - Trigger full sync
- `POST /api/integrations/jamf/sync-computers` - Sync computers only
- `POST /api/integrations/jamf/sync-users` - Sync users only
- `POST /api/integrations/jamf/sync-groups` - Sync groups only
- `GET /api/integrations/jamf/sync-status` - Get current sync status
- `GET /api/integrations/jamf/sync-history` - Get sync history

### Live Data (Optional)
- `GET /api/integrations/jamf/device/{id}/live` - Fetch real-time device data
- `GET /api/integrations/jamf/device/{id}/apps` - Get installed apps
- `GET /api/integrations/jamf/device/{id}/profiles` - Get configuration profiles

## Database Mapping Examples

### Example 1: MacBook Pro Sync

**JAMF Data:**
```json
{
  "id": 12345,
  "general": {
    "name": "MBA-JSMITH-001",
    "assetTag": "IT-2024-0157"
  },
  "hardware": {
    "serialNumber": "C02XYZ123456",
    "model": "MacBook Pro 16-inch 2023",
    "make": "Apple",
    "macAddress": "A1:B2:C3:D4:E5:F6"
  },
  "userAndLocation": {
    "username": "jsmith",
    "realname": "John Smith",
    "email": "jsmith@company.com",
    "room": "Office 301",
    "buildingId": "Building-A"
  }
}
```

**M.O.S.S. Device Record:**
```sql
INSERT INTO devices (
  hostname,
  serial_number,
  asset_tag,
  model,
  manufacturer,
  device_type,
  location_id,
  room_id,
  assigned_to_person_id,
  notes
) VALUES (
  'MBA-JSMITH-001',
  'C02XYZ123456',
  'IT-2024-0157',
  'MacBook Pro 16-inch 2023',
  'Apple',
  'Laptop',
  (SELECT id FROM locations WHERE name = 'Building-A'),
  (SELECT id FROM rooms WHERE name = 'Office 301'),
  (SELECT id FROM people WHERE email = 'jsmith@company.com'),
  'Synced from JAMF Pro'
);
```

**M.O.S.S. Mapping Record:**
```sql
INSERT INTO integration_object_mappings (
  integration_config_id,
  external_id,
  external_type,
  internal_id,
  internal_type,
  external_data
) VALUES (
  '{jamf-config-uuid}',
  '12345',
  'computer',
  '{device-uuid}',
  'device',
  '{...full JAMF JSON snapshot...}'
);
```

## Edge Cases & Considerations

### 1. **User Not Found in M.O.S.S.**
- **Action**: Create person record automatically
- **Fields**: Populate from JAMF `userAndLocation` data
- **Flag**: Mark as `imported_from_jamf = true` (custom field)

### 2. **Location Not Found in M.O.S.S.**
- **If `create_missing_locations = true`**: Create location/room
- **If `false`**: Leave location blank, log warning

### 3. **Duplicate Serial Numbers**
- **Action**: Use serial number as primary key, update existing device
- **Conflict**: If serial exists in M.O.S.S. but not linked to JAMF, prompt user

### 4. **Device Removed from JAMF**
- **Action**: Don't delete from M.O.S.S. (might be temporarily unenrolled)
- **Flag**: Set `jamf_enrollment_status = 'unenrolled'`
- **Mapping**: Set `sync_status = 'deleted_external'`

### 5. **Mobile Devices (iPhones, iPads)**
- **Sync?**: Optional (configurable in sync settings)
- **Device Type**: Create as `device_type = 'Mobile Device'`
- **Considerations**: Higher churn rate, less useful for IT asset tracking

## Security Considerations

### Credential Storage
- Encrypt JAMF credentials at rest using application-level encryption
- Use environment variable for encryption key (`INTEGRATION_ENCRYPTION_KEY`)
- Never log credentials in sync history

### Access Control
- Only super_admins can configure integrations
- Only admins can trigger manual syncs
- All users can view JAMF links (if they have view permission on device)

### Data Exposure
- Don't sync sensitive fields (MDM commands, personal user data beyond directory info)
- Respect JAMF's privacy settings (e.g., don't sync personal device info)

## Future Enhancements

1. **Bi-directional Sync** - Push asset tags, locations from M.O.S.S. → JAMF
2. **Webhook Support** - Real-time updates via JAMF webhooks
3. **Smart Group Sync** - Periodically refresh smart group membership
4. **Application Inventory** - Sync installed apps for license compliance tracking
5. **Extension Attributes** - Map JAMF extension attributes to M.O.S.S. custom fields
6. **Mobile Device Management** - Full support for iOS/iPadOS devices
7. **Patch Management Integration** - Show available updates from JAMF

## Implementation Checklist

- [x] Database migration for integration tables
- [x] Zod schemas for JAMF API responses
- [x] JAMF API client with authentication
- [ ] Computer sync service
- [ ] User sync service
- [ ] Group sync service
- [ ] Conflict resolution logic
- [ ] API endpoints for sync operations
- [ ] Admin UI for configuration
- [ ] Device detail page "MDM Info" tab
- [ ] "View in JAMF" buttons on all synced objects
- [ ] Sync status monitoring dashboard
- [ ] Error handling and retry logic
- [ ] Sync history with detailed metrics
- [ ] Documentation and user guide
