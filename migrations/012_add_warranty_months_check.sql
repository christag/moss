/**
 * Migration 012: Add CHECK constraint for warranty_months
 *
 * Purpose: Prevent negative warranty months values
 * Defect: DEF-ROUND2-MASTER-006
 * Date: 2025-10-12
 */

-- Add CHECK constraint to ensure warranty_months is non-negative
ALTER TABLE devices
ADD CONSTRAINT check_warranty_months_non_negative
CHECK (warranty_months IS NULL OR warranty_months >= 0);

-- Verify no existing negative values (should return 0 rows)
SELECT id, device_name, warranty_months
FROM devices
WHERE warranty_months < 0;

-- Test: Try to insert negative value (should fail)
-- INSERT INTO devices (device_name, warranty_months) VALUES ('Test Device', -1);
