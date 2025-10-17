-- Migration 009: Add UNIQUE constraint on devices.hostname
-- Addresses: DEF-ROUND2-MASTER-002 - Duplicate Device Hostnames Allowed
-- Date: 2025-10-12
-- Priority: CRITICAL (P0)
-- Impact: Prevents data integrity issues with duplicate hostnames

-- Add UNIQUE constraint on devices.hostname column
-- This prevents multiple devices from having the same hostname
ALTER TABLE devices
ADD CONSTRAINT devices_hostname_unique UNIQUE (hostname);

-- Note: If there are existing duplicates in the database, this migration will fail.
-- To handle existing duplicates, you can either:
-- 1. Manually resolve duplicates before running this migration
-- 2. Temporarily add nullif to make constraint deferred
--
-- Check for existing duplicates with:
-- SELECT hostname, COUNT(*)
-- FROM devices
-- WHERE hostname IS NOT NULL
-- GROUP BY hostname
-- HAVING COUNT(*) > 1;
