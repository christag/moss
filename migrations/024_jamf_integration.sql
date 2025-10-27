-- Migration 024: JAMF Pro Integration
-- Purpose: Store JAMF Pro integration configuration and sync metadata
-- Author: Claude
-- Date: 2025-10-26

-- =============================================================================
-- Integration Configuration Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type VARCHAR(50) NOT NULL, -- 'jamf', 'intune', 'aws', 'azure', etc.
    name VARCHAR(255) NOT NULL, -- User-friendly name (e.g., "Production JAMF")
    is_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Connection details (stored as JSONB for flexibility across integration types)
    config JSONB NOT NULL DEFAULT '{}', -- { "base_url": "https://...", "client_id": "...", etc. }

    -- Encrypted credentials (use application-level encryption)
    credentials_encrypted TEXT, -- Encrypted JSON: { "username": "...", "password": "..." } or { "api_key": "..." }

    -- Sync settings
    sync_schedule VARCHAR(50), -- Cron expression (e.g., "0 */6 * * *" for every 6 hours)
    auto_sync_enabled BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20), -- 'success', 'failed', 'in_progress', 'never'
    last_sync_error TEXT,

    -- Sync scope (which data to sync)
    sync_settings JSONB DEFAULT '{}', -- { "sync_users": true, "sync_computers": true, "sync_groups": true, etc. }

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_integration_name UNIQUE (integration_type, name)
);

CREATE INDEX idx_integration_configs_type ON integration_configs(integration_type);
CREATE INDEX idx_integration_configs_enabled ON integration_configs(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_integration_configs_last_sync ON integration_configs(last_sync_at DESC);

COMMENT ON TABLE integration_configs IS 'Stores configuration for external integrations (MDM, cloud providers, IdP, etc.)';
COMMENT ON COLUMN integration_configs.config IS 'Integration-specific configuration (base URL, tenant ID, etc.) stored as JSONB';
COMMENT ON COLUMN integration_configs.credentials_encrypted IS 'Encrypted credentials (use application-level encryption before storing)';
COMMENT ON COLUMN integration_configs.sync_schedule IS 'Cron expression for automated sync schedule';

-- =============================================================================
-- Sync History Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_config_id UUID NOT NULL REFERENCES integration_configs(id) ON DELETE CASCADE,

    -- Sync execution details
    sync_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'success', 'failed', 'partial'

    -- Sync results
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,
    error_details JSONB, -- Detailed error information, stack traces, etc.

    -- Sync metadata
    sync_type VARCHAR(50), -- 'manual', 'scheduled', 'webhook'
    triggered_by_user_id UUID REFERENCES users(id),

    -- Performance metrics
    duration_seconds NUMERIC(10, 2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_history_config ON integration_sync_history(integration_config_id);
CREATE INDEX idx_sync_history_started_at ON integration_sync_history(sync_started_at DESC);
CREATE INDEX idx_sync_history_status ON integration_sync_history(status);

COMMENT ON TABLE integration_sync_history IS 'Tracks history of integration sync operations with detailed metrics';
COMMENT ON COLUMN integration_sync_history.status IS 'Sync status: in_progress, success, failed, partial';
COMMENT ON COLUMN integration_sync_history.sync_type IS 'How sync was triggered: manual, scheduled, webhook';

-- =============================================================================
-- External System Mappings
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_object_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_config_id UUID NOT NULL REFERENCES integration_configs(id) ON DELETE CASCADE,

    -- External system reference
    external_id VARCHAR(255) NOT NULL, -- ID in external system (e.g., JAMF computer ID)
    external_type VARCHAR(50) NOT NULL, -- 'computer', 'user', 'group', etc.

    -- M.O.S.S. internal reference
    internal_id UUID NOT NULL, -- ID in M.O.S.S. database
    internal_type VARCHAR(50) NOT NULL, -- 'device', 'person', 'group', etc.

    -- Sync metadata
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'conflict', 'deleted_external', 'deleted_internal'

    -- External data snapshot (for conflict resolution)
    external_data JSONB, -- Last known state from external system

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_external_mapping UNIQUE (integration_config_id, external_type, external_id),
    CONSTRAINT unique_internal_mapping UNIQUE (integration_config_id, internal_type, internal_id)
);

CREATE INDEX idx_object_mappings_config ON integration_object_mappings(integration_config_id);
CREATE INDEX idx_object_mappings_external ON integration_object_mappings(external_id, external_type);
CREATE INDEX idx_object_mappings_internal ON integration_object_mappings(internal_id, internal_type);
CREATE INDEX idx_object_mappings_sync_status ON integration_object_mappings(sync_status);

COMMENT ON TABLE integration_object_mappings IS 'Maps objects between external systems and M.O.S.S. internal database';
COMMENT ON COLUMN integration_object_mappings.external_id IS 'ID of object in external system (e.g., JAMF computer ID)';
COMMENT ON COLUMN integration_object_mappings.internal_id IS 'UUID of corresponding object in M.O.S.S.';
COMMENT ON COLUMN integration_object_mappings.external_data IS 'Cached snapshot of external data for conflict detection';

-- =============================================================================
-- Update Triggers
-- =============================================================================

-- Trigger to update updated_at on integration_configs
CREATE OR REPLACE FUNCTION update_integration_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_configs_updated_at
    BEFORE UPDATE ON integration_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_config_timestamp();

-- Trigger to update updated_at on integration_object_mappings
CREATE OR REPLACE FUNCTION update_integration_mapping_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_mappings_updated_at
    BEFORE UPDATE ON integration_object_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_mapping_timestamp();

-- =============================================================================
-- Example JAMF Configuration (commented out)
-- =============================================================================

-- INSERT INTO integration_configs (
--     integration_type,
--     name,
--     is_enabled,
--     config,
--     sync_settings,
--     auto_sync_enabled,
--     sync_schedule
-- ) VALUES (
--     'jamf',
--     'Production JAMF Pro',
--     false,
--     '{
--         "base_url": "https://yourcompany.jamfcloud.com",
--         "api_version": "v1",
--         "timeout_seconds": 30
--     }'::jsonb,
--     '{
--         "sync_computers": true,
--         "sync_users": true,
--         "sync_groups": true,
--         "sync_computer_sections": ["GENERAL", "HARDWARE", "SOFTWARE", "USER_AND_LOCATION", "GROUP_MEMBERSHIPS"],
--         "create_missing_locations": true,
--         "update_existing_devices": true
--     }'::jsonb,
--     false,
--     '0 */6 * * *'
-- );
