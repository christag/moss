# Admin Settings Panel Architecture

This document provides detailed specifications for the M.O.S.S. admin panel. For high-level overview, see [CLAUDE.md](../CLAUDE.md). For RBAC-specific admin features, see [rbac-implementation.md](rbac-implementation.md).

## Overview

The admin settings panel (`/admin`) provides centralized system configuration accessible only to users with `admin` or `super_admin` roles. The panel uses a sidebar navigation pattern with 11 configuration sections.

## Access Control

### Middleware Protection

**Implementation**: `src/middleware.ts`

All `/admin/*` routes require authentication:
- Redirects unauthenticated users to `/login?callbackUrl=/admin`
- Role checking occurs in page components (Edge Runtime limitation prevents database queries in middleware)

### Admin Auth Helpers

**Implementation**: `src/lib/adminAuth.ts`

**Functions**:
- `requireAdmin()` - Redirects non-admin users to homepage, returns session
- `requireSuperAdmin()` - Restricts to super_admin only, returns session
- `isAdmin()` - Non-redirecting role check, returns boolean
- `isSuperAdmin()` - Non-redirecting role check, returns boolean
- `logAdminAction(params)` - Logs all admin actions to audit log
- `canAccessAdminSection(userId, section)` - Section-level permission checking

**Usage Example**:
```typescript
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  // Proceed with admin operation
}
```

### Permission Levels

**Regular Admins** can access:
- Branding
- Storage
- Integrations
- Fields
- Import/Export
- Audit Logs
- Notifications
- Backup

**Super Admins** have full access including:
- Authentication settings
- RBAC configuration (Roles, Permissions, Assignments)

## Database Tables

### system_settings

**Purpose**: Key-value configuration store

**Schema**:
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Categories**: `branding`, `authentication`, `storage`, `notifications`, `general`

**Example Keys**:
- `branding.site_name` → `{"value": "M.O.S.S."}`
- `branding.logo_url` → `{"value": "/uploads/logo.png"}`
- `auth.mfa_required` → `{"value": false}`
- `auth.session_timeout` → `{"value": 3600}`
- `storage.backend` → `{"value": "local"}`
- `storage.s3_bucket` → `{"value": "moss-uploads"}`

**Default Values**: Seeded on migration

### integrations

**Purpose**: External system connections

**Schema**:
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  provider TEXT,
  config JSONB NOT NULL,
  sync_frequency TEXT DEFAULT 'manual',
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Integration Types**:
- `idp` - Identity Provider (Okta, Azure AD)
- `mdm` - Mobile Device Management (Jamf, Intune)
- `rmm` - Remote Monitoring (Datadog, New Relic)
- `cloud_provider` - Cloud platforms (AWS, Azure, GCP)
- `ticketing` - Ticket systems (Jira, ServiceNow)
- `monitoring` - Monitoring tools (Prometheus, Grafana)
- `backup` - Backup systems (Veeam, Acronis)

**Common Providers**: Okta, Azure AD, Jamf, Intune, AWS, Azure, GCP, Jira, Datadog

**Config Field**: JSONB stores provider-specific connection details (encrypted)

**Sync Settings**:
- `sync_frequency`: manual, hourly, daily, weekly
- `sync_enabled`: Boolean toggle
- `last_sync_at`: Timestamp of last successful sync
- `last_sync_status`: success, failed, in_progress

### integration_sync_logs

**Purpose**: Audit trail of sync operations

**Schema**:
```sql
CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values**: `in_progress`, `success`, `failed`, `partial_success`

**Usage**: Troubleshooting integration issues, tracking sync history

### custom_fields

**Purpose**: Extend object types with custom fields

**Schema**:
```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(object_type, field_name)
);
```

**Field Types**:
- `text` - Single-line text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `date` - Date picker
- `boolean` - Checkbox
- `select` - Single-select dropdown
- `multi_select` - Multi-select dropdown
- `url` - URL input with validation
- `email` - Email input with validation

**Object Types**: device, person, location, room, network, software, saas_service, software_license, document, contract, company

**Field Options** (JSONB):
- For `select`/`multi_select`: `{"options": ["Option 1", "Option 2"]}`
- For `text`: `{"max_length": 255, "pattern": "regex"}`
- For `number`: `{"min": 0, "max": 100, "step": 1}`

**Display Order**: Controls field position in forms (lower numbers first)

### admin_audit_log

**Purpose**: Complete audit trail of admin actions

**Schema**:
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES people(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  target_object_type TEXT,
  target_object_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Actions**: `setting_changed`, `integration_created`, `integration_synced`, `role_created`, `permission_granted`, `user_created`, `import_completed`

**Categories**: `branding`, `authentication`, `storage`, `integrations`, `fields`, `rbac`, `import_export`, `backup`, `notifications`

**Details Field** (JSONB): Stores before/after values for changes
```json
{
  "setting": "branding.site_name",
  "old_value": "IT Glue",
  "new_value": "M.O.S.S.",
  "affected_users": 45
}
```

**Queryable by**: user, action, category, date range

## Admin Panel Sections

### 1. Overview (`/admin`)

**Purpose**: Dashboard with quick action cards

**Layout**:
- Welcome message with current user name and role
- System status cards:
  - Last backup: Date + status indicator
  - Active integrations: Count + "View all" link
  - Pending actions: Count of warnings/alerts
  - Storage usage: Progress bar + percentage
- Quick action cards (icon + label):
  - Configure branding
  - Manage users
  - View audit log
  - Run backup
- Current session information:
  - Login time
  - IP address
  - Last activity

### 2. Branding (`/admin/branding`)

**Purpose**: Site customization

**Form Fields**:
- Site name (text input)
- Logo upload (file input, accepts PNG/JPG/SVG)
- Favicon upload (file input, accepts ICO/PNG)
- Primary color picker (hex color input)
- Background color picker
- Text color picker
- Accent color picker

**Features**:
- Live preview panel (shows navbar with new branding)
- Upload to configured storage backend (local/S3)
- Reset to defaults button
- Logo dimensions: 200x50px recommended
- Favicon: 32x32px or 16x16px

**API Endpoints**:
- `PUT /api/admin/branding` - Update branding settings
- `POST /api/admin/branding/logo` - Upload logo file

### 3. Storage (`/admin/storage`)

**Purpose**: Configure file storage backend

**Backend Options**:
1. **Local Filesystem**
   - Path: `/var/moss/uploads`
   - Permissions check
   - Disk space monitoring

2. **NFS**
   - Server hostname
   - Export path
   - Mount options
   - Connection test button

3. **SMB/CIFS**
   - Server hostname
   - Share name
   - Username/password (encrypted)
   - Domain (optional)
   - Connection test button

4. **S3-Compatible** (AWS S3, Cloudflare R2, MinIO)
   - Endpoint URL
   - Access key ID
   - Secret access key (masked)
   - Bucket name
   - Region
   - Connection test button

**Features**:
- Backend selection radio buttons
- Conditional form fields based on selection
- Test connection button (validates credentials)
- Storage usage statistics
- Migration tool (move files between backends)

**API Endpoints**:
- `PUT /api/admin/storage` - Update storage settings
- `POST /api/admin/storage/test` - Test connection

### 4. Authentication (`/admin/authentication`) [Super Admin Only]

**Purpose**: Configure authentication backend

**Backend Options**:
1. **Local Database**
   - Password policy settings:
     - Minimum length (8-32 characters)
     - Require uppercase (checkbox)
     - Require lowercase (checkbox)
     - Require numbers (checkbox)
     - Require special characters (checkbox)
   - Password expiration (days, 0 = never)
   - Account lockout threshold (failed attempts)
   - Account lockout duration (minutes)

2. **LDAP**
   - Server URL (ldap:// or ldaps://)
   - Bind DN
   - Bind password (encrypted)
   - Base DN
   - User filter
   - Group filter
   - SSL/TLS options
   - Connection test button

3. **SAML/SSO**
   - IdP metadata URL or XML
   - Entity ID
   - SSO service URL
   - Certificate (PEM format, textarea)
   - Attribute mappings (email, name, groups)
   - Auto-provision users (checkbox)
   - Default role for new users (dropdown)

**MFA Settings** (applies to all backends):
- Enforce MFA (checkbox)
- Allowed MFA methods: TOTP, SMS, Email (checkboxes)
- Grace period for enrollment (days)

**Session Settings**:
- Session timeout (minutes, 0 = never)
- Concurrent sessions allowed (number)
- Remember me duration (days)

**API Endpoints**:
- `PUT /api/admin/authentication` - Update auth settings
- `POST /api/admin/authentication/test-ldap` - Test LDAP connection
- `POST /api/admin/authentication/test-saml` - Validate SAML config

### 5. Integrations (`/admin/integrations`)

**Purpose**: Manage external system connections

**List View**:
- Table columns: Name, Type, Provider, Status, Last Sync, Actions
- Status indicators: Connected (green), Error (red), Disabled (gray)
- Action buttons: Edit, Test, Sync Now, Delete
- "Add Integration" button (top-right)

**Add/Edit Form**:
- Integration name (text input)
- Integration type (dropdown: IDM, MDM, RMM, Cloud Provider, etc.)
- Provider (dropdown, filtered by type):
  - IDM: Okta, Azure AD, Google Workspace, OneLogin
  - MDM: Jamf, Intune, Kandji, Mosyle
  - RMM: Datadog, New Relic, Prometheus
  - Cloud: AWS, Azure, GCP, Cloudflare
- Provider-specific configuration form (dynamic fields):
  - API key/token (masked input)
  - API endpoint URL
  - Tenant ID (for multi-tenant providers)
  - Additional settings (JSONB)
- Sync settings:
  - Enable sync (checkbox)
  - Sync frequency (dropdown: Manual, Hourly, Daily, Weekly)
  - Last sync at (read-only, timestamp)
- Test connection button
- Save button

**Sync Logs Viewer** (expandable section):
- Table: Sync time, Status, Records processed/created/updated/failed, Duration
- Click row → expand to show error details
- Filter by status
- Export logs button

**API Endpoints**:
- `GET /api/admin/integrations` - List all integrations
- `POST /api/admin/integrations` - Create integration
- `PUT /api/admin/integrations/:id` - Update integration
- `DELETE /api/admin/integrations/:id` - Delete integration
- `POST /api/admin/integrations/:id/test` - Test connection
- `POST /api/admin/integrations/:id/sync` - Trigger manual sync
- `GET /api/admin/integrations/:id/logs` - Get sync logs

### 6. Fields (`/admin/fields`)

**Purpose**: Custom field management per object type

**Layout**:
- Object type selector (tabs): Device, Person, Location, etc.
- Table of fields for selected object type:
  - Columns: Field name, Type, Required, Display order, Actions
  - Drag handles for reordering
  - Toggle switch for required
  - Edit/delete buttons
- "Add Custom Field" button (top-right)
- "Edit Dropdown Options" section for built-in select fields

**Add/Edit Custom Field Form**:
- Field name (text input, auto-converts to snake_case)
- Field label (text input, shown in UI)
- Field type (dropdown: text, textarea, number, date, boolean, select, multi_select, url, email)
- Conditional fields:
  - For select/multi_select: Options list (add/remove)
  - For text: Max length, pattern (regex)
  - For number: Min, max, step
- Required (checkbox)
- Display order (number input)
- Help text (textarea, shown below field in forms)

**Edit Built-in Dropdown Options**:
- Select field dropdown (e.g., "Device Type", "Person Type", "Network Type")
- Current options list (editable, add/remove)
- Warning: "Used by X existing records" before deletion
- Save changes button

**Features**:
- Drag-and-drop field ordering
- Field activation/deactivation (soft delete)
- Bulk operations (delete multiple fields)
- Export/import field definitions (JSON)

**API Endpoints**:
- `GET /api/admin/fields?object_type=device` - List fields
- `POST /api/admin/fields` - Create field
- `PUT /api/admin/fields/:id` - Update field
- `DELETE /api/admin/fields/:id` - Delete field (checks usage first)
- `PUT /api/admin/fields/reorder` - Update display order

### 7. RBAC (`/admin/rbac`) [Super Admin Only]

See [rbac-implementation.md](rbac-implementation.md) for complete details.

**Sections**:
- Role Management (`/admin/rbac/roles`)
- Role Assignments (`/admin/rbac/assignments`)
- Permission Testing (`/admin/rbac/test`)

### 8. Import/Export (`/admin/import-export`)

**Purpose**: Bulk data operations

**Import Section**:
- Object type selector (dropdown: Devices, People, Locations, etc.)
- CSV file upload (drag-and-drop area)
- Template download button ("Download CSV template")
- Field mapping interface:
  - Table: CSV column → Object field
  - Dropdown for each CSV column to select target field
  - Preview of first 5 rows
- Validation results:
  - Errors table (row number, field, error message)
  - Warnings table (row number, field, warning)
- Import button (disabled until validation passes)
- Progress bar during import
- Results summary:
  - Records processed
  - Records created
  - Records updated
  - Records failed (with details)

**Export Section**:
- Object type selector
- Field selection (checkboxes, "Select all" / "Deselect all")
- Filter options (same as list view filters)
- Export format: CSV, Excel, JSON (radio buttons)
- Export button
- Recent exports list:
  - Timestamp, Object type, Record count, Download link
  - Auto-delete after 7 days

**Bulk Operation Status Tracking**:
- Background job system for large imports
- Status: Queued, Processing, Completed, Failed
- Email notification on completion
- Downloadable error report

**API Endpoints**:
- `POST /api/admin/import` - Upload and validate CSV
- `POST /api/admin/import/execute` - Execute import after validation
- `POST /api/admin/export` - Generate export file
- `GET /api/admin/exports/:id` - Download export file

### 9. Audit Logs (`/admin/audit-logs`)

**Purpose**: View all admin actions

**Layout**:
- Filter bar:
  - User selector (autocomplete)
  - Action dropdown (setting_changed, integration_created, etc.)
  - Category dropdown (branding, authentication, storage, etc.)
  - Date range picker
  - "Apply filters" button
- Table:
  - Columns: Timestamp, User, Action, Category, Target, IP Address, Actions
  - Expandable rows (click to view before/after details)
  - JSON diff viewer for changes
- Export button (CSV with current filters)

**JSON Diff Viewer**:
- Side-by-side comparison
- Highlight changed fields (yellow background)
- Show added fields (green background)
- Show removed fields (red background)

**API Endpoints**:
- `GET /api/admin/audit-logs` - List logs with filters
- `GET /api/admin/audit-logs/:id` - Get single log entry with details

### 10. Notifications (`/admin/notifications`)

**Purpose**: Configure email notifications

**SMTP Configuration**:
- SMTP server hostname
- SMTP port (25, 465, 587)
- Encryption: None, SSL/TLS, STARTTLS (radio buttons)
- Username
- Password (masked)
- From address
- From name
- Reply-to address (optional)
- Test email button (sends to current user's email)

**Notification Templates**:
- Template list: Warranty expiration, License expiration, Contract renewal, etc.
- Edit template form:
  - Subject line (text input, supports variables)
  - Body (rich text editor, supports variables)
  - Variables reference: {{device_name}}, {{expiration_date}}, etc.
  - Preview button
- Reset to default button

**User Notification Preferences** (global defaults):
- Email notifications enabled (checkbox)
- Notification categories (checkboxes):
  - Expiring warranties
  - Expiring licenses
  - Contract renewals
  - System alerts
  - Integration errors
- Notification frequency: Real-time, Daily digest, Weekly digest

**API Endpoints**:
- `PUT /api/admin/notifications/smtp` - Update SMTP settings
- `POST /api/admin/notifications/test` - Send test email
- `GET /api/admin/notifications/templates` - List templates
- `PUT /api/admin/notifications/templates/:id` - Update template

### 11. Backup (`/admin/backup`)

**Purpose**: Database backup and restore

**Backup Section**:
- Manual backup button ("Backup Now")
- Scheduled backup configuration:
  - Enable scheduled backups (checkbox)
  - Frequency (dropdown: Daily, Weekly, Monthly)
  - Time of day (time picker)
  - Day of week (for weekly)
  - Day of month (for monthly)
  - Retention policy (number of backups to keep)
- Backup location:
  - Local filesystem path
  - Or: Use configured storage backend (checkbox)
- Compression (checkbox, gzip)

**Backup List**:
- Table: Timestamp, Size, Type (manual/scheduled), Status, Actions
- Status: In progress, Completed, Failed
- Actions: Download, Restore, Delete
- Auto-delete old backups based on retention policy

**Restore Section**:
- Upload backup file (or select from list)
- Restore options:
  - Full restore (replaces all data)
  - Selective restore (choose tables)
- Confirmation dialog with warnings
- Progress bar during restore
- Restore log (shows SQL commands executed)

**API Endpoints**:
- `POST /api/admin/backup` - Trigger manual backup
- `GET /api/admin/backups` - List available backups
- `GET /api/admin/backups/:id/download` - Download backup file
- `POST /api/admin/backups/:id/restore` - Restore from backup
- `DELETE /api/admin/backups/:id` - Delete backup

## Admin Layout Pattern

### Layout Component

**Implementation**: `src/app/admin/layout.tsx`

**Sidebar**:
- Dark background (Brew Black #231F20)
- Sticky positioning (scrolls with content)
- Logo at top (links to main app)
- Navigation items:
  - Icon (left, 24x24px)
  - Label (primary text)
  - Description (secondary text, smaller)
  - Badge for restricted sections ("Super Admin", orange)
- Active state:
  - Background: Morning Blue (#1C7FF2)
  - Bold text
- Hover state (non-active):
  - Background: Brew Black with 10% white overlay
  - Cursor: pointer
- Divider line between sections

**Main Content Area**:
- Off White background (#FAF9F5)
- Max width: 1200px (centered)
- Padding: 48px (desktop), 24px (mobile)
- Page title (H1)
- Breadcrumbs (Admin > Section Name)
- Form/content area with white cards

**Page Structure**:
```
┌─────────────────────────────────────────┐
│ [Logo] M.O.S.S.               [User ▼]  │ ← Global header
├──────────┬──────────────────────────────┤
│ Sidebar  │ Main Content                 │
│          │                              │
│ Overview │ ┌──────────────────────────┐ │
│ Branding │ │ Admin > Branding         │ │ ← Breadcrumbs
│ Storage  │ │                          │ │
│ Auth *   │ │ Configure Branding       │ │ ← Page title (H1)
│ Integr.  │ │                          │ │
│ Fields   │ │ [Form fields...]         │ │
│ RBAC *   │ │                          │ │
│ Import   │ │ [Save] [Cancel]          │ │ ← Action buttons
│ Audit    │ └──────────────────────────┘ │
│ Notify   │                              │
│ Backup   │                              │
└──────────┴──────────────────────────────┘
```

**Responsive Behavior**:
- Mobile: Sidebar collapses to hamburger menu
- Tablet: Sidebar width reduces to icons only (with tooltip labels)
- Desktop: Full sidebar with labels

## Storage Abstraction Layer

**Location**: `src/lib/storage/` (to be implemented)

### Interface

```typescript
interface StorageAdapter {
  upload(file: File, path: string): Promise<string> // Returns URL
  download(path: string): Promise<Blob>
  delete(path: string): Promise<void>
  exists(path: string): Promise<boolean>
  list(prefix: string): Promise<string[]>
  getMetadata(path: string): Promise<FileMetadata>
}

interface FileMetadata {
  size: number
  contentType: string
  lastModified: Date
  etag?: string
}
```

### Adapter Implementations

**LocalStorageAdapter**:
- Stores files in local filesystem (e.g., `/var/moss/uploads`)
- Uses Node.js `fs` module
- Serves files via `/uploads/*` route
- Permissions: Ensure write access to directory

**NetworkStorageAdapter**:
- Supports NFS and SMB/CIFS
- Uses `mount` command to mount share
- Treats mounted directory as local filesystem
- Automatic remount on failure

**S3StorageAdapter**:
- Compatible with AWS S3, Cloudflare R2, MinIO
- Uses AWS SDK v3
- Supports presigned URLs for private files
- Automatic multipart upload for large files

### Configuration

Read from `system_settings` table with `storage.*` keys:
- `storage.backend` - "local", "nfs", "smb", or "s3"
- `storage.local_path` - For local backend
- `storage.nfs_server`, `storage.nfs_path` - For NFS
- `storage.smb_server`, `storage.smb_share`, `storage.smb_username`, `storage.smb_password` - For SMB
- `storage.s3_endpoint`, `storage.s3_bucket`, `storage.s3_region`, `storage.s3_access_key`, `storage.s3_secret_key` - For S3

### Usage Example

```typescript
import { getStorageAdapter } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  const storage = await getStorageAdapter()
  const url = await storage.upload(file, `logos/${Date.now()}-${file.name}`)

  return NextResponse.json({ success: true, url })
}
```

## API Route Patterns

### Standard Admin API Pattern

All admin API routes must:
1. Check authentication with `requireAdmin()` or `requireSuperAdmin()`
2. Validate request body with Zod schemas (from `src/lib/schemas/admin.ts`)
3. Log actions to `admin_audit_log` table via `logAdminAction()`
4. Return consistent response format

### Example Admin API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/adminAuth'
import { BrandingSettingsSchema } from '@/lib/schemas/admin'
import { query } from '@/lib/db'

export async function PUT(request: NextRequest) {
  // 1. Require admin role
  const session = await requireAdmin()

  // 2. Parse and validate request
  const body = await request.json()
  const validated = BrandingSettingsSchema.parse(body)

  // 3. Perform update
  await query(
    `INSERT INTO system_settings (setting_key, setting_value, category)
     VALUES ('branding.site_name', $1, 'branding')
     ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1`,
    [JSON.stringify({ value: validated.site_name })]
  )

  // 4. Log action
  await logAdminAction({
    user_id: session.user.id,
    action: 'setting_changed',
    category: 'branding',
    details: {
      setting: 'site_name',
      old_value: 'IT Glue',
      new_value: validated.site_name
    },
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
  })

  // 5. Return response
  return NextResponse.json({
    success: true,
    message: 'Branding settings updated successfully'
  })
}
```

### Response Format

All admin API routes return:
```typescript
{
  success: boolean
  data?: unknown        // Optional, response data
  message: string       // User-friendly message
  error?: string        // Optional, error message
}
```

### Error Handling

```typescript
try {
  // ... admin operation
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, message: 'Validation error', error: error.message },
      { status: 400 }
    )
  }

  // Log error
  console.error('Admin operation failed:', error)

  return NextResponse.json(
    { success: false, message: 'Operation failed', error: error.message },
    { status: 500 }
  )
}
```

## Integration Sync Workflow

### Sync Process

1. **User triggers sync** (manual button or scheduled job)
2. **Create sync log entry**:
   ```sql
   INSERT INTO integration_sync_logs (integration_id, status, sync_started_at)
   VALUES ($1, 'in_progress', NOW())
   RETURNING id;
   ```
3. **Fetch data from external system** via integration config:
   - Use API credentials from `integrations.config` (decrypt first)
   - Handle pagination if needed
   - Respect rate limits
4. **Transform data to M.O.S.S. format**:
   - Map external fields to internal schema
   - Validate data with Zod schemas
   - Handle missing/invalid data gracefully
5. **Upsert records** (create new, update existing):
   - Use `ON CONFLICT ... DO UPDATE` for idempotency
   - Track counts: processed, created, updated, failed
6. **Update sync log** with results:
   ```sql
   UPDATE integration_sync_logs SET
     status = $1,
     sync_completed_at = NOW(),
     records_processed = $2,
     records_created = $3,
     records_updated = $4,
     records_failed = $5,
     error_message = $6
   WHERE id = $7;
   ```
7. **Update integration** last sync status:
   ```sql
   UPDATE integrations SET
     last_sync_at = NOW(),
     last_sync_status = $1
   WHERE id = $2;
   ```

### Error Handling

**Partial Sync Failures**:
- Record error but continue processing remaining records
- Include failed record IDs in `sync_details` JSONB
- Set status to `partial_success`

**Complete Sync Failures**:
- Rollback database changes (use transaction)
- Set status to `failed`
- Store full error message and stack trace
- Send notification to admins

**Example**:
```typescript
const client = await db.getClient()
try {
  await client.query('BEGIN')

  // ... sync operations

  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')

  await logSyncError(integration.id, error)

  throw error
} finally {
  client.release()
}
```

## Security Considerations

### Sensitive Data Encryption

**API Keys and Passwords**:
- Encrypt before storing in `integrations.config` JSONB field
- Use environment variable for encryption key: `ENCRYPTION_KEY`
- Algorithm: AES-256-GCM
- Implementation: `src/lib/encryption.ts`

**Example**:
```typescript
import { encrypt, decrypt } from '@/lib/encryption'

// Before storing
const encrypted = encrypt(apiKey)
await query(
  'UPDATE integrations SET config = config || $1 WHERE id = $2',
  [JSON.stringify({ api_key: encrypted }), integrationId]
)

// Before using
const config = integration.config
const apiKey = decrypt(config.api_key)
```

**Never expose encrypted values** in API responses:
```typescript
// Bad
return { config: integration.config }

// Good
return {
  config: {
    ...integration.config,
    api_key: integration.config.api_key ? '***' : undefined
  }
}
```

**Mask sensitive fields in UI**:
- Show only last 4 characters: `****5678`
- Use password input type
- "Show/hide" toggle button

### Access Control

**Route Protection**:
- All admin routes use `requireAdmin()` or `requireSuperAdmin()`
- Section-level permissions via `canAccessAdminSection()`
- Object-level permissions for RBAC operations

**UI Protection**:
- Hide restricted sections for non-admins
- Show "Super Admin Only" badge on restricted items
- Client-side checks for UX (server-side is authoritative)

**Audit Logging**:
- Log ALL administrative actions to `admin_audit_log`
- Include: user, timestamp, action, target, before/after values, IP address
- Never log sensitive data (passwords, API keys)
- Retention: 1 year minimum

### Input Validation

**Server-Side Validation** (always required):
- Use Zod schemas for all request bodies
- Validate file uploads: type, size, malware scanning
- Sanitize user input (escape HTML, SQL injection prevention)

**SQL Injection Prevention**:
- Use parameterized queries ALWAYS
- Never concatenate user input into SQL strings
- Use ORM or query builder where possible

**XSS Prevention**:
- React's built-in escaping (JSX)
- Sanitize rich text editor output (DOMPurify)
- Content-Security-Policy headers

**File Upload Validation**:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { success: false, message: 'File too large' },
    { status: 400 }
  )
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json(
    { success: false, message: 'Invalid file type' },
    { status: 400 }
  )
}
```

## Testing Admin Panel

### Manual Testing with Playwright

See [CLAUDE.md](../CLAUDE.md) for Playwright MCP tools usage.

**Test Scenarios**:
1. **Role-based access**:
   - Admin can access all sections except RBAC/Authentication
   - Super admin can access all sections
   - Regular user redirected to login

2. **Settings persistence**:
   - Update branding settings → reload page → verify changes persist
   - Upload logo → verify appears in navbar
   - Change storage backend → verify new uploads use new backend

3. **Integration testing**:
   - Add integration → test connection → verify success/failure handling
   - Configure sync → trigger manual sync → verify logs appear
   - Delete integration → verify cascade deletes sync logs

4. **Import/Export**:
   - Upload CSV with valid data → verify preview correct
   - Upload CSV with errors → verify validation messages
   - Execute import → verify records created
   - Export with filters → verify correct records exported

5. **File uploads**:
   - Upload logo (valid file) → verify success
   - Upload logo (invalid type) → verify error message
   - Upload logo (too large) → verify error message

6. **Audit logging**:
   - Perform various admin actions → verify logged
   - Filter audit logs → verify correct results
   - Export audit logs → verify CSV contains correct data

### Test User Roles

**Create test users** with different roles:
```sql
INSERT INTO people (email, role) VALUES
  ('admin@example.com', 'admin'),
  ('superadmin@example.com', 'super_admin'),
  ('user@example.com', 'user');
```

**Test matrix**:
| Section | User | Admin | Super Admin |
|---------|------|-------|-------------|
| Overview | ❌ | ✅ | ✅ |
| Branding | ❌ | ✅ | ✅ |
| Storage | ❌ | ✅ | ✅ |
| Authentication | ❌ | ❌ | ✅ |
| Integrations | ❌ | ✅ | ✅ |
| Fields | ❌ | ✅ | ✅ |
| RBAC | ❌ | ❌ | ✅ |
| Import/Export | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ |
| Backup | ❌ | ✅ | ✅ |

**Verification**:
- ✅ sections should load successfully
- ❌ sections should redirect or show access denied message

### Playwright Test Example

```typescript
test('admin can access branding settings', async ({ page }) => {
  // Login as admin
  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to admin branding
  await page.goto('/admin/branding')

  // Verify page loaded
  await expect(page.locator('h1')).toContainText('Configure Branding')

  // Update site name
  await page.fill('input[name="site_name"]', 'My Custom Name')
  await page.click('button:has-text("Save")')

  // Verify success message
  await expect(page.locator('.toast')).toContainText('Settings updated')

  // Take screenshot
  await page.screenshot({ path: 'admin-branding.png' })
})
```
