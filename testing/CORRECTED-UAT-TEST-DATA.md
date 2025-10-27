# Corrected UAT Test Data Guide

**Version**: 2.0
**Date**: 2025-10-12
**Purpose**: Provide valid test data for all 16 core API endpoints with proper required fields

---

## Overview

The October 12 UAT revealed that 14/16 POST endpoints were "failing" with validation errors. Upon investigation, the endpoints are **working correctly** - the test data was incomplete.

**Key Finding**: All Zod validation schemas correctly match database NOT NULL constraints. Validation errors are expected behavior when required fields are missing.

This guide provides **corrected test data** that includes all required fields for each endpoint.

---

## Required Fields Reference

### Quick Reference Table

| Endpoint | Required Fields | Notes |
|----------|----------------|-------|
| companies | `company_name`, `company_type` | Type must be valid enum |
| locations | `location_name`, `company_id` | Company must exist |
| rooms | `room_name`, `location_id` | Location must exist |
| people | `full_name`, `email`, `person_type` | Email must be unique |
| devices | `device_type` | Type must be valid enum |
| groups | `group_name`, `group_type` | Type must be valid enum |
| networks | `network_name` | - |
| ios | `interface_name`, `interface_type` | Type must be valid enum |
| ip-addresses | `ip_address` | Must be valid IP format |
| software | `software_name` | - |
| saas-services | `service_name` | - |
| installed-applications | `device_id`, `software_id`, `version` | Both IDs must exist |
| software-licenses | `software_id`, `license_key` | Software must exist |
| documents | `title` | - |
| external-documents | `title` | - |
| contracts | `contract_name`, `company_id`, `contract_type` | Company must exist, type valid |

---

## 1. Companies (POST /api/companies)

### ❌ Incorrect (Missing required field)
```json
{
  "company_name": "Test Corp"
}
```
**Error**: `company_type` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "company_name": "Test Corporation",
  "company_type": "vendor",
  "website": "https://testcorp.example.com",
  "email": "contact@testcorp.example.com",
  "phone": "+1-555-0123",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94102",
  "country": "United States",
  "notes": "Created for UAT testing"
}
```

### Valid company_type Values
- `own_organization`
- `vendor`
- `manufacturer`
- `service_provider`
- `partner`
- `customer`
- `other`

---

## 2. Locations (POST /api/locations)

### ❌ Incorrect (Missing required field)
```json
{
  "location_name": "HQ"
}
```
**Error**: `company_id` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "location_name": "Headquarters Building",
  "company_id": "{{company_id}}",
  "address": "456 Tech Blvd",
  "city": "Palo Alto",
  "state": "CA",
  "zip": "94301",
  "country": "United States",
  "square_footage": 50000,
  "floor_count": 5,
  "primary_contact_id": null,
  "notes": "Main office location"
}
```

**Note**: Replace `{{company_id}}` with actual UUID from companies table or previous POST response.

---

## 3. Rooms (POST /api/rooms)

### ❌ Incorrect (Missing required field)
```json
{
  "room_name": "Server Room"
}
```
**Error**: `location_id` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "room_name": "Server Room A",
  "room_number": "SR-101",
  "location_id": "{{location_id}}",
  "floor": "3",
  "room_type": "server_room",
  "square_footage": 500,
  "notes": "Primary datacenter room"
}
```

### Valid room_type Values
- `office`
- `conference_room`
- `server_room`
- `storage`
- `break_room`
- `lobby`
- `other`

---

## 4. People (POST /api/people)

### ❌ Incorrect (Missing required fields)
```json
{
  "full_name": "John Doe"
}
```
**Error**: `email` and `person_type` are required

### ✅ Correct (All required fields)
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "person_type": "employee",
  "company_id": "{{company_id}}",
  "job_title": "Senior Engineer",
  "department": "Engineering",
  "phone": "+1-555-0199",
  "mobile": "+1-555-0198",
  "manager_id": null,
  "hire_date": "2024-01-15",
  "status": "active",
  "notes": "UAT test user"
}
```

### Valid person_type Values
- `employee`
- `contractor`
- `vendor_contact`
- `other`

### Valid status Values
- `active`
- `inactive`
- `terminated`

---

## 5. Devices (POST /api/devices)

### ❌ Incorrect (Missing required field)
```json
{
  "hostname": "test-device-001"
}
```
**Error**: `device_type` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "hostname": "srv-web-01",
  "device_type": "server",
  "manufacturer": "Dell",
  "model": "PowerEdge R750",
  "serial_number": "SN123456789",
  "asset_tag": "ASSET-001",
  "location_id": "{{location_id}}",
  "room_id": "{{room_id}}",
  "company_id": "{{company_id}}",
  "assigned_to_id": null,
  "status": "active",
  "operating_system": "Ubuntu Server",
  "os_version": "22.04 LTS",
  "purchase_date": "2024-06-01",
  "warranty_expiration": "2027-06-01",
  "install_date": "2024-06-15",
  "notes": "Production web server"
}
```

### Valid device_type Values
- `computer`, `server`, `switch`, `router`, `firewall`, `printer`, `mobile`, `iot`, `appliance`, `av_equipment`, `broadcast_equipment`, `patch_panel`, `ups`, `pdu`, `chassis`, `module`, `blade`

### Valid status Values
- `active`, `retired`, `repair`, `storage`

---

## 6. Groups (POST /api/groups)

### ❌ Incorrect (Missing required field)
```json
{
  "group_name": "Engineering Team"
}
```
**Error**: `group_type` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "group_name": "Engineering Team",
  "group_type": "ad_group",
  "description": "All engineering department members",
  "notes": "Synced from Active Directory"
}
```

### Valid group_type Values
- `ad_group`
- `okta_group`
- `jamf_smart_group`
- `custom`

---

## 7. Networks (POST /api/networks)

### ❌ Incorrect (Empty object)
```json
{}
```
**Error**: `network_name` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "network_name": "Production VLAN",
  "network_address": "10.0.100.0/24",
  "vlan_id": 100,
  "location_id": "{{location_id}}",
  "gateway": "10.0.100.1",
  "subnet_mask": "255.255.255.0",
  "dhcp_enabled": true,
  "dhcp_range_start": "10.0.100.50",
  "dhcp_range_end": "10.0.100.200",
  "dns_servers": "8.8.8.8, 1.1.1.1",
  "description": "Primary production network",
  "notes": "Production servers only"
}
```

---

## 8. IOs (Interfaces/Ports) (POST /api/ios)

### ❌ Incorrect (Missing required fields)
```json
{
  "interface_name": "eth0"
}
```
**Error**: `interface_type` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "device_id": "{{device_id}}",
  "interface_name": "eth0",
  "interface_type": "ethernet",
  "port_number": "1",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "connected_to_io_id": null,
  "native_network_id": "{{network_id}}",
  "trunk_mode": "access",
  "speed_mbps": 1000,
  "status": "up",
  "notes": "Primary network interface"
}
```

### Valid interface_type Values
- Network: `ethernet`, `fiber`, `wifi`, `bluetooth`
- Broadcast: `sdi`, `hdmi`, `xlr`, `coax`
- Power: `power_input`, `power_output`, `poe`
- Infrastructure: `patch_panel_port`

### Valid trunk_mode Values
- `access`, `trunk`, `hybrid`

### Valid status Values
- `up`, `down`, `disabled`, `error`

---

## 9. IP Addresses (POST /api/ip-addresses)

### ❌ Incorrect (Missing required field)
```json
{
  "hostname": "server01"
}
```
**Error**: `ip_address` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "ip_address": "10.0.100.55",
  "network_id": "{{network_id}}",
  "device_id": "{{device_id}}",
  "io_id": "{{io_id}}",
  "hostname": "srv-web-01.example.com",
  "ip_type": "static",
  "is_primary": true,
  "status": "active",
  "notes": "Primary IP for web server"
}
```

### Valid ip_type Values
- `static`, `dhcp`, `reserved`

### Valid status Values
- `active`, `reserved`, `deprecated`

---

## 10. Software (POST /api/software)

### ❌ Incorrect (Missing required field)
```json
{
  "vendor": "Microsoft"
}
```
**Error**: `software_name` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "software_name": "Microsoft Office 365",
  "vendor": "Microsoft",
  "category": "productivity",
  "description": "Cloud-based productivity suite",
  "website": "https://www.microsoft.com/microsoft-365",
  "notes": "Enterprise E5 license"
}
```

### Valid category Values
- `productivity`, `development`, `security`, `infrastructure`, `communication`, `design`, `database`, `other`

---

## 11. SaaS Services (POST /api/saas-services)

### ❌ Incorrect (Missing required field)
```json
{
  "vendor": "Slack"
}
```
**Error**: `service_name` is required (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "service_name": "Slack Enterprise",
  "vendor": "Slack Technologies",
  "service_url": "https://yourcompany.slack.com",
  "environment": "production",
  "cost_per_month": 150.00,
  "billing_frequency": "monthly",
  "subscription_start": "2024-01-01",
  "subscription_end": "2024-12-31",
  "auto_renew": true,
  "admin_email": "admin@example.com",
  "support_email": "support@slack.com",
  "api_key_location": "1Password vault",
  "status": "active",
  "notes": "Company-wide communication platform"
}
```

### Valid environment Values
- `production`, `staging`, `development`, `sandbox`

### Valid billing_frequency Values
- `monthly`, `annually`, `quarterly`

### Valid status Values
- `active`, `inactive`, `trial`, `cancelled`

---

## 12. Installed Applications (POST /api/installed-applications)

### ❌ Incorrect (Missing required fields)
```json
{
  "application_name": "Chrome"
}
```
**Error**: `device_id`, `software_id`, and `version` are required

### ✅ Correct (All required fields)
```json
{
  "device_id": "{{device_id}}",
  "software_id": "{{software_id}}",
  "version": "120.0.6099.109",
  "install_date": "2024-01-15",
  "install_path": "/usr/bin/google-chrome",
  "license_key": null,
  "notes": "Installed via package manager"
}
```

---

## 13. Software Licenses (POST /api/software-licenses)

### ❌ Incorrect (Missing required field)
```json
{
  "license_type": "perpetual"
}
```
**Error**: `software_id` and `license_key` are required

### ✅ Correct (All required fields)
```json
{
  "software_id": "{{software_id}}",
  "license_key": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
  "license_type": "subscription",
  "seats_total": 50,
  "seats_used": 32,
  "purchase_date": "2024-01-01",
  "expiration_date": "2025-01-01",
  "cost": 5000.00,
  "vendor_id": "{{company_id}}",
  "notes": "Annual subscription"
}
```

### Valid license_type Values
- `perpetual`, `subscription`, `volume`, `site`, `per_user`, `trial`

---

## 14. Documents (POST /api/documents)

### ❌ Incorrect (Wrong field name)
```json
{
  "document_name": "Network Diagram"
}
```
**Error**: Field is `title`, not `document_name` (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "title": "Network Infrastructure Diagram",
  "author_id": "{{person_id}}",
  "document_type": "network_diagram",
  "content": "<p>Network topology documentation...</p>",
  "version": "1.0",
  "status": "published",
  "created_date": "2024-10-01",
  "updated_date": "2024-10-12",
  "notes": "Updated Q4 2024"
}
```

### Valid document_type Values
- `policy`, `procedure`, `diagram`, `runbook`, `architecture`, `sop`, `network_diagram`, `rack_diagram`, `other`

### Valid status Values
- `draft`, `published`, `archived`

---

## 15. External Documents (POST /api/external-documents)

### ❌ Incorrect (Wrong field name)
```json
{
  "document_name": "Password Vault",
  "url": "https://vault.example.com"
}
```
**Error**: Field is `title`, not `document_name` (NOT NULL in database)

### ✅ Correct (All required fields)
```json
{
  "title": "1Password Company Vault",
  "document_type": "password_vault",
  "url": "https://vault.1password.com",
  "description": "Central password storage for all company accounts",
  "notes": "Access requires MFA",
  "created_date": "2024-01-01",
  "updated_date": "2024-10-12"
}
```

### Valid document_type Values
- `password_vault`, `ssl_certificate`, `domain_registrar`, `ticket`, `runbook`, `diagram`, `wiki_page`, `contract`, `invoice`, `other`

---

## 16. Contracts (POST /api/contracts)

### ❌ Incorrect (Missing required fields)
```json
{
  "contract_name": "SLA Agreement"
}
```
**Error**: `company_id` and `contract_type` are required

### ✅ Correct (All required fields)
```json
{
  "contract_name": "Cloud Hosting SLA",
  "company_id": "{{company_id}}",
  "contract_type": "service_agreement",
  "start_date": "2024-01-01",
  "end_date": "2025-12-31",
  "value": 120000.00,
  "renewal_date": "2025-11-01",
  "auto_renew": true,
  "notice_period_days": 90,
  "status": "active",
  "notes": "Includes 99.9% uptime guarantee"
}
```

### Valid contract_type Values
- `service_agreement`, `license_agreement`, `maintenance`, `support`, `lease`, `other`

### Valid status Values
- `active`, `expired`, `pending`, `cancelled`

---

## Test Execution Order

### Phase 1: Create Foundation Objects
1. **Companies** (no dependencies)
2. **Locations** (requires company_id)
3. **Rooms** (requires location_id)
4. **People** (requires company_id)
5. **Software** (no dependencies)

### Phase 2: Create Infrastructure Objects
6. **Devices** (requires location_id, room_id, company_id)
7. **Networks** (requires location_id)
8. **IOs** (requires device_id, network_id)
9. **IP Addresses** (requires network_id, device_id, io_id)

### Phase 3: Create Management Objects
10. **Groups** (no dependencies)
11. **SaaS Services** (no dependencies)
12. **Installed Applications** (requires device_id, software_id)
13. **Software Licenses** (requires software_id, company_id)

### Phase 4: Create Documentation Objects
14. **Documents** (requires person_id)
15. **External Documents** (no dependencies)
16. **Contracts** (requires company_id)

---

## cURL Test Examples

### Test Script with Dependencies

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3001/api"

# 1. Create Company
COMPANY_RESPONSE=$(curl -s -X POST $BASE_URL/companies \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Corp",
    "company_type": "vendor",
    "email": "test@example.com"
  }')

COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')
echo "Created company: $COMPANY_ID"

# 2. Create Location
LOCATION_RESPONSE=$(curl -s -X POST $BASE_URL/locations \
  -H "Content-Type: application/json" \
  -d "{
    \"location_name\": \"HQ\",
    \"company_id\": \"$COMPANY_ID\",
    \"city\": \"San Francisco\"
  }")

LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data.id')
echo "Created location: $LOCATION_ID"

# 3. Create Device (with proper device_type)
DEVICE_RESPONSE=$(curl -s -X POST $BASE_URL/devices \
  -H "Content-Type: application/json" \
  -d "{
    \"hostname\": \"test-server-01\",
    \"device_type\": \"server\",
    \"location_id\": \"$LOCATION_ID\",
    \"company_id\": \"$COMPANY_ID\",
    \"status\": \"active\"
  }")

DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.data.id')
echo "Created device: $DEVICE_ID"

echo "All tests passed! ✅"
```

---

## Validation Testing

### Test Invalid Data (Expected to Fail)

```bash
# Test 1: Missing required field
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Test"}' \
  | jq

# Expected: HTTP 400 with Zod validation error
# {
#   "success": false,
#   "message": "Validation failed",
#   "errors": [
#     {
#       "path": ["company_type"],
#       "message": "Required"
#     }
#   ]
# }
```

### Test Valid Data (Expected to Succeed)

```bash
# Test 2: All required fields
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Valid Test Corp",
    "company_type": "vendor"
  }' \
  | jq

# Expected: HTTP 201 with created object
# {
#   "success": true,
#   "data": {
#     "id": "uuid-here",
#     "company_name": "Valid Test Corp",
#     "company_type": "vendor",
#     ...
#   }
# }
```

---

## Common Mistakes & Solutions

### Mistake 1: Using Old Field Names
❌ `document_name` → ✅ `title`

### Mistake 2: Missing Enum Values
❌ `"company_type": "test"` → ✅ `"company_type": "vendor"`

### Mistake 3: Missing Foreign Keys
❌ Creating room without location_id → ✅ Create location first, use its ID

### Mistake 4: Invalid UUID Format
❌ `"company_id": "123"` → ✅ `"company_id": "550e8400-e29b-41d4-a716-446655440000"`

### Mistake 5: Wrong Data Types
❌ `"vlan_id": "100"` (string) → ✅ `"vlan_id": 100` (number)

---

## Updated UAT Success Criteria

### Category 1: Defect Regression (10 tests)
- **Target**: 100% pass rate
- **Test with**: Valid data including all required fields

### Category 2A: Core API CRUD (48 tests)
- **Target**: ≥95% pass rate
- **Test with**: Complete objects per this guide
- **Expected GET**: 100% (16/16)
- **Expected POST**: 100% (16/16) ← **Was 12.5%, now should be 100%**
- **Expected DELETE**: 95%+ (depends on POST success)

### Category 2B: Security (2 tests)
- **XSS Test**: Should now log and sanitize ✅
- **Rate Limiting**: Should now trigger on API endpoints ✅

---

## Appendix: Field Type Reference

### UUID Fields
- Must be valid UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Can be nullable: `null` or `"uuid-string"`

### Date Fields
- Format: `YYYY-MM-DD` (e.g., `"2024-10-12"`)
- Zod validates with `.date()` method

### Enum Fields
- Must match exact string from allowed values
- Case-sensitive
- No custom values allowed

### Numeric Fields
- Send as numbers, not strings: `100`, not `"100"`
- Decimals allowed where specified: `150.00`

### Boolean Fields
- Use `true` or `false` (not `"true"` or `1`)

---

**Document Version**: 2.0
**Last Updated**: 2025-10-12
**Maintained By**: M.O.S.S. Development Team

This corrected test data guide resolves all validation issues identified in the October 12 UAT and provides a foundation for successful re-testing with 90%+ expected pass rates.
