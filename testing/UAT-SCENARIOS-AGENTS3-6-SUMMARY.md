# UAT Test Scenarios: Agents 3-6 Summary

**Purpose**: This document provides comprehensive test scenario summaries for Agents 3-6 (Database, Security, Integration, and Admin testing agents).

---

## Agent 3: Database Testing

**Focus**: Data integrity, schema compliance, relationships, constraints
**Tools**: Bash (psql), Read
**Output File**: `UAT-RESULTS-DATABASE.md`

### Test Suite 1: Schema Validation (120 tests)

**Test Pattern**: For each of 40 tables, verify:

```sql
-- TC-DB-SCHEMA-[TABLE]-001: Table Exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = '[table_name]'
);

-- TC-DB-SCHEMA-[TABLE]-002: Columns Match dbsetup.sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '[table_name]'
ORDER BY ordinal_position;

-- TC-DB-SCHEMA-[TABLE]-003: Primary Key is UUID
SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE i.indrelid = '[table_name]'::regclass AND i.indisprimary;
```

**Tables to Test** (40 total):
- Core: companies, locations, rooms, people, devices, groups, networks, ios, ip_addresses
- Software: software, saas_services, installed_applications, software_licenses
- Docs: documents, external_documents, contracts
- Auth: users, roles, user_roles
- Admin: system_settings, integrations, integration_sync_logs, custom_fields, admin_audit_log
- Junction tables: (20+ tables)

---

### Test Suite 2: Constraints (50 tests)

**Primary Key Constraints**:
```sql
-- TC-DB-CONSTRAINT-001: Primary Key Uniqueness
-- Attempt to insert duplicate ID (should fail)
INSERT INTO companies (id, company_name, company_type)
VALUES ('[existing-uuid]', 'Duplicate', 'vendor');
-- Expected: ERROR: duplicate key value violates unique constraint
```

**Foreign Key Constraints**:
```sql
-- TC-DB-CONSTRAINT-010: Foreign Key Enforcement
-- Attempt to insert with invalid foreign key (should fail)
INSERT INTO locations (id, company_id, location_name)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Test');
-- Expected: ERROR: insert or update on table "locations" violates foreign key constraint

-- TC-DB-CONSTRAINT-011: Cascade Delete
-- Delete parent record, verify children deleted
DELETE FROM locations WHERE id = '[location-uuid]';
SELECT COUNT(*) FROM rooms WHERE location_id = '[location-uuid]';
-- Expected: 0 (rooms cascade deleted)

-- TC-DB-CONSTRAINT-012: Set NULL on Delete
-- Delete person, verify device.assigned_to_id set to NULL
DELETE FROM people WHERE id = '[person-uuid]';
SELECT assigned_to_id FROM devices WHERE assigned_to_id = '[person-uuid]';
-- Expected: NULL
```

**Check Constraints (Enums)**:
```sql
-- TC-DB-CONSTRAINT-020: Check Constraint - Invalid Enum
INSERT INTO companies (id, company_name, company_type)
VALUES (uuid_generate_v4(), 'Test', 'invalid_type');
-- Expected: ERROR: new row for relation "companies" violates check constraint

-- TC-DB-CONSTRAINT-021: Check Constraint - Valid Enum
INSERT INTO companies (id, company_name, company_type)
VALUES (uuid_generate_v4(), 'Test', 'vendor');
-- Expected: Success
```

**Not Null Constraints**:
```sql
-- TC-DB-CONSTRAINT-030: Not Null - Required Field
INSERT INTO companies (id, company_name, company_type)
VALUES (uuid_generate_v4(), NULL, 'vendor');
-- Expected: ERROR: null value in column "company_name" violates not-null constraint
```

**Unique Constraints**:
```sql
-- TC-DB-CONSTRAINT-040: Unique Constraint (if applicable)
-- Example: username uniqueness in users table
INSERT INTO users (id, username, email, password_hash, role)
VALUES (uuid_generate_v4(), 'testuser', 'test@example.com', 'hash', 'user');
INSERT INTO users (id, username, email, password_hash, role)
VALUES (uuid_generate_v4(), 'testuser', 'test2@example.com', 'hash', 'user');
-- Expected: Second insert fails with unique constraint violation
```

---

### Test Suite 3: Triggers (10 tests)

**updated_at Trigger**:
```sql
-- TC-DB-TRIGGER-001: updated_at Auto-Update
-- Create record
INSERT INTO companies (id, company_name, company_type)
VALUES ('[uuid]', 'Test Company', 'vendor')
RETURNING created_at, updated_at;

-- Wait 1 second
SELECT pg_sleep(1);

-- Update record
UPDATE companies SET company_name = 'Updated Company' WHERE id = '[uuid]'
RETURNING created_at, updated_at;

-- Verify: updated_at > created_at
SELECT created_at, updated_at, (updated_at > created_at) AS trigger_worked
FROM companies WHERE id = '[uuid]';
-- Expected: trigger_worked = true
```

**Test for all tables with updated_at** (30+ tables):
- companies, locations, rooms, people, devices, groups, networks, ios, ip_addresses, software, saas_services, installed_applications, software_licenses, documents, external_documents, contracts, etc.

---

### Test Suite 4: Cascade Behavior (20 tests)

**DELETE CASCADE**:
```sql
-- TC-DB-CASCADE-001: Location → Rooms
-- Create location with rooms
INSERT INTO locations VALUES (...);
INSERT INTO rooms (id, location_id, room_name) VALUES ('[uuid1]', '[location-uuid]', 'Room 1');
INSERT INTO rooms (id, location_id, room_name) VALUES ('[uuid2]', '[location-uuid]', 'Room 2');

-- Delete location
DELETE FROM locations WHERE id = '[location-uuid]';

-- Verify rooms deleted
SELECT COUNT(*) FROM rooms WHERE location_id = '[location-uuid]';
-- Expected: 0
```

**SET NULL**:
```sql
-- TC-DB-CASCADE-010: Person → Device Assignment
-- Assign device to person
UPDATE devices SET assigned_to_id = '[person-uuid]' WHERE id = '[device-uuid]';

-- Delete person
DELETE FROM people WHERE id = '[person-uuid]';

-- Verify device assignment set to NULL
SELECT assigned_to_id FROM devices WHERE id = '[device-uuid]';
-- Expected: NULL
```

**Cascade Relationships to Test**:
1. company → locations (SET NULL)
2. location → rooms (CASCADE)
3. room → devices (SET NULL for room_id)
4. location → devices (SET NULL for location_id)
5. person → device assignment (SET NULL for assigned_to_id)
6. device → child devices (CASCADE for parent_device_id)
7. network → ip_addresses (CASCADE)
8. network → io_tagged_networks (CASCADE)
9. software → software_licenses (CASCADE or SET NULL - verify dbsetup.sql)
10. document → junction tables (CASCADE)

---

### Test Suite 5: Data Integrity (30 tests)

**Valid Data Insertion**:
```sql
-- TC-DB-INTEGRITY-001: Valid Company Insert
INSERT INTO companies (id, company_name, company_type, email, phone)
VALUES (
  uuid_generate_v4(),
  'UAT Test Company',
  'vendor',
  'contact@uat.com',
  '555-1234'
)
RETURNING *;
-- Expected: Success, all fields returned
```

**Invalid Enum Rejection**:
```sql
-- TC-DB-INTEGRITY-010: Invalid device_type Rejected
INSERT INTO devices (id, hostname, device_type)
VALUES (uuid_generate_v4(), 'test-device', 'invalid_type');
-- Expected: ERROR: violates check constraint
```

**Null Handling**:
```sql
-- TC-DB-INTEGRITY-020: Null in Required Field Rejected
INSERT INTO companies (id, company_name, company_type)
VALUES (uuid_generate_v4(), NULL, 'vendor');
-- Expected: ERROR: not-null constraint

-- TC-DB-INTEGRITY-021: Null in Optional Field Accepted
INSERT INTO companies (id, company_name, company_type, email)
VALUES (uuid_generate_v4(), 'Test', 'vendor', NULL);
-- Expected: Success
```

**Data Type Validation**:
```sql
-- TC-DB-INTEGRITY-030: String Where Number Expected
INSERT INTO rooms (id, location_id, room_name, capacity)
VALUES (uuid_generate_v4(), '[location-uuid]', 'Test Room', 'not-a-number');
-- Expected: ERROR: invalid input syntax for type integer

-- TC-DB-INTEGRITY-031: Number Where String Expected
INSERT INTO companies (id, company_name, company_type)
VALUES (uuid_generate_v4(), 12345, 'vendor');
-- Expected: Success (implicit cast to string) OR ERROR depending on DB settings
```

---

### Test Suite 6: Junction Tables (45 tests)

**For each junction table, test**:

1. **Insert valid association**:
```sql
INSERT INTO io_tagged_networks (io_id, network_id)
VALUES ('[io-uuid]', '[network-uuid]');
-- Expected: Success
```

2. **Query associations**:
```sql
SELECT n.* FROM networks n
JOIN io_tagged_networks itn ON n.id = itn.network_id
WHERE itn.io_id = '[io-uuid]';
-- Expected: Returns associated networks
```

3. **Delete association**:
```sql
DELETE FROM io_tagged_networks WHERE io_id = '[io-uuid]' AND network_id = '[network-uuid]';
-- Expected: Success, no orphans
```

4. **Prevent duplicate associations**:
```sql
-- Insert twice (should fail on second)
INSERT INTO io_tagged_networks (io_id, network_id) VALUES ('[io-uuid]', '[network-uuid]');
INSERT INTO io_tagged_networks (io_id, network_id) VALUES ('[io-uuid]', '[network-uuid]');
-- Expected: Second insert fails with unique constraint violation
```

5. **Cascade delete on parent**:
```sql
DELETE FROM ios WHERE id = '[io-uuid]';
SELECT COUNT(*) FROM io_tagged_networks WHERE io_id = '[io-uuid]';
-- Expected: 0 (associations cascade deleted)
```

**Junction Tables** (15 total):
- io_tagged_networks
- person_software_licenses
- group_software_licenses
- document_devices
- document_networks
- document_saas_services
- document_locations
- document_rooms
- group_members
- person_saas_services
- group_saas_services
- group_installed_applications
- contract_software_licenses
- network_ios (if exists)
- saas_service_integrations

---

### Test Suite 7: Query Performance (20 tests)

**Index Usage Verification**:
```sql
-- TC-DB-PERF-001: Index on Foreign Key
EXPLAIN ANALYZE SELECT * FROM rooms WHERE location_id = '[uuid]';
-- Verify: Uses index scan, not seq scan

-- TC-DB-PERF-002: Index on Frequently Queried Field
EXPLAIN ANALYZE SELECT * FROM devices WHERE hostname = 'server-01';
-- Verify: Uses index scan if index exists
```

**Slow Query Detection**:
```sql
-- TC-DB-PERF-010: List Query Performance
\timing on
SELECT * FROM companies LIMIT 50;
-- Expected: <50ms for 50 records

-- TC-DB-PERF-011: Single Record Lookup
\timing on
SELECT * FROM companies WHERE id = '[uuid]';
-- Expected: <5ms

-- TC-DB-PERF-012: Join Query Performance
\timing on
SELECT d.*, l.location_name, r.room_name
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN rooms r ON d.room_id = r.id
LIMIT 100;
-- Expected: <100ms for 100 records with joins
```

**Pagination Performance**:
```sql
-- TC-DB-PERF-020: Offset Performance
\timing on
SELECT * FROM companies LIMIT 50 OFFSET 0;
SELECT * FROM companies LIMIT 50 OFFSET 500;
SELECT * FROM companies LIMIT 50 OFFSET 5000;
-- Verify: Performance doesn't degrade significantly with high offset
```

---

## Agent 4: Security & Authentication Testing

**Focus**: Authentication, authorization, role-based access, security vulnerabilities
**Tools**: Bash (curl), Playwright (for login flows)
**Output File**: `UAT-RESULTS-SECURITY-AUTH.md`

### Test Suite 1: Authentication System (15 tests)

**Login - Valid Credentials**:
```bash
# TC-SEC-AUTH-001: Valid Credentials
curl -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpassword"}' \
  -c cookies.txt -v
# Expected: 200 OK, session cookie set, redirect or user data returned
```

**Login - Invalid Credentials**:
```bash
# TC-SEC-AUTH-002: Invalid Password
curl -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "wrongpassword"}' \
  -v
# Expected: 401 Unauthorized, error message
```

**Login - SQL Injection Attempts**:
```bash
# TC-SEC-AUTH-003: SQL Injection in Username
curl -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin'; DROP TABLE users; --", "password": "password"}' \
  -v
# Expected: 401 Unauthorized OR 400 Bad Request, users table NOT dropped

# TC-SEC-AUTH-004: SQL Injection in Password
curl -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "' OR '1'='1"}' \
  -v
# Expected: 401 Unauthorized, login FAILS
```

**Session Management**:
```bash
# TC-SEC-AUTH-010: Session Persists
# Login
curl -X POST http://localhost:3001/api/auth/signin -d '...' -c cookies.txt
# Use session cookie to access protected route
curl -X GET http://localhost:3001/api/companies -b cookies.txt
# Expected: 200 OK, authenticated request succeeds

# TC-SEC-AUTH-011: Logout Destroys Session
curl -X POST http://localhost:3001/api/auth/signout -b cookies.txt -c cookies.txt
curl -X GET http://localhost:3001/api/companies -b cookies.txt
# Expected: 401 Unauthorized or redirect to login
```

**Protected Routes**:
```bash
# TC-SEC-AUTH-020: Unauthenticated Access Denied
curl -X GET http://localhost:3001/api/companies -v
# Expected: 401 Unauthorized or 302 redirect to /login

# TC-SEC-AUTH-021: Authenticated Access Granted
curl -X GET http://localhost:3001/api/companies -b cookies.txt -v
# Expected: 200 OK, data returned
```

---

### Test Suite 2: Role-Based Access Control (20 tests)

**User Role (basic access)**:
```bash
# Login as user
curl -X POST http://localhost:3001/api/auth/signin \
  -d '{"username": "testuser", "password": "password"}' \
  -c user-cookies.txt

# TC-SEC-RBAC-001: User Can View Objects
curl -X GET http://localhost:3001/api/companies -b user-cookies.txt
# Expected: 200 OK

# TC-SEC-RBAC-002: User Can Create Objects
curl -X POST http://localhost:3001/api/companies \
  -b user-cookies.txt \
  -d '{"company_name": "Test", "company_type": "vendor"}'
# Expected: 201 Created

# TC-SEC-RBAC-003: User Cannot Access Admin Routes
curl -X GET http://localhost:3001/admin -b user-cookies.txt
# Expected: 403 Forbidden or redirect
```

**Admin Role (elevated access)**:
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/signin \
  -d '{"username": "testadmin", "password": "password"}' \
  -c admin-cookies.txt

# TC-SEC-RBAC-010: Admin Can Access Admin Routes
curl -X GET http://localhost:3001/api/admin/settings/branding -b admin-cookies.txt
# Expected: 200 OK

# TC-SEC-RBAC-011: Admin Can Modify System Settings
curl -X PUT http://localhost:3001/api/admin/settings/branding \
  -b admin-cookies.txt \
  -d '{"site_name": "Updated"}'
# Expected: 200 OK

# TC-SEC-RBAC-012: Admin Cannot Access Super Admin Routes
curl -X GET http://localhost:3001/api/admin/settings/authentication -b admin-cookies.txt
# Expected: 403 Forbidden (super_admin only)
```

**Super Admin Role (full access)**:
```bash
# Login as super_admin
curl -X POST http://localhost:3001/api/auth/signin \
  -d '{"username": "testsuperadmin", "password": "password"}' \
  -c superadmin-cookies.txt

# TC-SEC-RBAC-020: Super Admin Can Access All Admin Routes
curl -X GET http://localhost:3001/api/admin/settings/authentication -b superadmin-cookies.txt
# Expected: 200 OK

# TC-SEC-RBAC-021: Super Admin Can Configure RBAC
curl -X GET http://localhost:3001/admin/rbac -b superadmin-cookies.txt
# Expected: 200 OK (if implemented) or 404 (placeholder)
```

---

### Test Suite 3: Admin Audit Logging (10 tests)

**Audit Log Creation**:
```sql
-- TC-SEC-AUDIT-001: Branding Change Logged
-- Change branding settings via API
-- Then query audit log
SELECT * FROM admin_audit_log
WHERE action = 'setting_changed'
  AND category = 'branding'
ORDER BY created_at DESC LIMIT 1;
-- Expected: Log entry with user_id, ip_address, details (JSONB), timestamp

-- TC-SEC-AUDIT-002: Integration CRUD Logged
-- Create/update/delete integration via API
-- Verify 3 log entries created
SELECT COUNT(*) FROM admin_audit_log
WHERE category = 'integrations'
  AND action IN ('integration_created', 'integration_updated', 'integration_deleted');
-- Expected: 3 entries
```

**Audit Log Fields**:
```sql
-- TC-SEC-AUDIT-010: All Required Fields Present
SELECT
  (user_id IS NOT NULL) AS has_user_id,
  (action IS NOT NULL) AS has_action,
  (category IS NOT NULL) AS has_category,
  (ip_address IS NOT NULL) AS has_ip_address,
  (user_agent IS NOT NULL) AS has_user_agent,
  (created_at IS NOT NULL) AS has_created_at
FROM admin_audit_log
LIMIT 1;
-- Expected: All TRUE
```

---

### Test Suite 4: Security Best Practices (25 tests)

**Password Security**:
```sql
-- TC-SEC-BEST-001: Passwords Hashed with Bcrypt
SELECT password_hash FROM users LIMIT 1;
-- Expected: Starts with $2b$ (bcrypt) or $2a$, NOT plaintext

-- TC-SEC-BEST-002: Cannot Retrieve Original Password
-- Verify no function or API endpoint returns plaintext passwords
```

**SQL Injection Prevention**:
```bash
# TC-SEC-BEST-010: Parameterized Queries (List)
curl -X GET "http://localhost:3001/api/companies?company_name='; DROP TABLE companies; --"
# Expected: No error, empty result OR validation error, companies table intact

# TC-SEC-BEST-011: Parameterized Queries (Create)
curl -X POST http://localhost:3001/api/companies \
  -d '{"company_name": "Test'; DROP TABLE companies; --", "company_type": "vendor"}'
# Expected: 201 Created with literal string OR 400 validation error, table intact

# Verify table intact:
psql -c "SELECT COUNT(*) FROM companies;"
```

**XSS Prevention**:
```bash
# TC-SEC-BEST-020: Script Tags Stored as Text
curl -X POST http://localhost:3001/api/companies \
  -d '{"company_name": "<script>alert(\"XSS\")</script>", "company_type": "vendor"}'
# Expected: 201 Created, script stored as plain text

# Verify with Playwright: Frontend escapes script tags
# Navigate to company detail page, verify script not executed
```

**CSRF Protection**:
```bash
# TC-SEC-BEST-030: POST Requires CSRF Token (NextAuth.js)
# Attempt POST without valid CSRF token
curl -X POST http://localhost:3001/api/auth/signin \
  -d '{"username": "test", "password": "test"}' \
  --header "Origin: http://malicious-site.com"
# Expected: 403 Forbidden or CSRF error
```

**Environment Variable Security**:
```bash
# TC-SEC-BEST-040: Sensitive Vars Not Exposed to Client
# Check page source for DATABASE_URL, SESSION_SECRET
curl http://localhost:3001/ | grep -i "DATABASE_URL"
curl http://localhost:3001/ | grep -i "SESSION_SECRET"
# Expected: No matches
```

---

## Agent 5: Integration & Relationships Testing

**Focus**: Cross-object workflows, data relationships, junction tables
**Tools**: Bash (curl), Read
**Output File**: `UAT-RESULTS-INTEGRATION-RELATIONSHIPS.md`

### Test Suite 1: Object Hierarchies (15 tests)

**Complete Hierarchy Workflow**:
```bash
# TC-INT-HIER-001: Company → Location → Room → Device → Person

# Step 1: Create company
COMPANY_ID=$(curl -X POST http://localhost:3001/api/companies \
  -d '{"company_name": "UAT Test Corp", "company_type": "own_organization"}' | jq -r '.id')

# Step 2: Create location for company
LOCATION_ID=$(curl -X POST http://localhost:3001/api/locations \
  -d "{\"location_name\": \"UAT Office\", \"company_id\": \"$COMPANY_ID\"}" | jq -r '.id')

# Step 3: Create room for location
ROOM_ID=$(curl -X POST http://localhost:3001/api/rooms \
  -d "{\"room_name\": \"Server Room\", \"location_id\": \"$LOCATION_ID\"}" | jq -r '.id')

# Step 4: Create device in room
DEVICE_ID=$(curl -X POST http://localhost:3001/api/devices \
  -d "{\"hostname\": \"uat-server-01\", \"device_type\": \"server\", \"location_id\": \"$LOCATION_ID\", \"room_id\": \"$ROOM_ID\"}" | jq -r '.id')

# Step 5: Create person
PERSON_ID=$(curl -X POST http://localhost:3001/api/people \
  -d "{\"full_name\": \"UAT User\", \"person_type\": \"employee\", \"email\": \"uat@test.com\"}" | jq -r '.id')

# Step 6: Assign device to person
curl -X PATCH http://localhost:3001/api/devices/$DEVICE_ID \
  -d "{\"assigned_to_id\": \"$PERSON_ID\"}"

# Verify full chain
curl http://localhost:3001/api/devices/$DEVICE_ID | jq '.assigned_to_id, .location_id, .room_id'
curl http://localhost:3001/api/rooms/$ROOM_ID | jq '.location_id'
curl http://localhost:3001/api/locations/$LOCATION_ID | jq '.company_id'

# Expected: All IDs match, full relationship chain intact
```

**Manager Hierarchy**:
```bash
# TC-INT-HIER-010: Manager Chain
# Create manager
MANAGER_ID=$(curl -X POST http://localhost:3001/api/people \
  -d '{"full_name": "Manager", "person_type": "employee", "email": "manager@test.com"}' | jq -r '.id')

# Create employee with manager
EMPLOYEE_ID=$(curl -X POST http://localhost:3001/api/people \
  -d "{\"full_name\": \"Employee\", \"person_type\": \"employee\", \"email\": \"employee@test.com\", \"manager_id\": \"$MANAGER_ID\"}" | jq -r '.id')

# Verify manager relationship
curl http://localhost:3001/api/people/$EMPLOYEE_ID | jq '.manager_id'
# Expected: Equals MANAGER_ID
```

**Parent-Child Devices**:
```bash
# TC-INT-HIER-020: Device Parent-Child
# Create parent device (chassis)
PARENT_ID=$(curl -X POST http://localhost:3001/api/devices \
  -d '{"hostname": "chassis-01", "device_type": "chassis"}' | jq -r '.id')

# Create child device (line card)
CHILD_ID=$(curl -X POST http://localhost:3001/api/devices \
  -d "{\"hostname\": \"linecard-01\", \"device_type\": \"module\", \"parent_device_id\": \"$PARENT_ID\"}" | jq -r '.id')

# Verify parent-child relationship
curl http://localhost:3001/api/devices/$CHILD_ID | jq '.parent_device_id'
# Expected: Equals PARENT_ID

# Delete parent, verify child cascade deleted
curl -X DELETE http://localhost:3001/api/devices/$PARENT_ID
curl http://localhost:3001/api/devices/$CHILD_ID
# Expected: 404 Not Found (child deleted)
```

---

### Test Suite 2: Junction Table Workflows (40 tests)

**VLAN Tagging Workflow**:
```bash
# TC-INT-JUNCTION-001: Trunk Port Configuration
# Create network (VLAN 10)
VLAN10_ID=$(curl -X POST http://localhost:3001/api/networks \
  -d '{"network_name": "VLAN 10", "vlan_id": 10, "network_address": "10.0.10.0/24"}' | jq -r '.id')

# Create network (VLAN 20)
VLAN20_ID=$(curl -X POST http://localhost:3001/api/networks \
  -d '{"network_name": "VLAN 20", "vlan_id": 20, "network_address": "10.0.20.0/24"}' | jq -r '.id')

# Create IO (trunk port)
IO_ID=$(curl -X POST http://localhost:3001/api/ios \
  -d '{"interface_name": "eth0", "interface_type": "ethernet", "trunk_mode": "trunk"}' | jq -r '.id')

# Set native VLAN
curl -X PATCH http://localhost:3001/api/ios/$IO_ID \
  -d "{\"native_network_id\": \"$VLAN10_ID\"}"

# Add tagged VLAN
curl -X POST http://localhost:3001/api/ios/$IO_ID/tagged-networks \
  -d "{\"network_id\": \"$VLAN20_ID\"}"

# Verify configuration
curl http://localhost:3001/api/ios/$IO_ID | jq '.native_network_id, .trunk_mode'
curl http://localhost:3001/api/ios/$IO_ID/tagged-networks | jq 'length'
# Expected: native_network_id = VLAN10_ID, trunk_mode = "trunk", 1 tagged network
```

**Software License Assignment Workflow**:
```bash
# TC-INT-JUNCTION-010: License Seat Management
# Create software
SOFTWARE_ID=$(curl -X POST http://localhost:3001/api/software \
  -d '{"software_name": "Adobe Creative Cloud", "software_type": "subscription"}' | jq -r '.id')

# Create license (10 seats)
LICENSE_ID=$(curl -X POST http://localhost:3001/api/software-licenses \
  -d "{\"software_id\": \"$SOFTWARE_ID\", \"license_type\": \"subscription\", \"seats_purchased\": 10, \"seats_assigned\": 0}" | jq -r '.id')

# Create 3 people
PERSON1_ID=$(curl -X POST http://localhost:3001/api/people -d '{"full_name": "User 1", "person_type": "employee", "email": "user1@test.com"}' | jq -r '.id')
PERSON2_ID=$(curl -X POST http://localhost:3001/api/people -d '{"full_name": "User 2", "person_type": "employee", "email": "user2@test.com"}' | jq -r '.id')
PERSON3_ID=$(curl -X POST http://localhost:3001/api/people -d '{"full_name": "User 3", "person_type": "employee", "email": "user3@test.com"}' | jq -r '.id')

# Assign license to 3 people
curl -X POST http://localhost:3001/api/software-licenses/$LICENSE_ID/assign-person -d "{\"person_id\": \"$PERSON1_ID\"}"
curl -X POST http://localhost:3001/api/software-licenses/$LICENSE_ID/assign-person -d "{\"person_id\": \"$PERSON2_ID\"}"
curl -X POST http://localhost:3001/api/software-licenses/$LICENSE_ID/assign-person -d "{\"person_id\": \"$PERSON3_ID\"}"

# Verify seat count
curl http://localhost:3001/api/software-licenses/$LICENSE_ID/assignments | jq '.seats_assigned, .seats_available'
# Expected: seats_assigned = 3, seats_available = 7

# Unassign one person
curl -X DELETE http://localhost:3001/api/software-licenses/$LICENSE_ID/assign-person/$PERSON1_ID

# Verify seat count updated
curl http://localhost:3001/api/software-licenses/$LICENSE_ID/assignments | jq '.seats_assigned, .seats_available'
# Expected: seats_assigned = 2, seats_available = 8
```

**Document Associations Workflow**:
```bash
# TC-INT-JUNCTION-020: Multi-Object Document Associations
# Create document
DOC_ID=$(curl -X POST http://localhost:3001/api/documents \
  -d '{"title": "Server Maintenance Procedure", "document_type": "procedure", "status": "published"}' | jq -r '.id')

# Create objects to associate
DEVICE_ID=$(curl -X POST http://localhost:3001/api/devices -d '{"hostname": "server-01", "device_type": "server"}' | jq -r '.id')
NETWORK_ID=$(curl -X POST http://localhost:3001/api/networks -d '{"network_name": "Production", "vlan_id": 100}' | jq -r '.id')
LOCATION_ID=$(curl -X POST http://localhost:3001/api/locations -d '{"location_name": "Data Center"}' | jq -r '.id')

# Associate document with 3 object types
curl -X POST http://localhost:3001/api/documents/$DOC_ID/devices -d "{\"device_id\": \"$DEVICE_ID\"}"
curl -X POST http://localhost:3001/api/documents/$DOC_ID/networks -d "{\"network_id\": \"$NETWORK_ID\"}"
curl -X POST http://localhost:3001/api/documents/$DOC_ID/locations -d "{\"location_id\": \"$LOCATION_ID\"}"

# Verify all 3 associations
curl http://localhost:3001/api/documents/$DOC_ID/devices | jq 'length'
curl http://localhost:3001/api/documents/$DOC_ID/networks | jq 'length'
curl http://localhost:3001/api/documents/$DOC_ID/locations | jq 'length'
# Expected: Each returns 1

# Remove one association
curl -X DELETE http://localhost:3001/api/documents/$DOC_ID/devices/$DEVICE_ID

# Verify removed
curl http://localhost:3001/api/documents/$DOC_ID/devices | jq 'length'
# Expected: 0
```

---

### Test Suite 3: Cross-Object Navigation (20 tests)

**Navigation Workflows** (tested via Playwright or API chaining):
```bash
# TC-INT-NAV-001: Location → Rooms → Devices
# Get location
LOCATION=$(curl http://localhost:3001/api/locations/$LOCATION_ID)
# Get rooms in location
ROOMS=$(curl "http://localhost:3001/api/rooms?location_id=$LOCATION_ID")
ROOM_ID=$(echo $ROOMS | jq -r '.[0].id')
# Get devices in room
DEVICES=$(curl "http://localhost:3001/api/devices?room_id=$ROOM_ID")
# Verify navigation chain works
```

---

## Agent 6: Admin Panel Testing

**Focus**: Admin settings, integrations, audit logging, access control
**Tools**: Bash (curl), Playwright
**Output File**: `UAT-RESULTS-ADMIN-PANEL.md`

### Test Suite 1: Admin Authentication (8 tests)

**Access Control by Role**:
```bash
# TC-ADM-AUTH-001: User Role Denied
curl -X GET http://localhost:3001/admin -b user-cookies.txt
# Expected: 403 or redirect to /

# TC-ADM-AUTH-002: Admin Role Granted
curl -X GET http://localhost:3001/admin -b admin-cookies.txt
# Expected: 200 OK

# TC-ADM-AUTH-003: Super Admin Full Access
curl -X GET http://localhost:3001/admin/authentication -b superadmin-cookies.txt
# Expected: 200 OK (placeholder page)

# TC-ADM-AUTH-004: Admin Restricted from Super Admin Routes
curl -X GET http://localhost:3001/admin/authentication -b admin-cookies.txt
# Expected: 403 Forbidden
```

---

### Test Suite 2: Implemented Admin Sections (40 tests)

**Branding Settings** (12 tests):
- Get settings (TC-ADM-BRAND-001 to 003)
- Update site_name, logo_url, favicon_url (TC-ADM-BRAND-004 to 006)
- Update colors (primary, background, text, accent) (TC-ADM-BRAND-007 to 010)
- Verify persistence (TC-ADM-BRAND-011)
- Verify audit log (TC-ADM-BRAND-012)

**Storage Configuration** (15 tests):
- Get settings (TC-ADM-STORAGE-001)
- Update to Local backend (TC-ADM-STORAGE-002 to 004)
- Update to S3 backend (TC-ADM-STORAGE-005 to 008)
- Update to NFS backend (TC-ADM-STORAGE-009 to 011)
- Update to SMB backend (TC-ADM-STORAGE-012 to 014)
- Verify audit log (TC-ADM-STORAGE-015)

**Integrations Management** (20 tests):
- List integrations (TC-ADM-INT-001)
- Create integration - each type (TC-ADM-INT-002 to 009: IdP, MDM, RMM, Cloud, Ticketing, Monitoring, Backup, Other)
- Update integration (TC-ADM-INT-010 to 012: status, config, sync_frequency)
- Delete integration (TC-ADM-INT-013)
- Duplicate name handling (TC-ADM-INT-014)
- Invalid provider rejection (TC-ADM-INT-015)
- Sync configuration (TC-ADM-INT-016 to 018)
- Verify audit logs (TC-ADM-INT-019 to 020)

**Audit Logs Viewer** (12 tests):
- List all logs (TC-ADM-AUDIT-001)
- Filter by category (TC-ADM-AUDIT-002 to 006: branding, storage, integrations, etc.)
- Filter by action (TC-ADM-AUDIT-007 to 009)
- Limit results (TC-ADM-AUDIT-010: 25, 50, 100, 250)
- Verify log fields (TC-ADM-AUDIT-011: user_id, ip_address, details, timestamp)
- Verify details JSONB format (TC-ADM-AUDIT-012)

---

### Test Suite 3: Database Validation (10 tests)

**system_settings Table**:
```sql
-- TC-ADM-DB-001: Settings Populated
SELECT COUNT(*) FROM system_settings;
-- Expected: 46 settings

-- TC-ADM-DB-002: Branding Settings Exist
SELECT key, value FROM system_settings WHERE category = 'branding';
-- Expected: site_name, logo_url, favicon_url, primary_color, background_color, text_color, accent_color
```

**integrations Table**:
```sql
-- TC-ADM-DB-010: Integrations CRUD
-- Create, read, update, delete integration
-- Verify all fields stored correctly
```

**admin_audit_log Table**:
```sql
-- TC-ADM-DB-020: Audit Logs Captured
-- Perform admin action, verify log entry created
SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 1;
-- Expected: Entry with user_id, action, category, ip_address, user_agent, details
```

---

## Summary

**Total Test Scenarios Across All 6 Agents**: ~650

**Agent Breakdown**:
- Agent 1 (Playwright UI): ~580 checks
- Agent 2 (API/Backend): ~327 tests
- Agent 3 (Database): ~295 tests
- Agent 4 (Security): ~80 tests
- Agent 5 (Integration): ~100 tests
- Agent 6 (Admin): ~89 tests

**Estimated Total Execution Time**: ~60 hours (can run in parallel)

**Parallel Execution**:
- Agents 2-6 can run simultaneously (non-Playwright)
- Agent 1 has exclusive Playwright access
- Estimated wall-clock time: ~30 hours with parallelization

---

**Documentation Owner**: UAT Testing Coordinator
**Last Updated**: 2025-10-11
**Status**: Ready for agent deployment
