/**
 * Migration 012: Add warranty_months column with CHECK constraint
 *
 * Purpose: Add warranty_months column and prevent negative values
 * Defect: DEF-ROUND2-MASTER-006
 * Date: 2025-10-12
 */

-- Add warranty_months column to devices table
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS warranty_months INTEGER;

-- Add CHECK constraint to ensure warranty_months is non-negative
ALTER TABLE devices
ADD CONSTRAINT check_warranty_months_non_negative
CHECK (warranty_months IS NULL OR warranty_months >= 0);
