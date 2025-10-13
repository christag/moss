# M.O.S.S. Testing Guide

This document provides information for testing M.O.S.S. in development and UAT environments.

## Test Environment Setup

### Prerequisites

1. PostgreSQL database running (via container or local)
2. Node.js v22.x installed
3. Environment variables configured

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Required Variables**:
```env
DATABASE_URL=postgresql://moss:moss_dev_password@192.168.64.2:5432/moss
NEXTAUTH_SECRET=RZ/2B3LCa75mVyDmT0PcZktKRBJKPz4pjv9HYQath40=
NEXTAUTH_URL=http://localhost:3001
SKIP_SETUP_WIZARD=true
```

### Database Setup

1. **Start PostgreSQL container**:
```bash
container run -d --name moss-postgres \
  -e POSTGRES_USER=moss \
  -e POSTGRES_PASSWORD=moss_dev_password \
  -e POSTGRES_DB=moss \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **Run database migrations**:
```bash
# Apply main schema
psql -h localhost -U moss -d moss -f dbsetup.sql

# Apply migration 002 (authentication)
psql -h localhost -U moss -d moss -f migrations/002_add_authentication.sql

# Apply migration 003 (admin settings)
psql -h localhost -U moss -d moss -f migrations/003_add_admin_settings.sql

# Apply migration 006 (enhanced RBAC)
psql -h localhost -U moss -d moss -f migrations/006_enhanced_rbac.sql

# Apply migration 007 (file attachments)
psql -h localhost -U moss -d moss -f migrations/007_file_attachments.sql

# Apply migration 008 (setup flag)
psql -h localhost -U moss -d moss -f migrations/008_add_setup_flag.sql
```

3. **Create test users**:
```bash
psql -h localhost -U moss -d moss
```

Then run:
```sql
-- Insert test super admin
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@test.com',
  '$2a$10$K9YQkXZ7RqQqP5vK7X5J0eZDjH4FdFtZv4zP8Y2X7Z5J0eZDjH4FdF', -- password: 'admin123'
  'super_admin',
  true
);

-- Insert test admin
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'testadmin@test.com',
  '$2a$10$K9YQkXZ7RqQqP5vK7X5J0eZDjH4FdFtZv4zP8Y2X7Z5J0eZDjH4FdF', -- password: 'admin123'
  'admin',
  true
);

-- Insert test regular user
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'user@test.com',
  '$2a$10$K9YQkXZ7RqQqP5vK7X5J0eZDjH4FdFtZv4zP8Y2X7Z5J0eZDjH4FdF', -- password: 'user123'
  'user',
  true
);

-- Insert test viewer
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'viewer@test.com',
  '$2a$10$K9YQkXZ7RqQqP5vK7X5J0eZDjH4FdFtZv4zP8Y2X7Z5J0eZDjH4FdF', -- password: 'viewer123'
  'viewer',
  true
);

-- Bypass setup wizard flag
UPDATE system_settings SET value = true WHERE key = 'setup.completed';
```

## Test Credentials

### User Accounts

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@test.com | admin123 | super_admin | Full system access, RBAC management |
| testadmin@test.com | admin123 | admin | Admin panel access, no RBAC |
| user@test.com | user123 | user | Standard user access |
| viewer@test.com | viewer123 | viewer | Read-only access |

**Note**: These are bcrypt-hashed test passwords. In production, use strong passwords and never commit credentials to version control.

### Regenerating Password Hashes

To generate new password hashes:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

## Running Tests

### Development Server

```bash
npm run dev
```

Application will be available at: http://localhost:3001

### API Testing

#### Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2025-10-12T..."
  }
}
```

#### Authentication Test
```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

#### Create Test Device
```bash
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "hostname": "test-device-001",
    "device_type": "server",
    "manufacturer": "Dell",
    "model": "PowerEdge R750",
    "serial_number": "TEST123456",
    "status": "active"
  }'
```

### Playwright UI Testing

The UAT suite uses Playwright MCP tools for browser automation testing. See:
- `testing/FINAL-UAT-AGENTS-2-6-GUIDE.md` - Agent 2 for UI tests
- `testing/FINAL-UAT-MASTER-RESULTS.md` - Latest results

### Manual Testing Checklist

- [ ] Login with each test user role
- [ ] Navigate to all 16 core object list views
- [ ] Create a new record for each object type
- [ ] Edit an existing record
- [ ] Delete a test record
- [ ] Search and filter functionality
- [ ] Admin panel access (admin/super_admin only)
- [ ] RBAC role assignments (super_admin only)
- [ ] File attachments upload/download
- [ ] Global search functionality

## Bypass Setup Wizard

### Method 1: Environment Variable (Recommended)

Set in `.env.local`:
```env
SKIP_SETUP_WIZARD=true
```

### Method 2: Query Parameter

Add `?skip_setup=true` to any URL:
```
http://localhost:3001/?skip_setup=true
```

### Method 3: Database Flag

```sql
UPDATE system_settings SET value = true WHERE key = 'setup.completed';
```

### Method 4: Cookie

Set the `moss-setup-completed` cookie to `true` in your browser DevTools.

## Common Issues

### Issue: "Setup wizard redirects all routes"
**Solution**: Ensure `SKIP_SETUP_WIZARD=true` in `.env.local` and restart dev server

### Issue: "Database connection failed"
**Solution**:
1. Check PostgreSQL container is running: `container ps`
2. Verify DATABASE_URL in `.env.local`
3. Test connection: `psql -h localhost -U moss -d moss -c "SELECT 1"`

### Issue: "Rate limit exceeded"
**Solution**: Rate limits reset after 15 minutes, or restart server to clear in-memory store

### Issue: "Authentication fails"
**Solution**:
1. Verify users exist in database
2. Check NEXTAUTH_SECRET is set
3. Clear browser cookies and try again

### Issue: "POST endpoints return 400 validation errors"
**Solution**: Ensure you're sending all required fields. Check API schema definitions in `src/lib/schemas/`

## UAT Testing

For comprehensive UAT testing:

1. **Read the UAT guide**: `testing/FINAL-UAT-AGENTS-2-6-GUIDE.md`
2. **Review previous results**: `testing/FINAL-UAT-MASTER-RESULTS.md`
3. **Run targeted tests** for specific agents (2-6)
4. **Document findings** in new UAT results files

### Agent Testing Order

1. **Agent 1**: Docker Deployment (skipped on macOS - uses `container` instead)
2. **Agent 2**: Frontend UI Testing (Playwright)
3. **Agent 3**: API Regression Testing
4. **Agent 4**: Database & Performance Testing
5. **Agent 5**: Accessibility Testing (WCAG 2.1 AA)
6. **Agent 6**: Design System Compliance

## Cleaning Test Data

### Reset Database (Full Wipe)
```bash
container stop moss-postgres
container rm moss-postgres
# Then re-create and re-run migrations
```

### Delete Test Devices Only
```sql
DELETE FROM devices WHERE hostname LIKE 'test-device-%';
```

### Clear All Junction Tables
```sql
TRUNCATE TABLE document_devices CASCADE;
TRUNCATE TABLE document_networks CASCADE;
-- etc...
```

## Security Notes

- **Never commit `.env.local`** to version control
- Test credentials are for **development/testing only**
- **Rotate all secrets** before production deployment
- Use **environment variables** or **secrets management** in production
- **Rate limiting** is enabled on authentication endpoints
- **XSS protection** is enabled on all input fields (after remediation)

## Support

For issues or questions:
- File an issue on GitHub
- Check `CLAUDE-TODO.md` for known issues
- Review `CLAUDE-UPDATES.md` for recent changes
- See `README.md` for general documentation

---

**Last Updated**: 2025-10-12
**Testing Environment**: macOS with Apple container system
**Application Version**: Next.js 15.5.4
**Database**: PostgreSQL 15-alpine
