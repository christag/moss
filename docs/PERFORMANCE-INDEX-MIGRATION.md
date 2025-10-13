# Performance Index Migration Guide

## Overview

Migration `004_add_performance_indexes.sql` adds 100+ performance indexes to optimize common query patterns in the M.O.S.S. database. This migration significantly improves query performance across list views, search functionality, dashboard widgets, and relationship queries.

## Expected Performance Improvements

| Query Type | Expected Improvement | Use Cases |
|------------|---------------------|-----------|
| List view sorting (by date) | 50-90% faster | All list pages sorted by created_at/updated_at |
| Search queries | 80-95% faster | Global search, name/text field searches |
| Dashboard widgets | 60-80% faster | Expiring warranties, licenses, contracts |
| Relationship queries | 70-90% faster | Related items tabs (rooms, devices, IOs, etc.) |
| Filter combinations | 50-80% faster | Status + type filters, location-based queries |

## Index Categories

### 1. Timestamp Indexes (26 indexes)
- Optimizes list view sorting by `created_at` and `updated_at`
- Applied to: companies, locations, rooms, people, devices, networks, software, saas_services, licenses, documents, contracts
- Uses `DESC` order for efficient "newest first" queries

### 2. Name/Search Field Indexes (22 indexes)
- Regular and case-insensitive (LOWER) indexes on name fields
- Covers: hostname, full_name, location_name, network_name, product_name, service_name, group_name, document title
- Enables fast sorting and filtering on text fields

### 3. Date Range Indexes (10 indexes)
- Warranty expiration dates with status filtering
- License expiration tracking
- Contract end dates
- Uses partial indexes (WHERE clauses) for efficiency

### 4. Composite Indexes (15 indexes)
- Multi-column indexes for common filter combinations
- Examples:
  - `devices(status, device_type, hostname)` - filter + sort
  - `devices(location_id, status)` - location-based queries
  - `people(status, person_type)` - active users by type
  - `software_licenses(software_id, seat_count, seats_used)` - seat utilization

### 5. Junction Table Indexes (40 indexes)
- Bidirectional indexes on all many-to-many relationships
- Covers: group_members, document associations, license assignments, service access
- Enables fast lookups in both directions

### 6. Full-Text Search Indexes (12 GIN indexes)
- PostgreSQL trigram indexes for fuzzy text search
- Enables `LIKE '%search%'` queries without full table scans
- Covers: devices, people, locations, software, documents

## Prerequisites

1. **PostgreSQL Extension**: The migration requires the `pg_trgm` extension for trigram indexes
   - The migration will automatically create the extension if it doesn't exist
   - Requires database superuser privileges or pre-created extension

2. **Database Access**: You need either:
   - Direct `psql` access to the database
   - Container access if running PostgreSQL in a container

3. **Sufficient Disk Space**: Indexes require additional storage
   - Estimate: 15-30% of current database size
   - Check current size: `SELECT pg_size_pretty(pg_database_size('moss'));`

## Application Methods

### Method 1: Direct psql (Local Development)

```bash
# Standard psql command
psql -U moss -d moss -f migrations/004_add_performance_indexes.sql

# With password prompt
PGPASSWORD=your_password psql -U moss -d moss -f migrations/004_add_performance_indexes.sql

# Using environment variable from .env
source .env
psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f migrations/004_add_performance_indexes.sql
```

### Method 2: Via Container (Docker/Podman)

```bash
# Using Apple's container command (macOS)
container exec -i postgres_container psql -U moss -d moss < migrations/004_add_performance_indexes.sql

# Using Docker
docker exec -i postgres_container psql -U moss -d moss < migrations/004_add_performance_indexes.sql

# With custom container name
container exec -i your_postgres_container psql -U moss -d moss < migrations/004_add_performance_indexes.sql
```

### Method 3: Via Database Management Tool

1. **pgAdmin**:
   - Open Query Tool
   - Load `migrations/004_add_performance_indexes.sql`
   - Execute (F5 or Execute button)

2. **DBeaver**:
   - Open SQL Editor
   - Load migration file
   - Execute (Ctrl+Enter or Execute button)

3. **TablePlus**:
   - Open Query window
   - Paste migration SQL
   - Run query

## Migration Safety Features

The migration includes several safety features:

1. **Idempotent**: Uses `CREATE INDEX IF NOT EXISTS` to prevent errors on re-run
2. **Transactional**: Wrapped in `BEGIN/COMMIT` transaction
3. **Extension Safety**: Uses `CREATE EXTENSION IF NOT EXISTS pg_trgm`
4. **No Data Changes**: Only creates indexes, doesn't modify any data

## Monitoring Index Creation

### During Migration

The migration may take several minutes depending on database size. Monitor progress:

```sql
-- In another terminal, check for long-running queries
SELECT
  pid,
  now() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

### After Migration

Verify indexes were created successfully:

```sql
-- Count total indexes
SELECT schemaname, tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY index_count DESC;

-- View indexes on a specific table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'devices'
ORDER BY indexname;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

## Troubleshooting

### Issue: "permission denied to create extension"

**Solution**: The `pg_trgm` extension requires superuser privileges. Options:

1. **Pre-create the extension** (as database superuser):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

2. **Remove GIN indexes from migration** (lines 216-237):
   - Comment out the full-text search section
   - You'll lose fuzzy search capabilities but other indexes will still work

### Issue: "insufficient disk space"

**Solution**: Free up disk space or temporarily remove some index categories:

1. **Remove largest indexes** (GIN trigram indexes are the largest):
   - Comment out lines 216-237 (Full-Text Search Indexes section)

2. **Remove less critical indexes**:
   - Timestamp indexes (lines 12-43): Less critical if not sorting by date
   - Date range indexes (lines 93-107): Only needed for dashboard expiration widgets

### Issue: Migration times out

**Solution**: The migration may take 5-15 minutes on large databases. Options:

1. **Increase timeout** in your client
2. **Run during off-hours** to avoid query conflicts
3. **Create indexes individually** if you need to monitor progress:
   ```bash
   # Split migration into smaller batches
   psql -U moss -d moss -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_created_at ON devices(created_at DESC);"
   ```

### Issue: Lock conflicts / database unavailable

**Solution**: Use `CONCURRENTLY` for non-blocking index creation:

**WARNING**: `CONCURRENTLY` cannot be used inside a transaction. You'll need to:

1. Remove `BEGIN;` and `COMMIT;` from the migration file
2. Add `CONCURRENTLY` to each `CREATE INDEX` statement:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_created_at ON devices(created_at DESC);
   ```

This allows the database to remain available during index creation but takes longer.

## Post-Migration Verification

### Test Query Performance

Run these queries before and after migration to verify improvements:

```sql
-- Test 1: List view with timestamp sort (should be 50-90% faster)
EXPLAIN ANALYZE
SELECT * FROM devices
ORDER BY created_at DESC
LIMIT 50;

-- Test 2: Search query (should be 80-95% faster)
EXPLAIN ANALYZE
SELECT * FROM devices
WHERE hostname ILIKE '%server%';

-- Test 3: Dashboard widget (should be 60-80% faster)
EXPLAIN ANALYZE
SELECT * FROM devices
WHERE status = 'active'
  AND warranty_expiration IS NOT NULL
  AND warranty_expiration < CURRENT_DATE + INTERVAL '90 days'
ORDER BY warranty_expiration ASC;

-- Test 4: Relationship query (should be 70-90% faster)
EXPLAIN ANALYZE
SELECT * FROM rooms
WHERE location_id = 'some-location-id'
LIMIT 20;
```

Look for:
- `Index Scan` instead of `Seq Scan` in the query plan
- Lower execution time
- Lower cost estimates

### Monitor Index Usage

After running the application for a few days, check which indexes are being used:

```sql
-- View index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 30;
```

Indexes with 0 scans may be candidates for removal if they're never used.

## Rollback

If you need to remove the indexes (e.g., to free up disk space), create a rollback script:

```sql
-- Generate DROP INDEX statements for all indexes created by migration 004
SELECT 'DROP INDEX IF EXISTS ' || indexname || ';'
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

**WARNING**: Only drop indexes you're certain were created by this migration. The database had 86 existing indexes before this migration.

## Best Practices

1. **Apply during off-hours**: Index creation can temporarily slow down the database
2. **Monitor disk space**: Ensure you have 30%+ free space before applying
3. **Test in staging first**: Apply to a staging/development database before production
4. **Keep statistics updated**: Run `ANALYZE` after migration:
   ```sql
   ANALYZE;
   ```
5. **Regular maintenance**: Schedule periodic `VACUUM ANALYZE` to keep indexes efficient:
   ```sql
   VACUUM ANALYZE;
   ```

## Next Steps

After applying the performance indexes:

1. **Monitor query performance**: Use the verification queries above
2. **Implement caching**: Add Redis or in-memory caching for frequently accessed data
3. **Optimize N+1 queries**: Review API routes for inefficient query patterns
4. **Configure connection pooling**: Use pgBouncer or similar for production
5. **Set up monitoring**: Use pg_stat_statements to track slow queries

## Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/current/indexes.html
- pg_trgm Extension: https://www.postgresql.org/docs/current/pgtrgm.html
- Index Maintenance: https://www.postgresql.org/docs/current/routine-vacuuming.html
- Query Performance Tuning: https://www.postgresql.org/docs/current/performance-tips.html

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review PostgreSQL logs for detailed error messages
3. Open an issue on GitHub with:
   - PostgreSQL version: `SELECT version();`
   - Database size: `SELECT pg_size_pretty(pg_database_size('moss'));`
   - Error messages
   - Migration method attempted
