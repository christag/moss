\timing on

-- Load test: Create 1000 devices with correct schema
DO $$
DECLARE
  test_company_id UUID;
  i INTEGER;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  -- Get a valid company
  SELECT id INTO test_company_id FROM companies LIMIT 1;

  start_time := clock_timestamp();

  -- Insert 1000 devices
  FOR i IN 1..1000 LOOP
    INSERT INTO devices (id, hostname, device_type, company_id, status)
    VALUES (
      gen_random_uuid(),
      'perf-test-' || i,
      'server',
      test_company_id,
      'active'
    );
  END LOOP;

  end_time := clock_timestamp();

  RAISE NOTICE 'Created 1000 devices in % seconds', EXTRACT(EPOCH FROM (end_time - start_time));
END $$;

-- Count total devices
SELECT COUNT(*) as total_devices FROM devices;

-- Performance test: List query with JOIN
EXPLAIN ANALYZE
SELECT d.id, d.hostname, d.device_type, d.status, c.company_name
FROM devices d
LEFT JOIN companies c ON d.company_id = c.id
ORDER BY d.created_at DESC
LIMIT 50;

-- Performance test: Search query
EXPLAIN ANALYZE
SELECT d.id, d.hostname
FROM devices d
WHERE d.hostname ILIKE '%perf-test-500%'
LIMIT 20;

-- Performance test: Complex aggregation
EXPLAIN ANALYZE
SELECT
  c.company_name,
  COUNT(d.id) as device_count,
  COUNT(DISTINCT d.device_type) as device_types
FROM companies c
LEFT JOIN devices d ON c.id = d.company_id
GROUP BY c.id, c.company_name
ORDER BY device_count DESC;

-- Database size metrics
SELECT
  pg_size_pretty(pg_database_size('moss')) as db_size,
  (SELECT COUNT(*) FROM devices) as device_count,
  (SELECT COUNT(*) FROM companies) as company_count,
  (SELECT COUNT(*) FROM people) as people_count,
  (SELECT COUNT(*) FROM networks) as network_count;

\timing off
