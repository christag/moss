-- ============================================================================
-- Migration 008: Add Setup Completion Flag
-- Adds system setting to track whether first-run setup wizard has completed
-- ============================================================================

-- Add setup completion flag
INSERT INTO system_settings (key, value, category, description) VALUES
    ('setup.completed', 'false', 'general', 'Whether the first-run setup wizard has been completed'),
    ('setup.completed_at', 'null', 'general', 'Timestamp when setup was completed'),
    ('setup.completed_by', 'null', 'general', 'User ID who completed the setup'),
    ('setup.version', '"1.0.0"', 'general', 'Version of M.O.S.S. when setup was completed')
ON CONFLICT (key) DO NOTHING;

-- Add index for quick setup check
CREATE INDEX IF NOT EXISTS idx_system_settings_setup ON system_settings(key) WHERE key = 'setup.completed';

COMMENT ON COLUMN system_settings.key IS 'Unique setting key. Use setup.completed to check if first-run setup is done.';
