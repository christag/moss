-- ============================================================================
-- Migration 000: Enhanced Migration System Bootstrap
-- Enhances migration tracking with versioning, checksums, and locking
-- ============================================================================

-- Enhance schema_migrations table with additional tracking fields
-- Note: The base table is already created by migrate.ts, we just add columns
DO $$
BEGIN
    -- Add application_version column (tracks which app version ran the migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schema_migrations' AND column_name = 'application_version') THEN
        ALTER TABLE schema_migrations ADD COLUMN application_version VARCHAR(20);
    END IF;

    -- Add execution_time_ms column (tracks how long migration took to run)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schema_migrations' AND column_name = 'execution_time_ms') THEN
        ALTER TABLE schema_migrations ADD COLUMN execution_time_ms INTEGER;
    END IF;

    -- Add status column (tracks migration state: completed, failed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schema_migrations' AND column_name = 'status') THEN
        ALTER TABLE schema_migrations ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
    END IF;

    -- Add error_message column (stores error details if migration fails)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schema_migrations' AND column_name = 'error_message') THEN
        ALTER TABLE schema_migrations ADD COLUMN error_message TEXT;
    END IF;

    -- Add checksum column (SHA-256 hash of migration file content for validation)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schema_migrations' AND column_name = 'checksum') THEN
        ALTER TABLE schema_migrations ADD COLUMN checksum VARCHAR(64);
    END IF;
END $$;

-- Create migration_lock table to prevent concurrent migrations
CREATE TABLE IF NOT EXISTS migration_lock (
    id INTEGER PRIMARY KEY DEFAULT 1,
    locked_at TIMESTAMP,
    locked_by VARCHAR(255),  -- hostname or container ID
    process_id INTEGER,      -- PID of process that acquired lock

    -- Ensure only one lock row can exist
    CONSTRAINT single_lock_row CHECK (id = 1)
);

-- Insert the single lock row if it doesn't exist
INSERT INTO migration_lock (id, locked_at, locked_by, process_id)
VALUES (1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create helper function to check if migrations are locked
CREATE OR REPLACE FUNCTION is_migration_locked()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM migration_lock
        WHERE id = 1 AND locked_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to acquire migration lock
CREATE OR REPLACE FUNCTION acquire_migration_lock(lock_holder VARCHAR(255), pid INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    lock_acquired BOOLEAN;
BEGIN
    -- Try to acquire lock
    UPDATE migration_lock
    SET locked_at = NOW(),
        locked_by = lock_holder,
        process_id = pid
    WHERE id = 1 AND locked_at IS NULL;

    -- Check if we got the lock
    GET DIAGNOSTICS lock_acquired = ROW_COUNT;
    RETURN lock_acquired > 0;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to release migration lock
CREATE OR REPLACE FUNCTION release_migration_lock()
RETURNS VOID AS $$
BEGIN
    UPDATE migration_lock
    SET locked_at = NULL,
        locked_by = NULL,
        process_id = NULL
    WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to force release stale locks (older than 10 minutes)
CREATE OR REPLACE FUNCTION release_stale_migration_locks()
RETURNS INTEGER AS $$
DECLARE
    released_count INTEGER;
BEGIN
    UPDATE migration_lock
    SET locked_at = NULL,
        locked_by = NULL,
        process_id = NULL
    WHERE id = 1
    AND locked_at IS NOT NULL
    AND locked_at < NOW() - INTERVAL '10 minutes';

    GET DIAGNOSTICS released_count = ROW_COUNT;
    RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy migration status checking
CREATE OR REPLACE VIEW migration_status AS
SELECT
    COUNT(*) as total_migrations,
    MAX(migration_number) as latest_migration,
    MAX(applied_at) as last_migration_time,
    COALESCE(SUM(execution_time_ms), 0) as total_execution_time_ms,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_migrations
FROM schema_migrations;

-- Add index on migration status for faster queries
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);

-- Add index on migration applied_at for faster queries
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);

-- Comments for documentation
COMMENT ON TABLE schema_migrations IS 'Tracks all database migrations that have been applied';
COMMENT ON COLUMN schema_migrations.migration_number IS 'Sequential migration number (e.g., 001, 002, 003)';
COMMENT ON COLUMN schema_migrations.filename IS 'Name of the migration file';
COMMENT ON COLUMN schema_migrations.application_version IS 'Version of M.O.S.S. that ran this migration';
COMMENT ON COLUMN schema_migrations.execution_time_ms IS 'Time taken to execute migration in milliseconds';
COMMENT ON COLUMN schema_migrations.status IS 'Migration status: completed or failed';
COMMENT ON COLUMN schema_migrations.error_message IS 'Error details if migration failed';
COMMENT ON COLUMN schema_migrations.checksum IS 'SHA-256 hash of migration file content for validation';

COMMENT ON TABLE migration_lock IS 'Prevents concurrent migrations from running simultaneously';
COMMENT ON COLUMN migration_lock.locked_by IS 'Hostname or container ID that acquired the lock';
COMMENT ON COLUMN migration_lock.process_id IS 'Process ID (PID) of the process holding the lock';

COMMENT ON VIEW migration_status IS 'Quick summary of migration system status';
