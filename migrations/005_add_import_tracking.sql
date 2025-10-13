-- Migration: Add import tracking tables for bulk operations
-- Purpose: Track CSV import jobs, results, and history

-- Import Jobs table: Track all import operations
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type VARCHAR(100) NOT NULL, -- e.g., 'device', 'person', 'location'
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- File size in bytes
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, cancelled
  row_count INTEGER, -- Total rows in CSV
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ, -- When import processing began
  completed_at TIMESTAMPTZ -- When import finished
);

-- Import Results table: Store detailed import outcomes
CREATE TABLE IF NOT EXISTS import_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_created INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  errors_json JSONB, -- Array of error objects: [{row: 1, field: 'email', error: 'Invalid format'}]
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_object_type ON import_jobs(object_type);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_results_job_id ON import_results(job_id);

-- Updated_at trigger for import_jobs
CREATE OR REPLACE FUNCTION update_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_jobs_updated_at();

-- Comments for documentation
COMMENT ON TABLE import_jobs IS 'Tracks all CSV import operations';
COMMENT ON TABLE import_results IS 'Stores detailed results of import operations';
COMMENT ON COLUMN import_jobs.object_type IS 'Type of object being imported (device, person, location, etc.)';
COMMENT ON COLUMN import_jobs.status IS 'Import status: pending, in_progress, completed, failed, cancelled';
COMMENT ON COLUMN import_results.errors_json IS 'Array of validation/import errors in JSON format';
