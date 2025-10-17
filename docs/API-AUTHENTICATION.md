# M.O.S.S. API Authentication

**Status**: Implemented (Migration pending application)
**Date**: 2025-10-16

## Overview

The M.O.S.S. API uses **Bearer token authentication** for all API endpoints. This provides secure, programmatic access to the platform for integrations, automation scripts, mobile apps, and third-party services.

## Quick Start

### 1. Create an API Token

1. Log in to M.O.S.S. at `https://your-moss-instance.com`
2. Navigate to **Settings → API Tokens** (`/settings/api-tokens`)
3. Click **"Create New Token"**
4. Fill out the form:
   - **Token Name**: Descriptive name (e.g., "Production Server", "Mobile App")
   - **Scopes**: Select permissions (read, write, admin)
   - **Expiration**: Choose expiration period (recommended: 90 days)
5. Click **"Create Token"**
6. **IMPORTANT**: Copy the token immediately - it will only be shown once!

### 2. Use the Token

Include the token in the `Authorization` header of all API requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-moss-instance.com/api/devices
```

## Token Scopes

API tokens use a scope-based permission system:

| Scope | Permissions | Example Operations |
|-------|-------------|-------------------|
| **read** | View data (GET requests) | List devices, get person details, view networks |
| **write** | Create and update data (POST, PUT, PATCH) | Create devices, update people, modify locations |
| **admin** | Administrative operations (DELETE, admin endpoints) | Delete records, manage users, system settings |

**Notes**:
- Tokens must have at least one scope
- Multiple scopes can be combined (e.g., read + write)
- The `admin` scope can only be granted to users with admin or super_admin roles
- `admin` scope implicitly includes `read` and `write` permissions

## Token Management

### Viewing Tokens

Navigate to `/settings/api-tokens` to see all your active tokens:

- **Token Prefix**: First 10 characters for identification (e.g., `moss_abc12...`)
- **Last Used**: Timestamp and IP address of last API call
- **Usage Count**: Total number of API calls made with this token
- **Expiration**: When the token will expire (or "Never")
- **Status**: Active or Revoked

### Revoking Tokens

To revoke a token:
1. Go to `/settings/api-tokens`
2. Find the token in the list
3. Click **"Revoke"**
4. Confirm the action

**Important**: Revoked tokens cannot be reactivated. You must create a new token.

### Token Expiration

- Tokens expire automatically based on the expiration period set during creation
- Expired tokens are kept for 90 days for audit purposes, then deleted
- Set expiration to "Never" only for internal, trusted services

## API Usage Examples

### JavaScript/Node.js

```javascript
const MOSS_API_URL = 'https://your-moss-instance.com/api'
const API_TOKEN = 'moss_your_token_here'

async function getDevices() {
  const response = await fetch(`${MOSS_API_URL}/devices`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()
  return data
}

async function createDevice(deviceData) {
  const response = await fetch(`${MOSS_API_URL}/devices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(deviceData)
  })

  const data = await response.json()
  return data
}
```

### Python

```python
import requests

MOSS_API_URL = 'https://your-moss-instance.com/api'
API_TOKEN = 'moss_your_token_here'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Get devices
response = requests.get(f'{MOSS_API_URL}/devices', headers=headers)
devices = response.json()

# Create device
device_data = {
    'hostname': 'server-01',
    'device_type': 'server',
    'manufacturer': 'Dell',
    'model': 'PowerEdge R640'
}
response = requests.post(f'{MOSS_API_URL}/devices', json=device_data, headers=headers)
new_device = response.json()
```

### cURL

```bash
# List devices
curl -H "Authorization: Bearer moss_your_token_here" \
  https://your-moss-instance.com/api/devices

# Create device
curl -X POST \
  -H "Authorization: Bearer moss_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"hostname":"server-01","device_type":"server"}' \
  https://your-moss-instance.com/api/devices

# Get specific device
curl -H "Authorization: Bearer moss_your_token_here" \
  https://your-moss-instance.com/api/devices/550e8400-e29b-41d4-a716-446655440000
```

## Error Responses

### 401 Unauthorized

**Missing Authorization Header**:
```json
{
  "success": false,
  "error": "Missing Authorization header",
  "message": "Please provide a Bearer token in the Authorization header"
}
```

**Invalid or Expired Token**:
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "The provided API token is invalid, expired, or has been revoked"
}
```

### 403 Forbidden

**Insufficient Permissions**:
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "This endpoint requires one of the following scopes: write",
  "yourScopes": ["read"]
}
```

**Admin Required**:
```json
{
  "success": false,
  "error": "Admin access required",
  "message": "This endpoint requires admin privileges"
}
```

## Security Best Practices

### Token Storage

✅ **DO**:
- Store tokens in environment variables
- Use secure credential management systems (AWS Secrets Manager, HashiCorp Vault)
- Encrypt tokens at rest
- Use separate tokens for different environments (dev, staging, prod)

❌ **DON'T**:
- Commit tokens to version control (Git, SVN)
- Share tokens via email or messaging apps
- Log tokens in plain text
- Use the same token across multiple applications

### Token Rotation

1. Create a new token with appropriate scopes
2. Update your application to use the new token
3. Test thoroughly in staging/dev environments
4. Deploy to production
5. Monitor for 24-48 hours
6. Revoke the old token

### Monitoring

Regularly review token usage:
- Check "Last Used" timestamps for dormant tokens
- Review "Usage Count" for anomalies
- Monitor "Last Used IP" for unexpected locations
- Revoke tokens that haven't been used in 90+ days

## API Endpoint Reference

### Token Management Endpoints

#### List User's Tokens
```
GET /api/api-tokens
Authorization: Required (session-based, not API token)
```

**Response**:
```json
{
  "success": true,
  "tokens": [
    {
      "id": "uuid",
      "token_name": "Production Server",
      "token_prefix": "moss_abc12...",
      "scopes": ["read", "write"],
      "last_used_at": "2025-10-16T10:30:00Z",
      "last_used_ip": "192.168.1.100",
      "usage_count": 1547,
      "expires_at": "2026-01-16T00:00:00Z",
      "is_active": true,
      "created_at": "2025-10-16T08:00:00Z"
    }
  ],
  "count": 1
}
```

#### Create New Token
```
POST /api/api-tokens
Authorization: Required (session-based, not API token)
Content-Type: application/json
```

**Request Body**:
```json
{
  "tokenName": "Production Server",
  "scopes": ["read", "write"],
  "expiresInDays": 90
}
```

**Response**:
```json
{
  "success": true,
  "message": "API token created successfully",
  "token": "moss_abc123def456ghi789...",
  "tokenId": "uuid",
  "tokenPrefix": "moss_abc12",
  "createdAt": "2025-10-16T08:00:00Z",
  "expiresAt": "2026-01-16T00:00:00Z",
  "scopes": ["read", "write"],
  "warning": "This token will only be shown once. Please copy it to a secure location."
}
```

#### Revoke Token
```
DELETE /api/api-tokens/{id}
Authorization: Required (session-based, not API token)
```

**Response**:
```json
{
  "success": true,
  "message": "API token revoked successfully"
}
```

### Admin Token Management

Admins can view all tokens with query parameters:

```
GET /api/api-tokens?all=true&active=true&userId=uuid
Authorization: Required (admin or super_admin session)
```

## Implementation Details

### Database Schema

**Table**: `api_tokens`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| token_name | VARCHAR(255) | User-friendly name |
| token_hash | VARCHAR(255) | bcrypt hash of full token |
| token_prefix | VARCHAR(16) | First 10 chars for display |
| scopes | JSONB | Array of permission scopes |
| last_used_at | TIMESTAMP | Last API call timestamp |
| last_used_ip | VARCHAR(45) | Last client IP (IPv4/IPv6) |
| usage_count | INTEGER | Total API call count |
| expires_at | TIMESTAMP | Expiration date (NULL = never) |
| is_active | BOOLEAN | Active/revoked status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Token Format

Tokens follow the format: `moss_[32 random characters]`

- **Prefix**: `moss_` (10 characters including underscore for display)
- **Random**: 32 cryptographically secure random alphanumeric characters
- **Total Length**: 37 characters
- **Hashing**: bcrypt with cost factor 10

### Authentication Flow

1. Client sends request with `Authorization: Bearer {token}` header
2. Server extracts token from header
3. Server queries all active, non-expired tokens from database
4. Server compares provided token against each token hash using bcrypt
5. If match found:
   - Check required scope for endpoint
   - Log usage (timestamp, IP, increment counter)
   - Allow request to proceed
6. If no match or insufficient scope:
   - Return 401/403 error
   - Do not log usage

## Migration Status

### Database Migration

**File**: `migrations/023_api_tokens.sql`

**Status**: ⚠️ **Not yet applied** - needs manual execution

**To Apply**:
```bash
# Connect to postgres container
container exec -i postgres psql -U postgres -d moss < migrations/023_api_tokens.sql

# Or directly with psql
PGPASSWORD=postgres psql -h localhost -U postgres -d moss -f migrations/023_api_tokens.sql
```

**Migration Includes**:
- `api_tokens` table creation
- Indexes for performance (user_id, token_hash, is_active, expires_at)
- Helper functions: `is_token_valid()`, `record_token_usage()`, `cleanup_expired_tokens()`
- `api_tokens_list` view (excludes sensitive token_hash)
- Trigger for `updated_at` timestamp

### API Route Status

**Implemented with Authentication**:
- ✅ `/api/devices` - GET (read), POST (write)
- ✅ `/api/people` - GET (read), POST (write)
- ✅ `/api/api-tokens` - Token management (session-based auth)

**Pending Authentication Rollout** (needs auth middleware added):
- All other `/api/*` routes (companies, locations, rooms, networks, etc.)
- PATCH/DELETE operations
- Admin endpoints

## Troubleshooting

### Token Not Working

1. **Check token format**: Should start with `moss_` and be 37 characters total
2. **Verify expiration**: Check if token has expired
3. **Confirm status**: Ensure token hasn't been revoked
4. **Check scopes**: Verify token has required scope for endpoint
5. **Test with cURL**: Isolate issues from application code

### Permission Denied

1. **Verify scope**: Ensure token has `write` scope for POST/PUT/PATCH, `admin` for DELETE
2. **Check user role**: Admin scope requires admin/super_admin user role
3. **Review endpoint**: Some endpoints may have additional RBAC checks

### Token Not Visible After Creation

This is **by design** for security. Tokens are only shown once during creation. If lost:
1. Revoke the old token
2. Create a new token
3. Update your application configuration

## Future Enhancements

Planned improvements for API authentication:

1. **API Key Rotation**: Automated key rotation with overlap period
2. **IP Whitelisting**: Restrict tokens to specific IP ranges
3. **Rate Limiting per Token**: Individual rate limits based on token tier
4. **Webhooks**: API token usage alerts and anomaly detection
5. **OAuth 2.0**: OAuth client credentials flow for enterprise integrations
6. **Audit Logging**: Detailed API access logs tied to tokens

## Support

For issues with API authentication:

1. Check this documentation first
2. Review error messages carefully
3. Test with cURL to isolate application issues
4. Report issues at: https://github.com/anthropics/moss/issues

---

**Last Updated**: 2025-10-16
**Version**: 1.0
**Migration**: 023_api_tokens.sql
