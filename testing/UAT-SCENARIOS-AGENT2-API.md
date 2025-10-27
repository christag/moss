# UAT Test Scenarios: Agent 2 - API/Backend Testing

**Agent**: API/Backend Testing Agent
**Focus**: REST API endpoints, validation, error handling, HTTP status codes
**Tools**: Bash (curl), Read (for API route inspection)
**Output File**: `UAT-RESULTS-API-BACKEND.md`

---

## Test Suite 1: Core Object APIs (16 Objects × 12 Operations)

### Objects to Test
1. Companies (/api/companies)
2. Locations (/api/locations)
3. Rooms (/api/rooms)
4. People (/api/people)
5. Devices (/api/devices)
6. Groups (/api/groups)
7. Networks (/api/networks)
8. IOs (/api/ios)
9. IP Addresses (/api/ip-addresses)
10. Software (/api/software)
11. SaaS Services (/api/saas-services)
12. Installed Applications (/api/installed-applications)
13. Software Licenses (/api/software-licenses)
14. Documents (/api/documents)
15. External Documents (/api/external-documents)
16. Contracts (/api/contracts)

---

### Test Cases (Per Object)

#### TC-API-CORE-[OBJECT]-001: GET List - Success
**Endpoint**: `GET /api/[object]`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/[object]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: JSON array of objects
- Response Structure:
  ```json
  [
    {
      "id": "uuid",
      "field1": "value1",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Content-Type is application/json
- ✓ Response is array
- ✓ Each object has id field (UUID format)
- ✓ Each object has created_at and updated_at

---

#### TC-API-CORE-[OBJECT]-002: GET List - With Pagination
**Endpoint**: `GET /api/[object]?limit=10&offset=0`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/[object]?limit=10&offset=0" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response: Maximum 10 items
- If >10 items exist, test offset=10 returns next page

**Validation**:
- ✓ Returns ≤10 items
- ✓ offset=10 returns different items (page 2)
- ✓ offset beyond total returns empty array

---

#### TC-API-CORE-[OBJECT]-003: GET List - With Filtering
**Endpoint**: `GET /api/[object]?[filter_param]=[value]`

**curl Command** (example for companies):
```bash
curl -X GET "http://localhost:3001/api/companies?company_type=vendor" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response: Only items matching filter
- Empty array if no matches

**Validation**:
- ✓ All returned items match filter criteria
- ✓ Items not matching filter excluded
- ✓ Invalid filter values handled gracefully

---

#### TC-API-CORE-[OBJECT]-004: GET List - With Sorting
**Endpoint**: `GET /api/[object]?order_by=[field]&order_direction=asc`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/[object]?order_by=created_at&order_direction=desc" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response: Items sorted by specified field
- order_direction=asc: Ascending order
- order_direction=desc: Descending order

**Validation**:
- ✓ Items returned in correct sort order
- ✓ asc and desc both work
- ✓ Invalid order_by field handled gracefully

---

#### TC-API-CORE-[OBJECT]-005: GET List - Empty Result
**Endpoint**: `GET /api/[object]`

**Setup**: Ensure table empty or use filter that returns no results

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/[object]?[nonexistent_filter]=xyz" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: `[]` (empty array)

**Validation**:
- ✓ Status code is 200 (not 404)
- ✓ Response is empty array, not null

---

#### TC-API-CORE-[OBJECT]-006: POST Create - Success
**Endpoint**: `POST /api/[object]`

**curl Command** (example for companies):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "UAT Test Company",
    "company_type": "vendor",
    "email": "contact@uattest.com",
    "phone": "555-1234"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Created object with generated ID
- Response includes all submitted fields
- created_at and updated_at timestamps set

**Validation**:
- ✓ Status code is 201
- ✓ Response includes id (UUID format)
- ✓ All submitted fields returned correctly
- ✓ created_at and updated_at present and valid

---

#### TC-API-CORE-[OBJECT]-007: POST Create - Missing Required Field
**Endpoint**: `POST /api/[object]`

**curl Command** (example: company without company_name):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_type": "vendor",
    "email": "contact@uattest.com"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Error message indicating missing field
  ```json
  {
    "error": "Validation failed",
    "details": ["company_name is required"]
  }
  ```

**Validation**:
- ✓ Status code is 400
- ✓ Error message is clear and specific
- ✓ Indicates which field(s) missing
- ✓ Object not created in database

---

#### TC-API-CORE-[OBJECT]-008: POST Create - Invalid Field Type
**Endpoint**: `POST /api/[object]`

**curl Command** (example: string where number expected):
```bash
curl -X POST "http://localhost:3001/api/rooms" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "valid-uuid",
    "room_name": "Test Room",
    "capacity": "not-a-number"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Error message indicating type mismatch
  ```json
  {
    "error": "Validation failed",
    "details": ["capacity must be a number"]
  }
  ```

**Validation**:
- ✓ Status code is 400
- ✓ Error message indicates type issue
- ✓ Object not created

---

#### TC-API-CORE-[OBJECT]-009: POST Create - Invalid Enum Value
**Endpoint**: `POST /api/[object]`

**curl Command** (example: invalid company_type):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "invalid_type"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Error message listing valid enum values
  ```json
  {
    "error": "Validation failed",
    "details": ["company_type must be one of: own_organization, vendor, manufacturer, service_provider, partner, customer, other"]
  }
  ```

**Validation**:
- ✓ Status code is 400
- ✓ Error message lists valid values
- ✓ Object not created

---

#### TC-API-CORE-[OBJECT]-010: POST Create - Duplicate Unique Field
**Endpoint**: `POST /api/[object]`

**Setup**: Create object with unique field, then attempt to create duplicate

**curl Command** (example: duplicate serial number):
```bash
# First request (should succeed)
curl -X POST "http://localhost:3001/api/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "test-device-1",
    "device_type": "server",
    "serial_number": "SN123456789"
  }' \
  -v

# Second request with same serial (should fail)
curl -X POST "http://localhost:3001/api/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "test-device-2",
    "device_type": "server",
    "serial_number": "SN123456789"
  }' \
  -v
```

**Expected**:
- HTTP Status: `409 Conflict`
- Response Body: Error message indicating duplicate
  ```json
  {
    "error": "Conflict",
    "details": ["A device with this serial_number already exists"]
  }
  ```

**Validation**:
- ✓ Status code is 409
- ✓ Error message clear about duplicate
- ✓ Second object not created

---

#### TC-API-CORE-[OBJECT]-011: POST Create - Optional Fields Omitted
**Endpoint**: `POST /api/[object]`

**curl Command** (only required fields):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Minimal Company",
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Created object
- Optional fields: null or omitted (not empty strings)

**Validation**:
- ✓ Status code is 201
- ✓ Object created successfully
- ✓ Optional fields are null or omitted, not ""
- ✓ Verify DEF-007 fix: omitted fields not sent as null

---

#### TC-API-CORE-[OBJECT]-012: GET Single - Success
**Endpoint**: `GET /api/[object]/[id]`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/[object]/[valid-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Single object with matching ID

**Validation**:
- ✓ Status code is 200
- ✓ Response is single object (not array)
- ✓ ID matches requested ID
- ✓ All fields present

---

#### TC-API-CORE-[OBJECT]-013: GET Single - Not Found
**Endpoint**: `GET /api/[object]/[id]`

**curl Command** (non-existent UUID):
```bash
curl -X GET "http://localhost:3001/api/[object]/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `404 Not Found`
- Response Body: Error message
  ```json
  {
    "error": "Not found",
    "message": "[Object] not found"
  }
  ```

**Validation**:
- ✓ Status code is 404
- ✓ Error message clear

---

#### TC-API-CORE-[OBJECT]-014: GET Single - Invalid UUID Format
**Endpoint**: `GET /api/[object]/[id]`

**curl Command** (invalid UUID):
```bash
curl -X GET "http://localhost:3001/api/[object]/invalid-uuid-format" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Error message
  ```json
  {
    "error": "Invalid request",
    "message": "Invalid UUID format"
  }
  ```

**Validation**:
- ✓ Status code is 400
- ✓ Error message indicates UUID format issue

---

#### TC-API-CORE-[OBJECT]-015: PATCH Update - Success
**Endpoint**: `PATCH /api/[object]/[id]`

**curl Command** (example: update company email):
```bash
curl -X PATCH "http://localhost:3001/api/companies/[valid-uuid]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "phone": "555-9999"
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Updated object
- Only specified fields updated
- updated_at timestamp changed
- created_at timestamp unchanged

**Validation**:
- ✓ Status code is 200
- ✓ Specified fields updated correctly
- ✓ Other fields unchanged
- ✓ updated_at > created_at

---

#### TC-API-CORE-[OBJECT]-016: PATCH Update - Partial Update
**Endpoint**: `PATCH /api/[object]/[id]`

**curl Command** (update single field):
```bash
curl -X PATCH "http://localhost:3001/api/companies/[valid-uuid]" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "555-7777"
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Updated object
- Only phone field changed
- All other fields preserved

**Validation**:
- ✓ Status code is 200
- ✓ Single field updated
- ✓ Other fields not affected

---

#### TC-API-CORE-[OBJECT]-017: PATCH Update - Invalid Field Type
**Endpoint**: `PATCH /api/[object]/[id]`

**curl Command** (wrong type):
```bash
curl -X PATCH "http://localhost:3001/api/rooms/[valid-uuid]" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": "not-a-number"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Validation error
- Object not updated

**Validation**:
- ✓ Status code is 400
- ✓ Error message clear
- ✓ Object unchanged in database

---

#### TC-API-CORE-[OBJECT]-018: PATCH Update - Not Found
**Endpoint**: `PATCH /api/[object]/[id]`

**curl Command** (non-existent ID):
```bash
curl -X PATCH "http://localhost:3001/api/[object]/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "value"
  }' \
  -v
```

**Expected**:
- HTTP Status: `404 Not Found`
- Response Body: Error message

**Validation**:
- ✓ Status code is 404
- ✓ Error message indicates object not found

---

#### TC-API-CORE-[OBJECT]-019: DELETE - Success (No Dependencies)
**Endpoint**: `DELETE /api/[object]/[id]`

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/[object]/[valid-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Success message
  ```json
  {
    "message": "[Object] deleted successfully"
  }
  ```
- Object no longer in database

**Validation**:
- ✓ Status code is 200
- ✓ Success message returned
- ✓ GET /api/[object]/[id] returns 404

---

#### TC-API-CORE-[OBJECT]-020: DELETE - With Dependencies (Should Fail)
**Endpoint**: `DELETE /api/[object]/[id]`

**Setup**: Create object with dependencies (e.g., Location with Rooms)

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/locations/[location-with-rooms-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `409 Conflict`
- Response Body: Error message explaining dependencies
  ```json
  {
    "error": "Cannot delete",
    "message": "Location has 3 associated rooms. Please remove them first."
  }
  ```
- Object not deleted

**Validation**:
- ✓ Status code is 409
- ✓ Error message lists dependencies
- ✓ Error message helpful (suggests action)
- ✓ Object still exists in database

---

#### TC-API-CORE-[OBJECT]-021: DELETE - Not Found
**Endpoint**: `DELETE /api/[object]/[id]`

**curl Command** (non-existent ID):
```bash
curl -X DELETE "http://localhost:3001/api/[object]/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `404 Not Found`
- Response Body: Error message

**Validation**:
- ✓ Status code is 404
- ✓ Error message indicates object not found

---

## Test Suite 2: Special Endpoints

### TC-API-SPECIAL-001: Health Check
**Endpoint**: `GET /api/health`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/health" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2025-10-11T..."
  }
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Status field is "healthy"
- ✓ Database connection confirmed
- ✓ Timestamp present

---

### TC-API-SPECIAL-002: Search API (if implemented)
**Endpoint**: `GET /api/search?q=[query]`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/search?q=test" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK` or `501 Not Implemented`
- Response Body (if implemented):
  ```json
  {
    "results": [
      {
        "type": "company",
        "id": "uuid",
        "title": "Test Company",
        "snippet": "..."
      }
    ]
  }
  ```

**Validation**:
- ✓ If implemented: Returns results grouped by type
- ✓ If not implemented: 501 status or clear message

---

### TC-API-SPECIAL-003: Authentication - Login
**Endpoint**: `POST /api/auth/signin`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpassword"
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK` (valid credentials) or `401 Unauthorized` (invalid)
- Response: Set-Cookie header with session token
- Response Body: User data (without password)

**Validation**:
- ✓ Valid credentials: 200 + session cookie
- ✓ Invalid credentials: 401 + error message
- ✓ Password not returned in response

---

## Test Suite 3: Admin APIs

### TC-API-ADMIN-001: Get Branding Settings
**Endpoint**: `GET /api/admin/settings/branding`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/admin/settings/branding" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body:
  ```json
  {
    "site_name": "M.O.S.S.",
    "logo_url": "",
    "favicon_url": "",
    "primary_color": "#1C7FF2",
    "background_color": "#FAF9F5",
    "text_color": "#231F20",
    "accent_color": "#28C077"
  }
  ```

**Validation**:
- ✓ Status code is 200
- ✓ All branding fields present
- ✓ Color values in hex format

---

### TC-API-ADMIN-002: Update Branding Settings
**Endpoint**: `PUT /api/admin/settings/branding`

**curl Command**:
```bash
curl -X PUT "http://localhost:3001/api/admin/settings/branding" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -d '{
    "site_name": "M.O.S.S. UAT",
    "primary_color": "#0000FF"
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Updated settings
- Changes persisted to system_settings table
- Audit log entry created

**Validation**:
- ✓ Status code is 200
- ✓ Settings updated in database
- ✓ Audit log entry created
- ✓ GET returns updated values

---

### TC-API-ADMIN-003: Get Storage Settings
**Endpoint**: `GET /api/admin/settings/storage`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/admin/settings/storage" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body:
  ```json
  {
    "backend": "local",
    "config": {
      "directory": "/var/moss/uploads"
    }
  }
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Backend type returned
- ✓ Config object present

---

### TC-API-ADMIN-004: Update Storage Settings
**Endpoint**: `PUT /api/admin/settings/storage`

**curl Command**:
```bash
curl -X PUT "http://localhost:3001/api/admin/settings/storage" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -d '{
    "backend": "s3",
    "config": {
      "bucket": "moss-uat",
      "region": "us-east-1",
      "access_key": "AKIA...",
      "secret_key": "..."
    }
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Updated settings
- Audit log entry created

**Validation**:
- ✓ Status code is 200
- ✓ Settings updated
- ✓ Audit log entry created

---

### TC-API-ADMIN-005: List Integrations
**Endpoint**: `GET /api/admin/integrations`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/admin/integrations" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Array of integrations
  ```json
  [
    {
      "id": "uuid",
      "name": "Okta SSO",
      "type": "idp",
      "provider": "okta",
      "status": "active",
      "config": {...},
      "sync_frequency": "daily",
      "last_sync_at": "timestamp"
    }
  ]
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Array of integrations returned
- ✓ All integration fields present

---

### TC-API-ADMIN-006: Create Integration
**Endpoint**: `POST /api/admin/integrations`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/admin/integrations" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -d '{
    "name": "UAT Okta",
    "type": "idp",
    "provider": "okta",
    "status": "active",
    "config": {
      "domain": "uat.okta.com",
      "api_token": "..."
    },
    "sync_frequency": "hourly"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Created integration with ID
- Audit log entry created

**Validation**:
- ✓ Status code is 201
- ✓ Integration created with ID
- ✓ All fields saved correctly
- ✓ Audit log entry created

---

### TC-API-ADMIN-007: Update Integration
**Endpoint**: `PATCH /api/admin/integrations/[id]`

**curl Command**:
```bash
curl -X PATCH "http://localhost:3001/api/admin/integrations/[uuid]" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -d '{
    "status": "inactive",
    "sync_frequency": "daily"
  }' \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Updated integration
- Audit log entry created

**Validation**:
- ✓ Status code is 200
- ✓ Integration updated
- ✓ Audit log entry created

---

### TC-API-ADMIN-008: Delete Integration
**Endpoint**: `DELETE /api/admin/integrations/[id]`

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/admin/integrations/[uuid]" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Success message
- Integration deleted from database
- Audit log entry created

**Validation**:
- ✓ Status code is 200
- ✓ Integration deleted
- ✓ Audit log entry created

---

### TC-API-ADMIN-009: List Audit Logs
**Endpoint**: `GET /api/admin/audit-logs`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/admin/audit-logs" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Array of audit log entries
  ```json
  [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "setting_changed",
      "category": "branding",
      "target_object_id": null,
      "target_object_type": null,
      "details": {...},
      "ip_address": "127.0.0.1",
      "user_agent": "curl/...",
      "created_at": "timestamp"
    }
  ]
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Audit logs returned
- ✓ All fields present

---

### TC-API-ADMIN-010: Filter Audit Logs by Category
**Endpoint**: `GET /api/admin/audit-logs?category=branding`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/admin/audit-logs?category=branding" \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin-session-cookie]" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Only logs with category=branding

**Validation**:
- ✓ Status code is 200
- ✓ All returned logs have category=branding
- ✓ Logs with other categories excluded

---

## Test Suite 4: Junction Table APIs (15 Endpoints × 3 Operations)

### Junction Tables to Test
1. io_tagged_networks (VLAN tagging)
2. person_software_licenses
3. group_software_licenses
4. document_devices
5. document_networks
6. document_saas_services
7. document_locations
8. document_rooms
9. group_members
10. person_saas_services
11. group_saas_services
12. group_installed_applications
13. contract_software_licenses
14. network_ios
15. saas_service_integrations

---

### TC-API-JUNCTION-001: GET Tagged Networks (VLAN Tagging)
**Endpoint**: `GET /api/ios/[id]/tagged-networks`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/ios/[io-uuid]/tagged-networks" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Array of tagged networks (VLANs)
  ```json
  [
    {
      "id": "uuid",
      "network_name": "VLAN 20",
      "vlan_id": 20,
      "network_address": "10.0.20.0/24"
    }
  ]
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Array of networks returned
- ✓ Empty array if no tagged networks

---

### TC-API-JUNCTION-002: POST Add Tagged Network (VLAN Tag)
**Endpoint**: `POST /api/ios/[id]/tagged-networks`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/ios/[io-uuid]/tagged-networks" \
  -H "Content-Type: application/json" \
  -d '{
    "network_id": "[network-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Success message and association
- Junction table entry created

**Validation**:
- ✓ Status code is 201
- ✓ Association created
- ✓ GET returns new network in list

---

### TC-API-JUNCTION-003: DELETE Remove Tagged Network
**Endpoint**: `DELETE /api/ios/[id]/tagged-networks/[network_id]`

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/ios/[io-uuid]/tagged-networks/[network-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Success message
- Junction table entry removed

**Validation**:
- ✓ Status code is 200
- ✓ Association removed
- ✓ GET no longer returns network

---

### TC-API-JUNCTION-004: POST Add Duplicate (Should Fail)
**Endpoint**: `POST /api/ios/[id]/tagged-networks`

**Setup**: Add network to IO, then attempt to add same network again

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/ios/[io-uuid]/tagged-networks" \
  -H "Content-Type: application/json" \
  -d '{
    "network_id": "[already-added-network-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `409 Conflict`
- Response Body: Error message
  ```json
  {
    "error": "Conflict",
    "message": "This network is already tagged on this interface"
  }
  ```

**Validation**:
- ✓ Status code is 409
- ✓ Error message clear
- ✓ Duplicate not created

---

### TC-API-JUNCTION-005: GET License Assignments
**Endpoint**: `GET /api/software-licenses/[id]/assignments`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/software-licenses/[license-uuid]/assignments" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body:
  ```json
  {
    "seats_purchased": 10,
    "seats_assigned": 5,
    "seats_available": 5,
    "people": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "groups": [
      {
        "id": "uuid",
        "group_name": "Engineering",
        "group_type": "active_directory"
      }
    ]
  }
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Seat calculations correct
- ✓ People and groups arrays present

---

### TC-API-JUNCTION-006: POST Assign License to Person
**Endpoint**: `POST /api/software-licenses/[id]/assign-person`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/software-licenses/[license-uuid]/assign-person" \
  -H "Content-Type: application/json" \
  -d '{
    "person_id": "[person-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Success message
- seats_assigned incremented
- Junction table entry created

**Validation**:
- ✓ Status code is 201
- ✓ Association created
- ✓ seats_assigned increased by 1

---

### TC-API-JUNCTION-007: POST Assign License - Seats Exhausted
**Endpoint**: `POST /api/software-licenses/[id]/assign-person`

**Setup**: License with seats_assigned = seats_purchased

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/software-licenses/[full-license-uuid]/assign-person" \
  -H "Content-Type: application/json" \
  -d '{
    "person_id": "[person-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `409 Conflict` or `400 Bad Request`
- Response Body: Error message
  ```json
  {
    "error": "No seats available",
    "message": "All 10 seats are assigned. Purchase more seats or unassign existing users."
  }
  ```

**Validation**:
- ✓ Status code is 409 or 400
- ✓ Error message helpful
- ✓ Assignment not created

---

### TC-API-JUNCTION-008: DELETE Unassign License from Person
**Endpoint**: `DELETE /api/software-licenses/[id]/assign-person/[person_id]`

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/software-licenses/[license-uuid]/assign-person/[person-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Success message
- seats_assigned decremented
- Junction table entry removed

**Validation**:
- ✓ Status code is 200
- ✓ Association removed
- ✓ seats_assigned decreased by 1
- ✓ Verify GREATEST prevents negative (seats_assigned never < 0)

---

### TC-API-JUNCTION-009: POST Assign License to Group
**Endpoint**: `POST /api/software-licenses/[id]/assign-group`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/software-licenses/[license-uuid]/assign-group" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "[group-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Success message
- seats_assigned NOT incremented (group licensing doesn't count against seats)
- Junction table entry created

**Validation**:
- ✓ Status code is 201
- ✓ Association created
- ✓ seats_assigned unchanged

---

### TC-API-JUNCTION-010: GET Document Associations (All 5 Types)
**Endpoints**:
- `GET /api/documents/[id]/devices`
- `GET /api/documents/[id]/networks`
- `GET /api/documents/[id]/saas-services`
- `GET /api/documents/[id]/locations`
- `GET /api/documents/[id]/rooms`

**curl Command** (example for devices):
```bash
curl -X GET "http://localhost:3001/api/documents/[doc-uuid]/devices" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Array of associated items
  ```json
  [
    {
      "id": "uuid",
      "hostname": "server-01",
      "device_type": "server"
    }
  ]
  ```

**Validation**:
- ✓ Status code is 200
- ✓ Array of items returned
- ✓ Test all 5 association types

---

### TC-API-JUNCTION-011: POST Associate Document with Device
**Endpoint**: `POST /api/documents/[id]/devices`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/documents/[doc-uuid]/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "[device-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Success message
- Junction table entry created

**Validation**:
- ✓ Status code is 201
- ✓ Association created
- ✓ GET returns device in list

---

### TC-API-JUNCTION-012: DELETE Remove Document Association
**Endpoint**: `DELETE /api/documents/[id]/devices/[device_id]`

**curl Command**:
```bash
curl -X DELETE "http://localhost:3001/api/documents/[doc-uuid]/devices/[device-uuid]" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK`
- Response Body: Success message
- Junction table entry removed

**Validation**:
- ✓ Status code is 200
- ✓ Association removed
- ✓ GET no longer returns device

---

### TC-API-JUNCTION-013: POST Associate - Non-Existent Parent
**Endpoint**: `POST /api/documents/[id]/devices`

**curl Command** (non-existent document ID):
```bash
curl -X POST "http://localhost:3001/api/documents/00000000-0000-0000-0000-000000000000/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "[valid-device-uuid]"
  }' \
  -v
```

**Expected**:
- HTTP Status: `404 Not Found`
- Response Body: Error message indicating document not found

**Validation**:
- ✓ Status code is 404
- ✓ Error message clear
- ✓ Association not created

---

### TC-API-JUNCTION-014: POST Associate - Non-Existent Child
**Endpoint**: `POST /api/documents/[id]/devices`

**curl Command** (non-existent device ID):
```bash
curl -X POST "http://localhost:3001/api/documents/[doc-uuid]/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "00000000-0000-0000-0000-000000000000"
  }' \
  -v
```

**Expected**:
- HTTP Status: `404 Not Found`
- Response Body: Error message indicating device not found

**Validation**:
- ✓ Status code is 404
- ✓ Error message clear
- ✓ Association not created

---

## Test Suite 5: Validation & Security Testing

### TC-API-VAL-001: SQL Injection - List Endpoint
**Endpoint**: `GET /api/companies?company_name='; DROP TABLE users; --`

**curl Command**:
```bash
curl -X GET "http://localhost:3001/api/companies?company_name='; DROP TABLE users; --" \
  -H "Content-Type: application/json" \
  -v
```

**Expected**:
- HTTP Status: `200 OK` or `400 Bad Request`
- Response Body: Empty array or error
- **CRITICAL**: users table NOT dropped (verify table still exists)

**Validation**:
- ✓ SQL injection prevented
- ✓ Parameterized queries used
- ✓ Database tables intact

---

### TC-API-VAL-002: SQL Injection - Create Endpoint
**Endpoint**: `POST /api/companies`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test'; DROP TABLE companies; --",
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created` or `400 Bad Request`
- Response Body: Company created with literal string OR validation error
- **CRITICAL**: companies table NOT dropped

**Validation**:
- ✓ SQL injection prevented
- ✓ String stored literally if created
- ✓ Database tables intact

---

### TC-API-VAL-003: XSS Prevention - Create Endpoint
**Endpoint**: `POST /api/companies`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "<script>alert(\"XSS\")</script>",
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Company created
- Script stored as plain text (not executed)
- Frontend escapes script tags on display

**Validation**:
- ✓ Script not executed
- ✓ Stored as plain text
- ✓ Frontend escapes on display (verify with UI test)

---

### TC-API-VAL-004: Invalid JSON Body
**Endpoint**: `POST /api/companies`

**curl Command** (malformed JSON):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{invalid json' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Error message indicating JSON parse error

**Validation**:
- ✓ Status code is 400
- ✓ Error message clear
- ✓ No server crash

---

### TC-API-VAL-005: Empty Request Body
**Endpoint**: `POST /api/companies`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Validation errors listing missing required fields

**Validation**:
- ✓ Status code is 400
- ✓ All required fields listed in error

---

### TC-API-VAL-006: Extremely Long String
**Endpoint**: `POST /api/companies`

**curl Command** (10,000 character string):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "'$(python3 -c 'print("A" * 10000)')'",
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request` (if max length validation) or `201 Created` (if no limit)
- Response Body: Error or success
- No server crash or performance issue

**Validation**:
- ✓ Request handled gracefully
- ✓ No server crash
- ✓ Database can store or rejects appropriately

---

### TC-API-VAL-007: Null Values in Required Fields
**Endpoint**: `POST /api/companies`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": null,
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Validation error indicating company_name cannot be null

**Validation**:
- ✓ Status code is 400
- ✓ Null values rejected for required fields

---

### TC-API-VAL-008: Null Values in Optional Fields
**Endpoint**: `POST /api/companies`

**curl Command**:
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "vendor",
    "email": null
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Company created
- **IMPORTANT**: email field should be null or omitted in response, NOT empty string
- **Verify DEF-007 fix**: Null optional fields accepted

**Validation**:
- ✓ Status code is 201
- ✓ Company created
- ✓ email is null or omitted, not ""

---

### TC-API-VAL-009: Extra Fields in Request
**Endpoint**: `POST /api/companies`

**curl Command** (includes unexpected field):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "vendor",
    "unexpected_field": "value"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created` (ignore extra field) OR `400 Bad Request` (strict validation)
- Response Body: Company created without extra field OR validation error

**Validation**:
- ✓ Extra fields either ignored or rejected
- ✓ Expected fields processed correctly

---

### TC-API-VAL-010: Case Sensitivity in Enum Values
**Endpoint**: `POST /api/companies`

**curl Command** (lowercase enum value):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "VENDOR"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request` (if case-sensitive) OR `201 Created` (if case-insensitive)
- Response Body: Error or success

**Validation**:
- ✓ Enum validation consistent
- ✓ Case handling documented

---

### TC-API-VAL-011: Unicode Characters
**Endpoint**: `POST /api/companies`

**curl Command** (Unicode characters):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test 公司 🏢",
    "company_type": "vendor"
  }' \
  -v
```

**Expected**:
- HTTP Status: `201 Created`
- Response Body: Company created with Unicode characters preserved

**Validation**:
- ✓ Status code is 201
- ✓ Unicode characters stored and retrieved correctly

---

### TC-API-VAL-012: Email Format Validation
**Endpoint**: `POST /api/companies`

**curl Command** (invalid email):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "vendor",
    "email": "not-an-email"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request` (if email validation) OR `201 Created` (if no validation)
- Response Body: Validation error or success

**Validation**:
- ✓ Email validation behavior consistent
- ✓ Clear error message if rejected

---

### TC-API-VAL-013: URL Format Validation
**Endpoint**: `POST /api/companies`

**curl Command** (invalid URL):
```bash
curl -X POST "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_type": "vendor",
    "website": "not a url"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request` (if URL validation) OR `201 Created` (if no validation)
- Response Body: Validation error or success

**Validation**:
- ✓ URL validation behavior consistent
- ✓ Clear error message if rejected

---

### TC-API-VAL-014: Date Format Validation
**Endpoint**: `POST /api/devices`

**curl Command** (invalid date format):
```bash
curl -X POST "http://localhost:3001/api/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "test-device",
    "device_type": "server",
    "purchase_date": "not-a-date"
  }' \
  -v
```

**Expected**:
- HTTP Status: `400 Bad Request`
- Response Body: Validation error indicating invalid date format

**Validation**:
- ✓ Status code is 400
- ✓ Error message indicates date format issue

---

### TC-API-VAL-015: Concurrent Updates (Race Condition)
**Endpoint**: `PATCH /api/companies/[id]`

**curl Commands** (two simultaneous updates):
```bash
# Terminal 1
curl -X PATCH "http://localhost:3001/api/companies/[uuid]" \
  -H "Content-Type: application/json" \
  -d '{"phone": "555-1111"}' &

# Terminal 2 (immediately after)
curl -X PATCH "http://localhost:3001/api/companies/[uuid]" \
  -H "Content-Type: application/json" \
  -d '{"phone": "555-2222"}' &
```

**Expected**:
- Both HTTP Status: `200 OK`
- Final state: phone is either "555-1111" or "555-2222" (last write wins)
- No data corruption or server crash

**Validation**:
- ✓ Both requests succeed
- ✓ Final state is one of the two values
- ✓ No data corruption

---

## Testing Execution Notes

### Setup
```bash
# Start development server
npm run dev

# Verify running on http://localhost:3001

# Verify database accessible
psql -h 192.168.64.2 -U moss -d moss -c "SELECT COUNT(*) FROM companies;"
```

### curl Best Practices
- Use `-v` for verbose output (shows HTTP status, headers)
- Use `-i` to include response headers (alternative to -v)
- Use `-s` for silent mode + `jq` for JSON formatting:
  ```bash
  curl -s http://localhost:3001/api/companies | jq
  ```
- Save responses to files for documentation:
  ```bash
  curl http://localhost:3001/api/companies > response.json
  ```

### Response Time Testing
Add timing to curl:
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3001/api/companies
```

### Test Result Documentation
For each test case, document:
1. **Test ID**: TC-API-XXX-XXX
2. **Status**: ✅ PASS / ❌ FAIL
3. **curl Command**: Exact command used
4. **HTTP Status**: Status code received
5. **Response Body**: JSON response (truncated if long)
6. **Response Time**: Time taken (if relevant)
7. **Notes**: Any observations
8. **Defect ID**: If failed, reference DEF-UAT-XXX

---

## Estimated Execution Time

- **Setup**: 15 minutes
- **Core Object APIs**: 16 objects × 21 tests × 1 min = 5.6 hours
- **Special Endpoints**: 3 tests × 5 min = 15 minutes
- **Admin APIs**: 10 tests × 3 min = 30 minutes
- **Junction Table APIs**: 14 tests × 2 min = 28 minutes
- **Validation & Security**: 15 tests × 5 min = 1.25 hours
- **Documentation**: 2 hours

**Total**: ~10 hours

---

## Success Criteria

- **Pass Rate Target**: ≥95%
- **Critical Issues**: 0 (SQL injection, data corruption, security vulnerabilities)
- **High Issues**: ≤3
- **All curl commands documented**
- **All HTTP status codes verified**
- **All response bodies validated**

---

**Agent Owner**: API/Backend Testing Agent
**Output File**: UAT-RESULTS-API-BACKEND.md
**Status**: Ready for execution
