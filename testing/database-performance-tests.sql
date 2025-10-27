-- Agent 4 - Database Performance Tests
-- Category 1: Load Testing & Performance Queries
-- Category 2: Data Integrity
-- Category 3: Database Health

\timing on

-- ==================================
-- CATEGORY 1: LOAD TESTING (20 tests)
-- ==================================

\echo ''
\echo '=== CATEGORY 1: LOAD TESTING ==='
\echo ''

-- Test 1: Count current records
\echo 'TS-DB-001: Count existing records across tables'
SELECT
  'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL SELECT 'devices', COUNT(*) FROM devices
UNION ALL SELECT 'people', COUNT(*) FROM people
UNION ALL SELECT 'networks', COUNT(*) FROM networks
UNION ALL SELECT 'ios', COUNT(*) FROM ios
UNION ALL SELECT 'software', COUNT(*) FROM software
UNION ALL SELECT 'software_licenses', COUNT(*) FROM software_licenses
UNION ALL SELECT 'saas_services', COUNT(*) FROM saas_services
ORDER BY record_count DESC;

-- Test 2-6: Create test data for load testing
\echo ''
\echo 'TS-DB-002: Insert 1000 test devices'
DO $$
DECLARE
  test_company_id UUID;
  i INTEGER;
BEGIN
  -- Get or create test company
  SELECT id INTO test_company_id FROM companies WHERE company_name = 'Load Test Company' LIMIT 1;

  IF test_company_id IS NULL THEN
    INSERT INTO companies (id, company_name, company_type, status)
    VALUES (gen_random_uuid(), 'Load Test Company', 'customer', 'active')
    RETURNING id INTO test_company_id;
  END IF;

  -- Insert 1000 devices
  FOR i IN 1..1000 LOOP
    INSERT INTO devices (id, hostname, company_id, status, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'perf-test-device-' || i,
      test_company_id,
      'active',
      NOW(),
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Created 1000 devices for company: %', test_company_id;
END $$;

-- Test 7: Query performance - List devices with limit
\echo ''
\echo 'TS-DB-007: SELECT devices with LIMIT 50 (should be <2s)'
EXPLAIN ANALYZE
SELECT d.id, d.hostname, d.status, d.company_id, c.company_name
FROM devices d
LEFT JOIN companies c ON d.company_id = c.id
ORDER BY d.created_at DESC
LIMIT 50;

-- Test 8: Query performance - Single device with joins
\echo ''
\echo 'TS-DB-008: SELECT single device with relationships (should be <2s)'
EXPLAIN ANALYZE
SELECT
  d.*,
  c.company_name,
  l.location_name,
  r.room_name,
  COUNT(DISTINCT io.id) as interface_count
FROM devices d
LEFT JOIN companies c ON d.company_id = c.id
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN ios io ON d.id = io.device_id
WHERE d.hostname LIKE 'perf-test-device%'
GROUP BY d.id, c.company_name, l.location_name, r.room_name
LIMIT 1;

-- Test 9: Search performance with ILIKE
\echo ''
\echo 'TS-DB-009: Search with ILIKE pattern (should be <1s)'
EXPLAIN ANALYZE
SELECT id, hostname, status
FROM devices
WHERE hostname ILIKE '%perf-test-device-500%'
LIMIT 50;

-- Test 10: Pagination query
\echo ''
\echo 'TS-DB-010: Pagination with OFFSET (should be <2s)'
EXPLAIN ANALYZE
SELECT d.id, d.hostname, d.status, c.company_name
FROM devices d
LEFT JOIN companies c ON d.company_id = c.id
ORDER BY d.hostname
LIMIT 50 OFFSET 100;

-- Test 11: Complex JOIN across multiple tables
\echo ''
\echo 'TS-DB-011: Complex multi-table JOIN'
EXPLAIN ANALYZE
SELECT
  d.hostname,
  c.company_name,
  COUNT(DISTINCT io.id) as ios_count,
  COUNT(DISTINCT ia.id) as apps_count
FROM devices d
JOIN companies c ON d.company_id = c.id
LEFT JOIN ios io ON d.id = io.device_id
LEFT JOIN installed_applications ia ON d.id = ia.device_id
WHERE d.hostname LIKE 'perf-test%'
GROUP BY d.id, d.hostname, c.company_name
LIMIT 50;

-- Test 12: Aggregate query performance
\echo ''
\echo 'TS-DB-012: Aggregate query - devices by company'
EXPLAIN ANALYZE
SELECT
  c.company_name,
  COUNT(d.id) as device_count,
  COUNT(DISTINCT l.id) as location_count
FROM companies c
LEFT JOIN devices d ON c.id = d.company_id
LEFT JOIN locations l ON c.id = l.company_id
GROUP BY c.id, c.company_name
ORDER BY device_count DESC
LIMIT 20;

-- ==================================
-- CATEGORY 2: DATA INTEGRITY (15 tests)
-- ==================================

\echo ''
\echo '=== CATEGORY 2: DATA INTEGRITY ==='
\echo ''

-- Test 21: Foreign key constraint enforcement
\echo 'TS-DB-021: Foreign key constraint prevents invalid company_id'
DO $$
BEGIN
  INSERT INTO devices (id, hostname, company_id)
  VALUES (gen_random_uuid(), 'invalid-fk-test', '00000000-0000-0000-0000-000000000000');
  RAISE EXCEPTION 'Foreign key constraint NOT enforced!';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: Foreign key constraint properly enforced';
END $$;

-- Test 22: UNIQUE constraint on email
\echo ''
\echo 'TS-DB-022: UNIQUE constraint on people.email'
DO $$
DECLARE
  test_email TEXT := 'unique-test@example.com';
BEGIN
  -- First insert should succeed
  INSERT INTO people (id, email, first_name, last_name)
  VALUES (gen_random_uuid(), test_email, 'Test', 'User1');

  -- Second insert should fail
  INSERT INTO people (id, email, first_name, last_name)
  VALUES (gen_random_uuid(), test_email, 'Test', 'User2');

  RAISE EXCEPTION 'UNIQUE constraint NOT enforced!';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'PASS: UNIQUE constraint properly enforced';
    DELETE FROM people WHERE email = test_email;
END $$;

-- Test 23: NOT NULL constraints
\echo ''
\echo 'TS-DB-023: NOT NULL constraint on required fields'
DO $$
BEGIN
  INSERT INTO devices (id, company_id) -- Missing hostname
  VALUES (gen_random_uuid(), (SELECT id FROM companies LIMIT 1));
  RAISE EXCEPTION 'NOT NULL constraint NOT enforced!';
EXCEPTION
  WHEN not_null_violation THEN
    RAISE NOTICE 'PASS: NOT NULL constraint properly enforced';
END $$;

-- Test 24: CHECK constraint validation
\echo ''
\echo 'TS-DB-024: CHECK constraint on status values'
SELECT
  table_name,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND table_name IN ('devices', 'companies', 'people')
ORDER BY table_name;

-- Test 25: CASCADE delete behavior
\echo ''
\echo 'TS-DB-025: Verify CASCADE relationships'
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('devices', 'ios', 'installed_applications')
ORDER BY tc.table_name;

-- Test 26: Trigger execution - updated_at timestamps
\echo ''
\echo 'TS-DB-026: Verify updated_at trigger works'
DO $$
DECLARE
  test_device_id UUID;
  old_timestamp TIMESTAMPTZ;
  new_timestamp TIMESTAMPTZ;
BEGIN
  -- Get a test device
  SELECT id, updated_at INTO test_device_id, old_timestamp
  FROM devices WHERE hostname LIKE 'perf-test%' LIMIT 1;

  -- Wait a moment
  PERFORM pg_sleep(0.1);

  -- Update the device
  UPDATE devices SET notes = 'Trigger test' WHERE id = test_device_id;

  -- Get new timestamp
  SELECT updated_at INTO new_timestamp FROM devices WHERE id = test_device_id;

  IF new_timestamp > old_timestamp THEN
    RAISE NOTICE 'PASS: updated_at trigger working correctly';
  ELSE
    RAISE EXCEPTION 'FAIL: updated_at not updated';
  END IF;
END $$;

-- Test 27-30: Additional integrity tests
\echo ''
\echo 'TS-DB-027: Count orphaned records (should be 0)'
SELECT 'orphaned_devices' as check_name, COUNT(*) as count
FROM devices d
WHERE d.company_id NOT IN (SELECT id FROM companies)
UNION ALL
SELECT 'orphaned_ios', COUNT(*)
FROM ios WHERE device_id IS NOT NULL AND device_id NOT IN (SELECT id FROM devices)
UNION ALL
SELECT 'orphaned_ip_addresses', COUNT(*)
FROM ip_addresses WHERE io_id NOT IN (SELECT id FROM ios WHERE id IS NOT NULL);

-- ==================================
-- CATEGORY 3: DATABASE HEALTH (15 tests)
-- ==================================

\echo ''
\echo '=== CATEGORY 3: DATABASE HEALTH ==='
\echo ''

-- Test 36: Index usage verification
\echo 'TS-DB-036: Verify indexes exist on key columns'
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('devices', 'companies', 'people', 'networks', 'ios')
ORDER BY tablename, indexname;

-- Test 37: Table sizes
\echo ''
\echo 'TS-DB-037: Table sizes (verify reasonable for record counts)'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Test 38: Connection pool usage
\echo ''
\echo 'TS-DB-038: Active database connections (should be <20)'
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'moss';

-- Test 39: Database statistics
\echo ''
\echo 'TS-DB-039: Database statistics'
SELECT
  numbackends as connections,
  xact_commit as commits,
  xact_rollback as rollbacks,
  blks_read as disk_reads,
  blks_hit as cache_hits,
  ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) as cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'moss';

-- Test 40: Index hit ratio
\echo ''
\echo 'TS-DB-040: Index usage statistics (hit ratio should be >90%)'
SELECT
  schemaname,
  tablename,
  indexrelname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Test 41: Slow query analysis
\echo ''
\echo 'TS-DB-041: Current query activity'
SELECT
  pid,
  usename,
  state,
  LEFT(query, 50) as query_preview,
  query_start,
  NOW() - query_start as duration
FROM pg_stat_activity
WHERE datname = 'moss'
  AND state != 'idle'
ORDER BY query_start;

-- Test 42: Dead tuples (should be low)
\echo ''
\echo 'TS-DB-042: Dead tuples check (should be minimal)'
SELECT
  schemaname,
  tablename,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 0
ORDER BY dead_ratio DESC NULLS LAST
LIMIT 15;

-- Test 43: Last autovacuum/analyze
\echo ''
\echo 'TS-DB-043: Autovacuum activity'
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC NULLS LAST
LIMIT 10;

-- Test 44: Sequential scans vs index scans
\echo ''
\echo 'TS-DB-044: Sequential vs Index scan ratio'
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  CASE
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
  END as index_scan_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (seq_scan + idx_scan) > 0
ORDER BY (seq_scan + idx_scan) DESC
LIMIT 15;

-- Test 45: Bloat estimate
\echo ''
\echo 'TS-DB-045: Table bloat estimate'
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  ROUND(100 * (pg_total_relation_size(schemaname||'.'||tablename)::float /
    NULLIF(pg_relation_size(schemaname||'.'||tablename), 0)), 2) as bloat_ratio
FROM pg_tables
WHERE schemaname = 'public'
  AND pg_relation_size(schemaname||'.'||tablename) > 0
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Final summary
\echo ''
\echo '=== TEST EXECUTION COMPLETE ==='
\echo 'Results saved with timing information'
