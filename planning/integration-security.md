# Integration Security Architecture

**Last Updated:** 2025-11-06
**Status:** Implemented (Phase 1: Foundation)

## Overview

This document outlines the security architecture for M.O.S.S. external integrations (Okta, Jamf, AWS, Azure, etc.), focusing on secure credential storage, multi-tenant isolation, and safe development practices using production APIs.

---

## Table of Contents

1. [Security Principles](#security-principles)
2. [Credential Encryption](#credential-encryption)
3. [Environment Isolation](#environment-isolation)
4. [Multi-Tenant Architecture](#multi-tenant-architecture)
5. [Development Workflow](#development-workflow)
6. [API Security](#api-security)
7. [Audit Logging](#audit-logging)
8. [Threat Model](#threat-model)
9. [Incident Response](#incident-response)

---

## Security Principles

### Defense in Depth

M.O.S.S. implements multiple layers of security for integration credentials:

1. **Encryption at Rest** - AES-256-GCM for database storage
2. **Environment Isolation** - Development/staging/production separation
3. **Tenant Isolation** - Per-customer credential namespacing
4. **Access Control** - RBAC for integration management (super_admin only)
5. **Audit Logging** - Complete trail of credential access/modification
6. **Git Protection** - Pre-commit hooks prevent accidental commits
7. **Secret Masking** - Credentials never exposed in logs/UI

### Zero Trust Philosophy

- **Never trust user input** - Validate all integration configurations
- **Least privilege** - Use read-only API tokens for development
- **Assume breach** - Design for credential rotation, revocation
- **Verify integrity** - GCM mode provides authentication tags

---

## Credential Encryption

### Implementation

**Location:** `src/lib/encryption.ts`

**Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key length:** 256 bits (32 bytes)
- **IV length:** 128 bits (16 bytes, unique per encryption)
- **Auth tag:** 128 bits (16 bytes, verifies integrity)

### Encryption Workflow

```typescript
import { encrypt, decrypt } from '@/lib/encryption'

// 1. Encrypt before storing
const plaintext = 'okta-api-token-abc123...'
const encrypted = encrypt(plaintext)
// Format: "base64(iv):base64(authTag):base64(encryptedData)"

// 2. Store in database
await query(
  'INSERT INTO integration_configs (credentials_encrypted) VALUES ($1)',
  [encrypted]
)

// 3. Decrypt only when needed (e.g., making API call)
const config = await getIntegrationConfig(id)
const apiToken = decrypt(config.credentials_encrypted)

// 4. Use and immediately discard (don't store decrypted values)
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${apiToken}` }
})
```

### Key Management

**Environment Variable:** `ENCRYPTION_KEY`

**Generation:**
```bash
# Generate 256-bit key (base64 encoded)
openssl rand -base64 32

# Example output:
# 3F2A8B9C1D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0=
```

**Storage:**
- **Development:** `.env.local` (gitignored)
- **Staging/Production:** Secure secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- **NEVER** commit to git or store in database

**Rotation:**
- Generate new key
- Decrypt all credentials with old key
- Re-encrypt with new key
- Update environment variable
- Old key can be destroyed

### Encryption Library API

```typescript
/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - Sensitive data to encrypt
 * @returns Base64-encoded string (iv:authTag:encryptedData)
 */
export function encrypt(plaintext: string): string

/**
 * Decrypt ciphertext encrypted with AES-256-GCM
 * @param ciphertext - Encrypted string from encrypt()
 * @returns Decrypted plaintext
 * @throws Error if auth tag invalid (tamper detected)
 */
export function decrypt(ciphertext: string): string

/**
 * Mask credential for display/logging
 * @param value - Credential to mask
 * @param visibleChars - Chars to show at end (default: 4)
 * @returns Masked string like "****5678"
 */
export function maskCredential(value: string, visibleChars?: number): string

/**
 * Check if string is encrypted (matches our format)
 * @param value - String to check
 * @returns true if encrypted format detected
 */
export function isEncrypted(value: string): boolean

/**
 * Generate new encryption key (for setup/rotation)
 * @returns Base64-encoded 256-bit key
 */
export function generateEncryptionKey(): string
```

---

## Environment Isolation

### Database Schema

**Table:** `integration_configs`

**Isolation Fields:**
```sql
environment VARCHAR(20) CHECK (environment IN ('development', 'staging', 'production'))
tenant_subdomain VARCHAR(255)  -- For multi-tenant SaaS
is_sandbox BOOLEAN DEFAULT false
access_scope JSONB  -- Sync filters, group restrictions
```

### Environment Separation

| Environment | Purpose | Credential Source | Data Scope |
|------------|---------|-------------------|------------|
| `development` | Local testing with YOUR Okta/Jamf | `.env.local` (your API tokens) | Test groups/devices only |
| `staging` | Pre-production testing | Secrets manager | Synthetic test data |
| `production` | Live customer deployments | Encrypted DB + secrets manager | Customer production data |

### Development Mode

**Activation:** `NODE_ENV=development`

**Behavior:**
- Load configs `WHERE environment = 'development'`
- Display warning banner: "⚠️ Using development credentials"
- Prefix synced data with `[DEV]` tag
- Hide production configs from UI
- Enable verbose logging

**Safety:**
```typescript
// src/lib/integrationClient.ts
export async function getIntegrationConfigs() {
  const environment = process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development'

  return query(
    'SELECT * FROM integration_configs WHERE environment = $1 AND is_enabled = true',
    [environment]
  )
}
```

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy

**Use Case:** When M.O.S.S. is deployed as multi-tenant SaaS (multiple customer orgs)

**Implementation:**
```sql
-- Customer A's Okta integration
INSERT INTO integration_configs (
  name, integration_type, environment, tenant_subdomain,
  credentials_encrypted, access_scope
) VALUES (
  'Acme Corp Okta', 'okta', 'production', 'acme',
  encrypt('customer-a-token'),
  '{"group_filter": "profile.department eq \"IT\""}'::jsonb
);

-- Customer B's Okta integration (isolated)
INSERT INTO integration_configs (
  name, integration_type, environment, tenant_subdomain,
  credentials_encrypted, access_scope
) VALUES (
  'Beta Inc Okta', 'okta', 'production', 'beta',
  encrypt('customer-b-token'),
  '{"group_filter": "profile.division eq \"Engineering\""}'::jsonb
);
```

**Query Filtering:**
```typescript
// In application code (Next.js middleware or API routes)
const tenantSubdomain = req.headers.host?.split('.')[0] // e.g., "acme" from acme.moss.com

const configs = await query(
  `SELECT * FROM integration_configs
   WHERE tenant_subdomain = $1 AND environment = 'production'`,
  [tenantSubdomain]
)
```

### Okta Multi-Tenant Support

Okta recommends OAuth 2.0 Authorization Code flow for multi-tenant integrations:

**Benefits:**
- Each customer authorizes M.O.S.S. via OAuth (secure flow)
- M.O.S.S. receives tenant-specific access token
- Tokens are easily revocable by customer
- No shared secrets across tenants

**Flow:**
1. Customer admin visits `/integrations/okta/connect`
2. M.O.S.S. redirects to Okta authorization URL with `tenant_subdomain` in state
3. Customer approves M.O.S.S. app permissions
4. Okta redirects back with authorization code
5. M.O.S.S. exchanges code for access token + refresh token
6. Encrypt and store in `integration_configs` with customer's `tenant_subdomain`

---

## Development Workflow

### Safe Testing with Production APIs

**Goal:** Test Okta/Jamf integrations using YOUR company's production instances without leaking sensitive data or credentials to GitHub.

### Setup Steps

**1. Generate Encryption Key**
```bash
# Generate key
openssl rand -base64 32

# Add to .env.local (gitignored)
echo "ENCRYPTION_KEY=<your-key-here>" >> .env.local
```

**2. Create Read-Only API Tokens**

**Okta:**
- Navigate to **Admin > Security > API > Tokens**
- Click **Create Token**
- Name: "M.O.S.S. Development Testing"
- Permissions: Read-only (no write/delete)
- Copy token to `.env.local`

**Jamf:**
- Navigate to **Settings > System > API Roles and Clients**
- Create new OAuth client
- Permissions: Read for Computer, User, Smart Computer Group
- Copy client ID and secret to `.env.local`

**3. Configure `.env.local`**
```bash
# NEVER commit this file!
ENCRYPTION_KEY=3F2A8B9C1D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0=

OKTA_DEV_DOMAIN=yourcompany.okta.com
OKTA_DEV_API_TOKEN=00abc123...xyz789
OKTA_DEV_TEST_GROUP_ID=00g1234567890abcd

JAMF_DEV_URL=yourcompany.jamfcloud.com
JAMF_DEV_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
JAMF_DEV_CLIENT_SECRET=abc123...xyz789
JAMF_DEV_TEST_SMART_GROUP_ID=123
```

**4. Create Test Groups (Data Isolation)**

**Okta:**
- Create group: "MOSS Integration Test Users"
- Add only 2-3 test users (yourself + dummy accounts)
- Use group filter in sync: `profile.group eq "MOSS Integration Test Users"`

**Jamf:**
- Create smart group: "MOSS Dev Test Fleet"
- Criteria: Computer name contains "TEST-" OR Serial number in list
- Only include 2-3 test Macs
- Use smart group ID in sync scope

**5. Test Locally**
```bash
# Start dev server
npm run dev

# Navigate to /admin/integrations
# Add integration with dev credentials
# Trigger sync - only test group data should sync
```

### Development Safety Checklist

- [ ] ✅ `.env.local` is gitignored
- [ ] ✅ Pre-commit hook active (prevents `.env.local` commits)
- [ ] ✅ API tokens are read-only
- [ ] ✅ Sync scope limited to test groups only
- [ ] ✅ Test group contains <5 users/devices
- [ ] ✅ No PII-sensitive data in test accounts
- [ ] ✅ `ENCRYPTION_KEY` generated uniquely (not from docs)
- [ ] ✅ Integration marked as `is_sandbox = true`

---

## API Security

### Authentication Methods

**Supported:**
1. **OAuth 2.0** (preferred) - Most secure, per-customer tokens
2. **API Token** - Acceptable for read-only development
3. **Basic Auth** - Legacy, avoid if possible

### Request Security

**TLS/HTTPS Only:**
- All integration API calls MUST use HTTPS
- Verify SSL certificates (don't disable validation)
- Use `NODE_TLS_REJECT_UNAUTHORIZED=1` (never set to 0)

**Rate Limiting:**
```typescript
// src/lib/integrationClient.ts
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many integration sync requests, please try again later'
})

export default limiter
```

**Timeout Configuration:**
```typescript
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(30000) // 30 second timeout
})
```

### Credential Masking

**NEVER log:**
- ❌ Full API tokens
- ❌ OAuth client secrets
- ❌ Encryption keys
- ❌ User passwords
- ❌ Full credential objects

**DO log:**
- ✅ Masked credentials: `maskCredential(token)` → `"****5678"`
- ✅ Integration names
- ✅ Sync results (counts, timestamps)
- ✅ Error messages (sanitized)

**Example:**
```typescript
import { maskCredential } from '@/lib/encryption'

console.log(`Syncing Okta with token: ${maskCredential(apiToken)}`)
// Output: "Syncing Okta with token: ****xyz789"

// NEVER do this:
console.log(`Token: ${apiToken}`) // ❌ SECURITY VIOLATION
```

---

## Audit Logging

### Admin Actions

**Table:** `admin_audit_log`

**Logged Events:**
- Integration created/updated/deleted
- Credentials changed (who, when, which integration)
- Manual sync triggered
- Integration enabled/disabled
- Access scope modified

**Log Format:**
```json
{
  "user_id": "uuid-of-admin",
  "action": "integration_credentials_updated",
  "category": "integrations",
  "target_type": "integration_config",
  "target_id": "uuid-of-integration",
  "details": {
    "integration_name": "Okta Production",
    "integration_type": "okta",
    "credentials_changed": true,
    "note": "Rotated API token after security review"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-11-06T10:30:00Z"
}
```

**NEVER log actual credentials:**
```typescript
// ❌ WRONG - logs actual token
await logAdminAction({
  action: 'credentials_updated',
  details: { new_token: apiToken }
})

// ✅ CORRECT - logs metadata only
await logAdminAction({
  action: 'credentials_updated',
  details: {
    credentials_changed: true,
    token_suffix: maskCredential(apiToken, 4)
  }
})
```

### Integration Sync Logs

**Table:** `integration_sync_history`

**Logged Data:**
- Sync started/completed timestamps
- Records processed/created/updated/failed
- Error messages (sanitized)
- Duration
- Triggered by (user ID or 'scheduled')

**Retention:** 90 days (configurable)

---

## Threat Model

### Threats & Mitigations

| Threat | Severity | Mitigation |
|--------|----------|------------|
| API keys committed to GitHub | **Critical** | Pre-commit hook + `.gitignore` + code review |
| Database breach (credentials exposed) | **Critical** | AES-256-GCM encryption + separate key storage |
| Stolen `ENCRYPTION_KEY` | **High** | Key stored in secure secrets manager (prod) |
| Insider threat (admin steals credentials) | **High** | Audit logging + principle of least privilege |
| MITM attack on integration API calls | **High** | TLS/HTTPS only + cert validation |
| Cross-tenant data leakage | **High** | `tenant_subdomain` filtering + query validation |
| Accidental production sync in dev | **Medium** | Environment separation + UI warnings |
| API token rotation needed | **Medium** | Re-encrypt flow + revocation tracking |
| Brute force decryption | **Low** | AES-256 is quantum-resistant (for now) |

### Attack Scenarios

**Scenario 1: GitHub Leak**
- **Attack:** Developer commits `.env.local` with API tokens
- **Detection:** Pre-commit hook catches before push
- **Fallback:** GitHub secret scanning alerts (if public repo)
- **Response:** Revoke exposed tokens immediately

**Scenario 2: Database Breach**
- **Attack:** Attacker gains read access to PostgreSQL
- **Impact:** Sees encrypted credentials but can't decrypt (no `ENCRYPTION_KEY`)
- **Mitigation:** Credentials useless without key (stored separately)

**Scenario 3: Stolen ENCRYPTION_KEY**
- **Attack:** Attacker gains `ENCRYPTION_KEY` from environment
- **Impact:** Can decrypt all integration credentials
- **Response:**
  1. Revoke all integration API tokens
  2. Generate new `ENCRYPTION_KEY`
  3. Re-encrypt all credentials
  4. Notify affected customers

---

## Incident Response

### Credential Compromise Procedure

**1. Detection:**
- Audit log shows unauthorized credential access
- GitHub secret scanning alert
- Customer reports suspicious API activity
- Integration provider (Okta/Jamf) reports breach

**2. Containment:**
```bash
# Immediately disable affected integration
UPDATE integration_configs
SET is_enabled = false
WHERE id = '<compromised-integration-id>';

# Revoke API token in external system (Okta/Jamf admin UI)
```

**3. Eradication:**
- Revoke compromised API token/OAuth client
- Generate new credentials
- Rotate `ENCRYPTION_KEY` if suspected compromise
- Review audit logs for unauthorized access

**4. Recovery:**
```typescript
// Re-encrypt with new credentials
const newToken = 'newTokenValue'
const encrypted = encrypt(newToken)

await query(
  'UPDATE integration_configs SET credentials_encrypted = $1 WHERE id = $2',
  [encrypted, integrationId]
)

// Re-enable integration
await query(
  'UPDATE integration_configs SET is_enabled = true WHERE id = $1',
  [integrationId]
)
```

**5. Lessons Learned:**
- Document root cause
- Update security controls
- Review access controls (RBAC)
- Consider additional monitoring

### Key Rotation Procedure

**Recommended:** Every 90 days

**Process:**
```bash
# 1. Generate new key
NEW_KEY=$(openssl rand -base64 32)

# 2. Run migration script (decrypts with old key, re-encrypts with new)
ENCRYPTION_KEY="<old-key>" NEW_ENCRYPTION_KEY="$NEW_KEY" npm run rotate-encryption-key

# 3. Update environment variable
export ENCRYPTION_KEY="$NEW_KEY"

# 4. Restart application
pm2 restart moss

# 5. Verify integrations still work
npm run test:integrations
```

---

## Compliance Notes

### GDPR / Data Protection

- **Data Minimization:** Only sync directory basics (name, email, device serial)
- **Right to be Forgotten:** Provide API to delete synced user data
- **Consent:** Document customer consent for integration setup
- **Data Processor Agreement:** M.O.S.S. is processor, customer is controller

### SOC 2 / ISO 27001

- ✅ Encryption at rest (AES-256-GCM)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Access controls (RBAC, super_admin only)
- ✅ Audit logging (complete trail)
- ✅ Key management (separate storage)
- ✅ Incident response procedure (documented above)

---

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/publications/fips)
- [Okta Security Best Practices](https://developer.okta.com/docs/concepts/auth-overview/)
- [Jamf Security Hardening](https://learn.jamf.com/bundle/technical-articles/page/Jamf_Pro_Security_Checklist.html)

---

**Next Steps:**
1. Implement OAuth 2.0 flow for Okta/Jamf
2. Add integration setup UI with credential masking
3. Write unit tests for encryption library
4. Conduct security audit of integration endpoints
5. Document customer-facing integration setup guide
