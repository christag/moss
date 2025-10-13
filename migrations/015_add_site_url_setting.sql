-- ============================================================================
-- Migration 015: Add Site URL Setting
-- Adds configurable site URL/FQDN to system settings
-- ============================================================================

-- Add site URL setting to system_settings
INSERT INTO system_settings (key, value, category, description) VALUES
    ('general.site_url', '"http://localhost:3000"', 'general', 'Full URL of the site (FQDN) including protocol (e.g., https://moss.example.com)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN system_settings.value IS 'JSONB value - for site_url, include full URL with protocol';
