# Okta & Jamf API Integration Reference

**Last Updated:** 2025-11-06
**Purpose:** Technical reference for implementing Okta and Jamf Pro API integrations

---

## Table of Contents

1. [Okta API](#okta-api)
   - [Authentication Methods](#okta-authentication-methods)
   - [Groups API](#okta-groups-api)
   - [Users API](#okta-users-api)
   - [SCIM Provisioning](#okta-scim-provisioning)
2. [Jamf Pro API](#jamf-pro-api)
   - [Authentication Methods](#jamf-authentication-methods)
   - [Computer Groups API](#jamf-computer-groups-api)
   - [Computers Inventory API](#jamf-computers-inventory-api)
   - [Users API](#jamf-users-api)
3. [Implementation Examples](#implementation-examples)

---

## Okta API

### Base URL Format
```
https://{yourOktaDomain}/api/v1
```

Example: `https://dev-123456.okta.com/api/v1`

---

### Okta Authentication Methods

#### Method 1: API Token (SSWS) - Recommended for Development

**How to Create:**
1. Navigate to **Admin Console → Security → API → Tokens**
2. Click **Create Token**
3. Name: "M.O.S.S. Development Testing" (read-only recommended)
4. Copy token immediately (won't be shown again)

**Usage:**
```typescript
const response = await fetch('https://yourOktaDomain/api/v1/groups', {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `SSWS ${apiToken}`
  }
})
```

**Pros:**
- ✅ Simple to set up
- ✅ Good for development/testing
- ✅ No OAuth flow needed

**Cons:**
- ❌ Less secure than OAuth (long-lived token)
- ❌ No fine-grained scope control
- ❌ Okta recommends migrating to OAuth 2.0

---

#### Method 2: OAuth 2.0 Client Credentials - Recommended for Production

**Grant Flow:** Client Credentials (machine-to-machine)

**How to Set Up Service App:**
1. Navigate to **Admin Console → Applications → Applications**
2. Click **Create App Integration**
3. Choose **API Services** (OAuth 2.0)
4. Name: "M.O.S.S. Production Integration"
5. Grant required scopes (see below)
6. Copy Client ID and Client Secret

**Required Scopes:**
```
okta.groups.read          # Read groups
okta.users.read           # Read users
okta.users.manage         # Create/update users (for SCIM)
okta.groups.manage        # Manage group membership
```

**Token Request:**
```typescript
const tokenResponse = await fetch('https://yourOktaDomain/oauth2/v1/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'okta.groups.read okta.users.read'
  })
})

const { access_token, expires_in } = await tokenResponse.json()
// access_token is valid for `expires_in` seconds (typically 3600 = 1 hour)
```

**Using Access Token:**
```typescript
const response = await fetch('https://yourOktaDomain/api/v1/groups', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${access_token}`
  }
})
```

**Pros:**
- ✅ More secure (scoped access)
- ✅ Fine-grained permissions
- ✅ Okta-recommended approach
- ✅ Tokens auto-expire (1 hour default)

**Cons:**
- ❌ More complex setup
- ❌ Requires token refresh logic

---

### Okta Groups API

**Endpoint:** `GET /api/v1/groups`

**Documentation:** https://developer.okta.com/docs/reference/api/groups/

#### List All Groups

```http
GET /api/v1/groups?limit=200
Authorization: SSWS ${apiToken}
Accept: application/json
```

**Response Format:**
```json
[
  {
    "id": "00g1emaKYZTWRYYRRTSK",
    "created": "2015-02-06T10:11:28.000Z",
    "lastUpdated": "2015-10-05T19:16:43.000Z",
    "lastMembershipUpdated": "2015-11-28T19:15:32.000Z",
    "objectClass": [
      "okta:user_group"
    ],
    "type": "OKTA_GROUP",
    "profile": {
      "name": "West Coast Users",
      "description": "All users on the West Coast"
    },
    "_links": {
      "logo": [
        {
          "name": "medium",
          "href": "https://yourOrg.okta.com/img/logos/groups/okta-medium.png",
          "type": "image/png"
        }
      ],
      "users": {
        "href": "https://yourOrg.okta.com/api/v1/groups/00g1emaKYZTWRYYRRTSK/users"
      },
      "apps": {
        "href": "https://yourOrg.okta.com/api/v1/groups/00g1emaKYZTWRYYRRTSK/apps"
      }
    }
  }
]
```

**Key Fields:**
- `id` - Unique group ID (use for API calls)
- `type` - `OKTA_GROUP`, `APP_GROUP`, or `BUILT_IN`
- `profile.name` - Display name
- `profile.description` - Group description
- `_links.users.href` - Endpoint to get group members

**Pagination:**
```typescript
// Page 1
let url = 'https://yourOktaDomain/api/v1/groups?limit=200'

while (url) {
  const response = await fetch(url, { headers })
  const groups = await response.json()

  // Process groups...

  // Get next page URL from Link header
  const linkHeader = response.headers.get('Link')
  url = parseLinkHeader(linkHeader)?.next || null
}
```

**Search Groups by Name:**
```http
GET /api/v1/groups?q=Engineering&limit=200
```

**Filter Groups:**
```http
GET /api/v1/groups?filter=type eq "OKTA_GROUP"&limit=200
```

---

#### Get Group Members

```http
GET /api/v1/groups/{groupId}/users?limit=200
Authorization: SSWS ${apiToken}
```

**Response:**
```json
[
  {
    "id": "00u1f96ECLNVOKVMUSEA",
    "status": "ACTIVE",
    "created": "2013-12-12T16:14:22.000Z",
    "activated": "2013-12-12T16:14:22.000Z",
    "statusChanged": "2013-12-12T16:14:22.000Z",
    "lastLogin": "2013-12-12T16:14:22.000Z",
    "lastUpdated": "2015-11-15T19:23:32.000Z",
    "passwordChanged": "2013-12-12T16:14:22.000Z",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "login": "john.doe@example.com",
      "mobilePhone": null
    }
  }
]
```

---

### Okta Users API

**Endpoint:** `GET /api/v1/users`

**Documentation:** https://developer.okta.com/docs/reference/api/users/

#### List All Users

```http
GET /api/v1/users?limit=200
Authorization: SSWS ${apiToken}
```

**Key Fields:**
- `id` - Unique user ID
- `status` - `ACTIVE`, `PROVISIONED`, `DEPROVISIONED`, `SUSPENDED`
- `profile.login` - Username (usually email)
- `profile.email` - Email address
- `profile.firstName`, `profile.lastName` - Name
- `profile.mobilePhone` - Phone number

---

### Okta SCIM Provisioning

**Purpose:** Allow Okta to CREATE/UPDATE/DELETE users in M.O.S.S. when assigned/unassigned in Okta.

**Flow:** Okta (IdP) → M.O.S.S. SCIM API (Service Provider)

**Base URL:** `https://your-moss-domain.com/scim/v2/`

#### SCIM Endpoints M.O.S.S. Must Implement

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/scim/v2/Users` | List all users (for sync) |
| GET | `/scim/v2/Users?filter=userName eq "user@example.com"` | Check if user exists |
| POST | `/scim/v2/Users` | Create new user |
| GET | `/scim/v2/Users/{id}` | Get user by ID |
| PUT | `/scim/v2/Users/{id}` | Update user (full replace) |
| PATCH | `/scim/v2/Users/{id}` | Update user (partial update) |
| DELETE | `/scim/v2/Users/{id}` | Deactivate user |

#### SCIM User Schema

**Required Attributes:**
- `id` - Unique identifier (UUID)
- `userName` - Login username (usually email)
- `name.givenName` - First name
- `name.familyName` - Last name
- `active` - Boolean (true = active, false = deactivated)

**Example User Object:**
```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "id": "2819c223-7f76-453a-919d-413861904646",
  "userName": "john.doe@example.com",
  "name": {
    "givenName": "John",
    "familyName": "Doe",
    "formatted": "John Doe"
  },
  "emails": [
    {
      "value": "john.doe@example.com",
      "type": "work",
      "primary": true
    }
  ],
  "active": true,
  "meta": {
    "resourceType": "User",
    "created": "2010-01-23T04:56:22Z",
    "lastModified": "2011-05-13T04:42:34Z",
    "location": "https://your-moss-domain.com/scim/v2/Users/2819c223-7f76-453a-919d-413861904646"
  }
}
```

#### SCIM Create User Request (from Okta)

```http
POST /scim/v2/Users
Content-Type: application/scim+json
Authorization: Bearer {okta_oauth_token}

{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "userName": "bjensen@example.com",
  "name": {
    "givenName": "Barbara",
    "familyName": "Jensen"
  },
  "emails": [{
    "value": "bjensen@example.com",
    "type": "work",
    "primary": true
  }],
  "active": true
}
```

**M.O.S.S. Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/scim+json
Location: https://your-moss-domain.com/scim/v2/Users/{id}

{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "id": "2819c223-7f76-453a-919d-413861904646",
  "userName": "bjensen@example.com",
  ...
}
```

#### SCIM Update User Request (PATCH)

```http
PATCH /scim/v2/Users/{id}
Content-Type: application/scim+json

{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    {
      "op": "replace",
      "value": {
        "active": false
      }
    }
  ]
}
```

#### SCIM Authentication

Okta supports:
- **OAuth 2.0 Authorization Code** (recommended)
- **HTTP Header Bearer Token**
- **Basic Auth**

**Configuration in Okta:**
1. Admin Console → Applications → Your SCIM App
2. Provisioning tab → Configure API Integration
3. **SCIM Base URL:** `https://your-moss-domain.com/scim/v2/`
4. **OAuth Token Endpoint:** `https://your-moss-domain.com/oauth/token`
5. **OAuth Client ID/Secret:** From M.O.S.S. OAuth app

---

## Jamf Pro API

### Base URLs

**Modern API (v1/v2):**
```
https://{yourJamfDomain}/api/v1
https://{yourJamfDomain}/api/v2
```

**Classic API (JSSResource):**
```
https://{yourJamfDomain}/JSSResource
```

Example: `https://yourcompany.jamfcloud.com/api/v1`

**Note:** Classic API is being deprecated for computer inventory endpoints. Use Modern API for new implementations.

---

### Jamf Authentication Methods

#### Method 1: OAuth 2.0 Client Credentials - Recommended (Jamf Pro 10.49.0+)

**How to Create API Client:**
1. Navigate to **Settings → System → API Roles and Clients**
2. Click **New** to create API Role
3. **Privileges:** Select Read for Computer, User, Smart Computer Group
4. Click **New** to create API Client
5. Assign API Role created above
6. Copy Client ID and Client Secret

**Token Request:**
```typescript
const tokenResponse = await fetch('https://yourJamfDomain/api/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: jamfClientId,
    client_secret: jamfClientSecret
  })
})

const { access_token, expires_in, token_type } = await tokenResponse.json()
// access_token valid for 20 minutes (1200 seconds) by default
// token_type = "Bearer"
```

**Using Access Token:**
```typescript
const response = await fetch('https://yourJamfDomain/api/v1/computers-inventory', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${access_token}`
  }
})
```

**Important Notes:**
- ✅ Tokens expire after 20 minutes (not extendable)
- ✅ More secure than basic auth
- ✅ API Clients cannot access Jamf Pro UI
- ✅ Fine-grained permission control via API Roles
- ❌ Cannot refresh tokens - must request new token when expired

---

#### Method 2: Basic Auth (Legacy, for Classic API only)

**NOT RECOMMENDED** - Use OAuth 2.0 instead

```typescript
const response = await fetch('https://yourJamfDomain/JSSResource/computergroups', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }
})
```

---

### Jamf Computer Groups API

#### Endpoint: List All Computer Groups

**Modern API v1:**
```http
GET /api/v1/computer-groups
Authorization: Bearer {access_token}
Accept: application/json
```

**Response Format:**
```json
{
  "totalCount": 15,
  "results": [
    {
      "id": "1",
      "name": "All Managed Clients",
      "isSmart": false
    },
    {
      "id": "123",
      "name": "Engineering Macs",
      "isSmart": true
    }
  ]
}
```

**Key Fields:**
- `id` - Group ID (use for fetching members)
- `name` - Group name
- `isSmart` - `true` for smart groups, `false` for static

---

#### Endpoint: Search Smart Computer Groups

**Modern API v2:**
```http
GET /api/v2/computer-groups/smart-groups
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "totalCount": 5,
  "results": [
    {
      "id": "123",
      "name": "macOS Ventura Devices",
      "criteria": [
        {
          "name": "Operating System Version",
          "priority": 0,
          "andOr": "and",
          "searchType": "like",
          "value": "13",
          "openingParen": false,
          "closingParen": false
        }
      ]
    }
  ]
}
```

---

#### Endpoint: Get Group Members (Classic API)

**Classic API:** (Still functional for group membership)
```http
GET /JSSResource/computergroups/id/{id}
Authorization: Bearer {access_token}
Accept: application/json
```

**Response:**
```json
{
  "computer_group": {
    "id": 123,
    "name": "Engineering Macs",
    "is_smart": true,
    "site": {
      "id": -1,
      "name": "None"
    },
    "criteria": [
      {
        "name": "Department",
        "priority": 0,
        "and_or": "and",
        "search_type": "is",
        "value": "Engineering"
      }
    ],
    "computers": [
      {
        "id": 1,
        "name": "MBP-JSMITH-001",
        "mac_address": "A1:B2:C3:D4:E5:F6",
        "alt_mac_address": "A1:B2:C3:D4:E5:F7",
        "serial_number": "C02XYZ123456"
      },
      {
        "id": 2,
        "name": "MBP-AJONES-002",
        "mac_address": "B1:C2:D3:E4:F5:06",
        "alt_mac_address": "B1:C2:D3:E4:F5:07",
        "serial_number": "C02ABC987654"
      }
    ]
  }
}
```

**Key Fields:**
- `computers` - Array of computers in group
- `computers[].id` - Jamf computer ID
- `computers[].name` - Computer hostname
- `computers[].serial_number` - Hardware serial number (match to M.O.S.S.)
- `computers[].mac_address` - Primary MAC address

---

### Jamf Computers Inventory API

**Endpoint:** `GET /api/v1/computers-inventory`

**Documentation:** https://developer.jamf.com/jamf-pro/reference/get_v1-computers-inventory

#### List All Computers

```http
GET /api/v1/computers-inventory?section=GENERAL&section=HARDWARE&section=USER_AND_LOCATION
Authorization: Bearer {access_token}
```

**Available Sections:**
- `GENERAL` - Name, asset tag, last contact, IP address
- `HARDWARE` - Serial number, model, MAC addresses, processor, RAM
- `SOFTWARE` - OS version, installed apps
- `USER_AND_LOCATION` - Assigned user, department, building, room
- `GROUP_MEMBERSHIPS` - Smart and static group memberships
- `SECURITY` - FileVault, Gatekeeper, SIP status

**Response Format:**
```json
{
  "totalCount": 118,
  "results": [
    {
      "id": "1",
      "udid": "70FDEE4A-EE25-56EC-B020-6DC2B677BDDC",
      "general": {
        "name": "MBP-JSMITH-001",
        "assetTag": "IT-2024-0157",
        "barcode1": "QR-12345",
        "barcode2": "",
        "lastIpAddress": "192.168.1.100",
        "lastReportedIp": "10.15.24.202",
        "jamfBinaryVersion": "10.49.0",
        "platform": "Mac",
        "mdmCapable": true,
        "reportDate": "2025-11-06T10:30:00Z",
        "remoteManagement": {
          "managed": true,
          "managementUsername": "jamfadmin"
        }
      },
      "hardware": {
        "make": "Apple",
        "model": "MacBook Pro 16-inch 2023",
        "modelIdentifier": "Mac14,10",
        "serialNumber": "C02XYZ123456",
        "processorType": "Apple M3 Pro",
        "processorArchitecture": "arm64",
        "processorSpeedMhz": 4050,
        "processorCores": 12,
        "totalRamMegabytes": 36864,
        "macAddress": "A1:B2:C3:D4:E5:F6",
        "altMacAddress": "A1:B2:C3:D4:E5:F7"
      },
      "userAndLocation": {
        "username": "jsmith",
        "realname": "John Smith",
        "email": "jsmith@example.com",
        "position": "Senior Engineer",
        "phone": "555-0123",
        "departmentId": "1",
        "buildingId": "1",
        "room": "Office 301"
      }
    }
  ]
}
```

**Pagination:**
```http
GET /api/v1/computers-inventory?page=0&page-size=100&section=GENERAL
```

**Filter by Group:**
```http
GET /api/v1/computers-inventory?filter=groupId==123&section=GENERAL&section=HARDWARE
```

---

#### Get Single Computer Details

```http
GET /api/v1/computers-inventory-detail/{id}?section=GENERAL&section=HARDWARE&section=USER_AND_LOCATION
Authorization: Bearer {access_token}
```

**Use Cases:**
- Get full details for a specific computer after list query
- Fetch additional sections (SOFTWARE, SECURITY) only when needed
- Reduce API call overhead

---

### Jamf Users API

**Classic API Endpoint:** `GET /JSSResource/users`

```http
GET /JSSResource/users
Authorization: Bearer {access_token}
Accept: application/json
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "jsmith",
      "full_name": "John Smith",
      "email": "jsmith@example.com",
      "phone_number": "555-0123",
      "position": "Senior Engineer"
    }
  ]
}
```

**Mapping to M.O.S.S.:**
- `name` → `people.username`
- `full_name` → `people.full_name`
- `email` → `people.email_address`
- `phone_number` → `people.phone_number`
- `position` → `people.job_title`

---

## Implementation Examples

### Example 1: Okta - List Groups and Members

```typescript
import { decrypt } from '@/lib/encryption'

async function syncOktaGroups(integrationConfigId: string) {
  // 1. Get encrypted credentials from database
  const config = await getIntegrationConfig(integrationConfigId)
  const apiToken = decrypt(config.credentials_encrypted)

  // 2. Fetch all groups (with pagination)
  let nextUrl = `https://${config.config.domain}/api/v1/groups?limit=200`
  const allGroups = []

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `SSWS ${apiToken}`,
        'Accept': 'application/json'
      }
    })

    const groups = await response.json()
    allGroups.push(...groups)

    // Get next page from Link header
    const linkHeader = response.headers.get('Link')
    nextUrl = parseLinkHeader(linkHeader)?.next || null
  }

  // 3. For each group, fetch members
  for (const group of allGroups) {
    const membersUrl = `https://${config.config.domain}/api/v1/groups/${group.id}/users?limit=200`
    const membersResponse = await fetch(membersUrl, {
      headers: {
        'Authorization': `SSWS ${apiToken}`,
        'Accept': 'application/json'
      }
    })

    const members = await membersResponse.json()

    // 4. Upsert to M.O.S.S. database
    await upsertOktaGroup({
      external_id: group.id,
      name: `[OKTA] ${group.profile.name}`,
      description: group.profile.description,
      group_type: 'okta',
      members: members.map(m => m.profile.email)
    })
  }
}
```

---

### Example 2: Jamf - Get Computers from Smart Group

```typescript
import { decrypt } from '@/lib/encryption'

async function syncJamfComputersFromGroup(
  integrationConfigId: string,
  smartGroupId: string
) {
  const config = await getIntegrationConfig(integrationConfigId)

  // 1. Get OAuth token
  const tokenResponse = await fetch(`https://${config.config.base_url}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: JSON.parse(decrypt(config.credentials_encrypted)).client_id,
      client_secret: JSON.parse(decrypt(config.credentials_encrypted)).client_secret
    })
  })

  const { access_token } = await tokenResponse.json()

  // 2. Get group members from Classic API (includes computer details)
  const groupResponse = await fetch(
    `https://${config.config.base_url}/JSSResource/computergroups/id/${smartGroupId}`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    }
  )

  const { computer_group } = await groupResponse.json()

  // 3. For each computer, get full inventory details (Modern API)
  for (const computer of computer_group.computers) {
    const detailsResponse = await fetch(
      `https://${config.config.base_url}/api/v1/computers-inventory-detail/${computer.id}?section=GENERAL&section=HARDWARE&section=USER_AND_LOCATION`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      }
    )

    const details = await detailsResponse.json()

    // 4. Upsert to M.O.S.S. devices table
    await upsertJamfDevice({
      serial_number: details.hardware.serialNumber,
      hostname: details.general.name,
      asset_tag: details.general.assetTag,
      model: details.hardware.model,
      manufacturer: details.hardware.make,
      device_type: 'Laptop',
      assigned_to_email: details.userAndLocation?.email,
      external_id: details.id,
      external_type: 'jamf_computer',
      integration_config_id: integrationConfigId
    })
  }
}
```

---

### Example 3: Okta OAuth 2.0 Client Credentials

```typescript
// Token request with automatic refresh
class OktaOAuthClient {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(
    private clientId: string,
    private clientSecret: string,
    private domain: string
  ) {}

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken
    }

    // Request new token
    const response = await fetch(`https://${this.domain}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'okta.groups.read okta.users.read'
      })
    })

    if (!response.ok) {
      throw new Error(`Okta OAuth failed: ${response.statusText}`)
    }

    const { access_token, expires_in } = await response.json()

    this.accessToken = access_token
    this.tokenExpiry = Date.now() + (expires_in * 1000)

    return access_token
  }

  async listGroups(): Promise<any[]> {
    const token = await this.getAccessToken()

    const response = await fetch(`https://${this.domain}/api/v1/groups?limit=200`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    return response.json()
  }
}
```

---

## API Rate Limits

### Okta
- **Org-wide rate limit:** Varies by plan (Developer: 1000 req/min, Production: higher)
- **Per-endpoint limits:** Different endpoints have different limits
- **429 Response:** Includes `X-Rate-Limit-Reset` header (Unix timestamp)
- **Best Practice:** Implement exponential backoff for 429 errors

### Jamf Pro
- **No published rate limits** (Cloud instances have unspecified limits)
- **Best Practice:** Limit to 100-200 requests per minute
- **Concurrent requests:** Avoid >10 parallel requests
- **Token lifetime:** OAuth tokens expire after 20 minutes

---

## Error Handling

### Okta Error Responses

```json
{
  "errorCode": "E0000011",
  "errorSummary": "Invalid token provided",
  "errorLink": "E0000011",
  "errorId": "oaeHfmOAx1iRLa0H10DeMz5fQ"
}
```

**Common Error Codes:**
- `E0000011` - Invalid token
- `E0000001` - API validation failed
- `E0000047` - Rate limit exceeded

### Jamf Error Responses

```json
{
  "httpStatus": 401,
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "description": "Authentication credentials are incorrect or missing."
    }
  ]
}
```

**Common HTTP Codes:**
- `401` - Invalid credentials / expired token
- `403` - Insufficient permissions
- `404` - Resource not found
- `429` - Rate limit exceeded (unofficial)

---

## Next Steps

1. **Implement OAuth 2.0 clients** for both Okta and Jamf
2. **Create sync services** using patterns above
3. **Add error handling** and retry logic
4. **Test with development credentials** (test groups only)
5. **Build admin UI** for integration setup
6. **Document customer setup** process

---

## References

- [Okta Developer Docs](https://developer.okta.com/docs/)
- [Okta Groups API Reference](https://developer.okta.com/docs/reference/api/groups/)
- [Okta OAuth 2.0](https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/)
- [Jamf Pro API Docs](https://developer.jamf.com/jamf-pro/docs/)
- [Jamf OAuth Client Credentials](https://developer.jamf.com/jamf-pro/docs/client-credentials)
- [Jamf Computer Inventory API](https://developer.jamf.com/jamf-pro/reference/get_v1-computers-inventory)
