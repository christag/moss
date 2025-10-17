# M.O.S.S. Database Migrations

**Version**: 1.0
**Last Updated**: 2025-10-16

## Overview

M.O.S.S. uses an automated database migration system that ensures your database schema stays in sync with the application code. Migrations run automatically when the application starts, making upgrades seamless.

## How It Works

### Auto-Migration on Boot

When M.O.S.S. starts (both in development and production), it automatically:

1. **Connects to database** with retry logic (5 attempts with exponential backoff)
2. **Acquires migration lock** to prevent concurrent migrations
3. **Checks for pending migrations** by comparing files to applied migrations
4. **Runs pending migrations** in sequential order
5. **Records migration results** with execution time and checksums
6. **Releases lock** and continues startup

**If migrations fail**: The application logs the error but continues to start, allowing you to diagnose and fix issues manually.

### Migration Locking

The system uses database-level locks to ensure:
- ✅ Only one server can run migrations at a time
- ✅ Concurrent container startups don't conflict
- ✅ Stale locks (>10 minutes old) are automatically released
- ✅ Lock holder is identified by hostname and process ID

### Migration Tracking

Each migration is tracked in the `schema_migrations` table with:
- Migration number (e.g., 001, 002, 003)
- Filename
- Application version that ran it
- Execution time in milliseconds
- Status (completed or failed)
- SHA-256 checksum for validation
- Applied timestamp

## Environment Variables

Configure migration behavior with these environment variables:

```bash
# Enable/disable auto-migration (default: true)
AUTO_MIGRATE=true

# Maximum time to wait for all migrations to complete (default: 5 minutes)
MIGRATION_TIMEOUT_MS=300000

# Maximum time to wait to acquire migration lock (default: 30 seconds)
MIGRATION_LOCK_TIMEOUT_MS=30000
```

## Creating New Migrations

### File Naming Convention

Migrations must follow this naming pattern:
```
NNN_description.sql
```

- **NNN**: Three-digit sequential number (e.g., 001, 002, 023)
- **description**: Lowercase with underscores (e.g., add_users_table)
- **Extension**: Always `.sql`

**Examples**:
- ✅ `021_add_api_tokens.sql`
- ✅ `022_create_audit_log.sql`
- ❌ `21_add_users.sql` (missing leading zero)
- ❌ `022-create-audit-log.sql` (wrong separator)
- ❌ `022_CreateAuditLog.sql` (wrong case)

### Migration Template

```sql
-- ============================================================================
-- Migration NNN: Brief Description
-- Detailed description of what this migration does
-- ============================================================================

-- Your SQL changes here

-- Add new tables
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to existing tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'new_field') THEN
        ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- Add comments for documentation
COMMENT ON TABLE new_table IS 'Description of what this table stores';
COMMENT ON COLUMN new_table.new_field IS 'Description of this field';
```

### Best Practices

#### 1. **Use Idempotent Operations**

Always make migrations safe to re-run:

✅ **Good**:
```sql
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20);
    END IF;
END $$;
```

❌ **Bad**:
```sql
CREATE TABLE users (...);  -- Fails if table exists
ALTER TABLE users ADD COLUMN status VARCHAR(20);  -- Fails if column exists
```

#### 2. **Test Migrations Locally First**

```bash
# Run migrations manually to test
npm run db:migrate

# Check migration status
npm run db:status

# View applied migrations
psql -d moss -c "SELECT * FROM schema_migrations ORDER BY migration_number;"
```

#### 3. **Keep Migrations Focused**

One migration should do ONE thing:
- ✅ Add a new table
- ✅ Add an index
- ✅ Modify a column type
- ❌ Add table + modify 3 other tables + create 5 indexes (too much)

#### 4. **Handle Data Migrations Carefully**

If migrating data, consider:
- Large datasets may timeout
- Use batch processing for millions of rows
- Test on a copy of production data first

```sql
-- Example: Migrate data in batches
DO $$
DECLARE
    batch_size INTEGER := 1000;
    offset_val INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    LOOP
        UPDATE old_table
        SET new_column = old_column
        WHERE id IN (
            SELECT id FROM old_table
            WHERE new_column IS NULL
            ORDER BY id
            LIMIT batch_size
            OFFSET offset_val
        );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;

        offset_val := offset_val + batch_size;
        RAISE NOTICE 'Updated % rows (offset: %)', rows_updated, offset_val;
    END LOOP;
END $$;
```

#### 5. **Add Helpful Comments**

Document why changes are being made:

```sql
-- Migration 024: Add API Token Support
-- Required for Issue #123 - Programmatic API access
-- This migration adds token-based authentication for external integrations

CREATE TABLE api_tokens (
    -- Token identification
    token_name VARCHAR(255) NOT NULL,  -- User-friendly name like "Production Server"
    token_hash VARCHAR(255) NOT NULL,  -- bcrypt hash of actual token

    -- Usage tracking for security auditing
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,

    ...
);
```

## Manual Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# See what would run (dry run)
npm run db:migrate:dry-run

# Get current database version
npm run db:version
```

## Migration Status API

Check migration status programmatically:

```bash
# GET /api/admin/migrations/status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/migrations/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentVersion": 20,
    "latestVersion": 20,
    "appliedMigrations": 20,
    "pendingMigrations": 0,
    "status": "up_to_date",
    "lastMigration": {
      "number": 20,
      "filename": "020_api_tokens.sql",
      "appliedAt": "2025-10-16T10:30:00Z"
    }
  }
}
```

## Viewing Migration Status

### Admin Dashboard

The admin panel (`/admin`) displays the current database version:
- **Green badge**: Up-to-date
- **Yellow badge**: Pending migrations
- **Red badge**: Migration error

### Database Query

```sql
-- View all applied migrations
SELECT
    migration_number,
    filename,
    status,
    execution_time_ms,
    applied_at
FROM schema_migrations
ORDER BY migration_number DESC;

-- Check for pending migrations (compare to files in /migrations)
SELECT * FROM migration_status;

-- View migration lock status
SELECT * FROM migration_lock;
```

## Troubleshooting

### Migration Failed

**Symptom**: Migration fails and is recorded with status='failed'

**Solution**:
1. Check application logs for error details
2. Review the failed migration SQL
3. Fix the issue in the migration file
4. Delete the failed migration record:
   ```sql
   DELETE FROM schema_migrations WHERE migration_number = XXX AND status = 'failed';
   ```
5. Re-run migrations: `npm run db:migrate`

### Lock Timeout

**Symptom**: "Failed to acquire migration lock after 30000ms"

**Possible Causes**:
- Another container is currently running migrations
- Previous migration crashed without releasing lock

**Solution**:
```sql
-- Check who has the lock
SELECT * FROM migration_lock;

-- Force release stale lock
SELECT release_stale_migration_locks();

-- Or manually release (if you're sure it's safe)
UPDATE migration_lock SET locked_at = NULL, locked_by = NULL, process_id = NULL WHERE id = 1;
```

### Database Connection Failed

**Symptom**: "Database connection failed after 5 retries"

**Possible Causes**:
- Database not running
- Wrong DATABASE_URL environment variable
- Database not ready during container startup

**Solution**:
1. Verify database is running
2. Check DATABASE_URL in .env.local
3. Increase retry delay (migration will auto-retry)

### Migration Timeout

**Symptom**: Migration exceeds MIGRATION_TIMEOUT_MS

**Solution**:
1. Increase timeout: `MIGRATION_TIMEOUT_MS=600000` (10 minutes)
2. Optimize slow migration (add indexes, batch large updates)
3. Run migration manually with unlimited timeout

### Checksum Mismatch

**Symptom**: Warning about migration file changed after being applied

**Possible Causes**:
- Migration file was modified after running
- File encoding changed

**Solution**:
- **Don't modify applied migrations** - create a new migration instead
- If you must fix a typo, delete the migration record and re-run

## Rollback (Future Feature)

Currently, M.O.S.S. does not support automated rollbacks. To roll back a migration:

1. Create a new migration that reverses the changes
2. Test thoroughly before applying

**Planned**: Future versions will support `migrations/rollback/` directory with reverse migrations.

## Production Deployment

### Docker

The Dockerfile automatically includes migrations:

```dockerfile
# Copy database migrations
COPY --from=builder /app/migrations ./migrations
```

Migrations run automatically when the container starts via `instrumentation.ts`.

### Upgrade Process

To upgrade M.O.S.S. in production:

1. **Pull new image**: `docker pull your-registry/moss:latest`
2. **Stop old container**: `docker stop moss`
3. **Start new container**: `docker start moss`
4. **Migrations run automatically** on first boot
5. **Verify**: Check logs for migration success

**Zero-downtime upgrade** (with multiple containers):
1. Start new container (will wait for migration lock)
2. First container acquires lock and runs migrations
3. Other containers wait, then start normally
4. Once all healthy, remove old containers

### Backup Before Major Upgrades

Always backup before upgrading:

```bash
# Backup database
pg_dump -h localhost -U postgres -d moss > moss_backup_$(date +%Y%m%d).sql

# Or use the built-in backup API (planned feature)
curl -X POST http://localhost:3001/api/admin/backup
```

## Migration History

| Version | Migration | Description | Date |
|---------|-----------|-------------|------|
| 000 | Migration System | Enhanced tracking with locking | 2025-10-16 |
| 001 | Initial Schema | Core tables (companies, people, devices) | 2025-08-01 |
| 002 | Authentication | User accounts and sessions | 2025-08-05 |
| ... | ... | ... | ... |
| 020 | API Tokens | Bearer token authentication | 2025-10-16 |

See `/migrations` directory for all migration files.

## Additional Resources

- **Database Architecture**: [planning/database-architecture.md](planning/database-architecture.md)
- **CLAUDE.md**: [CLAUDE.md](CLAUDE.md#database-setup)
- **Next.js Instrumentation**: [Next.js Docs](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

## Support

For migration issues:
1. Check application logs
2. Review this documentation
3. Check database error logs
4. Report issues at: https://github.com/anthropics/moss/issues

---

**Last Updated**: 2025-10-16
**Database Version**: 020 (with enhanced migration system)
