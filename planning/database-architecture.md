# Database Architecture

This document provides detailed database schema information for M.O.S.S. For high-level architecture overview, see [CLAUDE.md](../CLAUDE.md).

## Database Overview

The system uses PostgreSQL with UUID primary keys throughout. The complete database schema is defined in [dbsetup.sql](../dbsetup.sql).

## Core Object Hierarchy

### Physical Infrastructure

**Hierarchy**: `companies` → `locations` → `rooms` → `devices`

**Devices**:
- Support parent-child relationships via `parent_device_id` (e.g., chassis with line cards)
- Each module can have independent warranty, serial number, and install dates
- Device types: servers, switches, routers, computers, mobile devices, broadcast equipment, UPS/PDU
- Status tracking: active, inactive, retired, repair, storage

### Network Infrastructure

**Networks**:
- Define VLANs and subnets with CIDR notation
- Network types: LAN, WAN, DMZ, guest, management, storage, broadcast
- Track DHCP configuration, gateway, DNS servers

**IOs (Interfaces/Ports)**:
- Universal connectivity object supporting ALL connection types:
  - Network: ethernet, fiber, wifi
  - Broadcast: SDI, HDMI, XLR, coax
  - Power: AC/DC input/output, PoE
  - Infrastructure: patch panel ports
- `ios.connected_to_io_id` creates physical topology (IO-to-IO relationships)

**VLAN Configuration**:
- `ios.native_network_id` → untagged/native VLAN
- `io_tagged_networks` junction table → trunk VLANs (many-to-many)
- `ios.trunk_mode`: access, trunk, hybrid, n/a

**IP Addresses**:
- IPv4 and IPv6 support
- Types: static, DHCP, reserved, floating
- Associated with IOs via `io_id`
- DNS name tracking

### People & Access

**People**:
- Represents all individuals: employees, contractors, vendor contacts
- Types: employee, contractor, vendor_contact, service_account
- `people.manager_id` creates organizational hierarchy
- Assignment to locations, companies, devices

**Groups**:
- Types: active_directory, okta, jamf_smart_group, custom
- `group_members` junction table links people to groups
- Used for application deployment and SaaS access

### Software & Services

**Software**:
- Product catalog (vendor-agnostic)
- Publisher/vendor association
- Category classification

**SaaS Services**:
- Specific service instances (prod, staging, dev environments)
- SSO configuration tracking (SAML, OIDC, SCIM)
- `saas_service_integrations` → service-to-service relationships (e.g., Slack → Jira)
- Business owner and technical contact assignment

**Installed Applications**:
- Deployed software with version tracking
- Deployment method: manual, mdm, gpo, package_manager
- `device_installed_applications` → direct device assignments
- `group_installed_applications` → group-based deployments

**Software Licenses**:
- License types: perpetual, subscription, volume, concurrent, site, named_user
- Seat count and utilization tracking
- Junction tables link licenses to:
  - `license_saas_services`
  - `license_installed_applications`
  - `person_licenses`

### Documentation

**Documents**:
- Internal documentation (policies, runbooks, diagrams)
- Rich text/Markdown content
- Document types: policy, procedure, runbook, diagram, sop, network_diagram
- Multiple junction tables associate documents with:
  - `document_devices`
  - `document_networks`
  - `document_saas_services`
  - `document_locations`
  - `document_rooms`

**External Documents**:
- Links to external systems (password vaults, tickets, wikis)
- URL-based references with type classification
- Same multi-object association pattern as documents

**Contracts**:
- Vendor agreements with start/end dates
- Auto-renewal tracking with notice periods
- Cost and billing frequency
- Association with software, services, devices

### RBAC (Enhanced - Implemented 2025-10-12)

**Roles**:
- System and custom role definitions
- `parent_role_id` enables hierarchical inheritance
- `is_system_role` protects built-in roles from deletion

**Permissions**:
- Granular object-type and action permissions
- Actions: view, edit, delete, manage_permissions
- Object types cover all 16 core entities

**Role Assignments**:
- Assign roles to people or groups
- Scope options: global, location, specific_objects
- `role_assignment_locations` junction table for location-scoped assignments
- `granted_by` tracks who assigned the role

**Object Permissions**:
- Object-level overrides for specific items
- Highest priority in permission resolution
- `granted_by` tracks who granted permission

**Helper Functions**:
- `check_role_hierarchy_cycle(role_id, new_parent_id)` - Prevents circular hierarchies
- Returns boolean, uses recursive CTE

**Views**:
- `role_hierarchy_permissions` - Shows all permissions including inherited
- Joins roles with recursive hierarchy CTE + role_permissions table

## Key Relationship Patterns

### Modular Equipment
- Parent device (chassis): `parent_device_id` is NULL
- Child devices (line cards): `parent_device_id` references parent UUID
- Each module has independent:
  - `serial_number`
  - `warranty_expiration`
  - `install_date`
  - `model`, `manufacturer`

**Use Case**: Cisco 9500 chassis with multiple line cards, each with separate warranty

### Physical Topology
- `ios.connected_to_io_id` chains IOs together
- Example chain: Server NIC → Switch Port 1 → Switch Uplink → Router Port 1
- Enables automated topology diagram generation
- Tracks media type for each connection (copper, fiber, wireless)

### Power Topology
- UPS/PDU outputs: `interface_type='power_output'`
- Device PSUs: `interface_type='power_input'`
- Connect via `ios.connected_to_io_id` to map power dependencies
- Track voltage, amperage, wattage, connector types
- Enables power redundancy visualization

**Use Case**: Map which devices are on which UPS, identify single-PSU risks

### Network Trunk Ports
- Combine `ios.native_network_id` + `io_tagged_networks` for complete trunk configuration
- **Access ports**: Set `native_network_id` only, `trunk_mode='access'`
- **Trunk ports**: Set `native_network_id` + add entries to `io_tagged_networks`, `trunk_mode='trunk'`
- **Hybrid ports**: Both native and tagged VLANs, `trunk_mode='hybrid'`

**Example**: Switch port configured as trunk with VLAN 100 native, VLANs 200-210 tagged

### Service Integration
- `saas_service_integrations` links services in integration_type relationships
- Types: sso_provider, scim_provider, data_source, webhook, api_integration
- Example: Okta (SSO provider) → Slack, Jira, GitHub (targets)
- Tracks integration status and configuration details

### Group-Based Deployments
- Applications deployed to groups via `group_installed_applications`
- SaaS access granted via `group_saas_services`
- People inherit access through `group_members`
- Also supports direct person-to-service assignments via `person_saas_services`

**Use Case**: Deploy Adobe Creative Cloud to "Designers" AD group via Jamf

### Multi-Object Documentation
- Documents can link to multiple object types simultaneously
- Use appropriate junction tables for each relationship type
- External documents support same multi-object associations
- Enables "show all docs for this device" queries

## Database Patterns

### Primary Keys
- All tables use UUID primary keys: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Benefits:
  - No central sequence coordination needed
  - Distributed system ready
  - Non-guessable IDs for security
  - Merge-friendly for imports

### Audit Fields
- Every table includes:
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
- Automatic `updated_at` updates via triggers
- Pattern: `CREATE TRIGGER update_[table]_updated_at BEFORE UPDATE ON [table] FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`

### Soft Deletes
- Use `status` fields where appropriate instead of hard deletes
- Device status: active, inactive, retired, repair, storage
- Person status: active, inactive, terminated
- Preserves audit trail and relationships

### Foreign Keys
- Enforce referential integrity with appropriate behaviors:
  - `ON DELETE CASCADE` - When parent deleted, delete children (e.g., device → IOs)
  - `ON DELETE SET NULL` - When parent deleted, null the reference (e.g., person → manager)
  - `ON DELETE RESTRICT` - Prevent deletion if references exist (e.g., location with devices)
- Always indexed for query performance

### Junction Tables
- Many-to-many relationships use junction tables
- Naming convention: `[table1]_[table2]` (alphabetical order)
- Composite primary keys on both foreign key columns
- Example: `io_tagged_networks (io_id, network_id)`
- Include additional metadata where relevant (e.g., `assignment_date`)

### Indexes
- Primary key indexes (automatic)
- Foreign key indexes (explicit)
- Frequently queried fields (status, type enums, dates)
- Composite indexes for common query patterns
- Example: `CREATE INDEX idx_devices_location_status ON devices(location_id, status);`

## Transaction Safety Examples

### Role Assignment Creation (RBAC)
```sql
BEGIN;

-- Insert role assignment
INSERT INTO role_assignments (person_id, role_id, scope, granted_by, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- If location scope, insert location associations
INSERT INTO role_assignment_locations (assignment_id, location_id)
SELECT $1, unnest($2::uuid[]);

-- Invalidate user cache
-- (handled in application layer via src/lib/rbac.ts)

COMMIT;
```

### Device with IOs Creation
```sql
BEGIN;

-- Create device
INSERT INTO devices (device_name, device_type, location_id, room_id, ...)
VALUES ($1, $2, $3, $4, ...)
RETURNING id;

-- Create IOs for device
INSERT INTO ios (device_id, interface_name, interface_type, ...)
SELECT $1, unnest($2::text[]), unnest($3::text[]), ...;

COMMIT;
```

### Modular Equipment Creation
```sql
BEGIN;

-- Create parent device (chassis)
INSERT INTO devices (device_name, device_type, parent_device_id, ...)
VALUES ('Core-Switch-Chassis', 'switch', NULL, ...)
RETURNING id;

-- Create child devices (line cards)
INSERT INTO devices (device_name, device_type, parent_device_id, serial_number, warranty_expiration, ...)
VALUES
  ('Line-Card-1', 'switch_module', $1, 'SN001', '2026-12-31', ...),
  ('Line-Card-2', 'switch_module', $1, 'SN002', '2027-06-30', ...);

COMMIT;
```

## Query Patterns

### Find All Devices in Location with Status
```sql
SELECT d.*, l.location_name, r.room_name
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN rooms r ON d.room_id = r.id
WHERE d.location_id = $1 AND d.status = 'active'
ORDER BY d.device_name;
```

### Get Device with All IOs and Connections
```sql
SELECT
  d.*,
  json_agg(
    json_build_object(
      'io', io.*,
      'connected_to', connected_io.*,
      'connected_device', connected_device.*,
      'native_network', net.*,
      'tagged_networks', (
        SELECT json_agg(tn.*)
        FROM io_tagged_networks itn
        JOIN networks tn ON itn.network_id = tn.id
        WHERE itn.io_id = io.id
      )
    )
  ) AS interfaces
FROM devices d
LEFT JOIN ios io ON d.id = io.device_id
LEFT JOIN ios connected_io ON io.connected_to_io_id = connected_io.id
LEFT JOIN devices connected_device ON connected_io.device_id = connected_device.id
LEFT JOIN networks net ON io.native_network_id = net.id
WHERE d.id = $1
GROUP BY d.id;
```

### Permission Check with Role Hierarchy
```sql
-- Check if user has permission via role hierarchy
WITH RECURSIVE role_tree AS (
  -- Start with directly assigned roles
  SELECT ra.role_id, ra.scope, ra.person_id
  FROM role_assignments ra
  WHERE ra.person_id = $1

  UNION

  -- Add parent roles recursively
  SELECT r.parent_role_id, rt.scope, rt.person_id
  FROM role_tree rt
  JOIN roles r ON rt.role_id = r.id
  WHERE r.parent_role_id IS NOT NULL
)
SELECT EXISTS (
  SELECT 1
  FROM role_tree rt
  JOIN role_permissions rp ON rt.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE p.object_type = $2 AND p.action = $3
) AS has_permission;
```

### Find Devices with Expiring Warranties
```sql
SELECT d.*, l.location_name, c.company_name
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN companies c ON d.manufacturer_id = c.id
WHERE d.warranty_expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  AND d.status = 'active'
ORDER BY d.warranty_expiration;
```

### Network Topology Path Tracing
```sql
-- Find all devices on a path from device A to device B
WITH RECURSIVE connection_path AS (
  -- Start with IOs from device A
  SELECT io.id, io.device_id, io.connected_to_io_id, 1 AS depth
  FROM ios io
  WHERE io.device_id = $1  -- Starting device

  UNION ALL

  -- Follow connections
  SELECT io.id, io.device_id, io.connected_to_io_id, cp.depth + 1
  FROM connection_path cp
  JOIN ios io ON cp.connected_to_io_id = io.id
  WHERE cp.depth < 10  -- Prevent infinite loops
    AND io.device_id != $1  -- Don't loop back to start
)
SELECT DISTINCT d.*, cp.depth
FROM connection_path cp
JOIN devices d ON cp.device_id = d.id
ORDER BY cp.depth, d.device_name;
```

## Performance Considerations

### Index Strategy
- Index all foreign keys
- Composite indexes for common WHERE clauses
- Partial indexes for filtered queries (e.g., `WHERE status = 'active'`)
- Avoid over-indexing (each index has write cost)

### Query Optimization
- Use `EXPLAIN ANALYZE` to identify slow queries
- Prefer JOINs over subqueries for better optimizer hints
- Use CTEs for complex queries (readability + optimization)
- Limit result sets with pagination (default 50, max 200)

### Connection Pooling
- Use connection pooling (PgBouncer or application-level)
- Max connections: 100 per instance
- Connection timeout: 30 seconds
- Statement timeout: 60 seconds for writes, 10 seconds for reads

### Caching Strategy
- Application-level cache for:
  - Role permissions (5-minute TTL)
  - User sessions (30-minute TTL)
  - Static lookups (companies, locations, infinite TTL with invalidation)
- Database-level: None (rely on PostgreSQL query cache)

## Migration Management

### Migration Patterns
- Migrations numbered sequentially: `001_initial.sql`, `002_add_authentication.sql`
- Each migration includes:
  - Forward migration (up)
  - Rollback migration (down) when possible
  - Test data where appropriate
- Run via script: `scripts/run-migration.js`

### Migration Best Practices
- Always test migrations on copy of production data
- Use transactions for atomic changes
- Add indexes concurrently to avoid locks: `CREATE INDEX CONCURRENTLY`
- Avoid destructive changes (prefer additive)
- Backfill data in separate step after schema changes

## Backup & Recovery

### Backup Strategy
- Full database backup: Daily at 2 AM UTC
- Point-in-time recovery: WAL archiving enabled
- Retention: 30 days for daily backups
- Test restores: Weekly automated tests

### Recovery Procedures
- Point-in-time recovery: `pg_restore` with `-T` for timestamp
- Table-level restore: Use `pg_dump` with `--table` flag
- Always test restore to separate instance first
