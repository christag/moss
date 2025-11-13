-- Migration 028: Add Okta and Jamf Integration Types
-- Purpose: Update integration_type to support Okta and Jamf as specific providers
--          (previously only had generic types like 'idp', 'mdm')
-- Author: Claude
-- Date: 2025-11-06

-- =============================================================================
-- Update integration_type Column
-- =============================================================================

-- Since integration_configs.integration_type is VARCHAR(50), we don't need to
-- alter the type itself - just document the new valid values

-- Add comment documenting all valid integration types
COMMENT ON COLUMN integration_configs.integration_type IS
  'Integration provider type: okta, jamf, azure_ad, intune, aws, gcp, or legacy generic types (idp, mdm, rmm, cloud_provider, ticketing, monitoring, backup, other)';

-- =============================================================================
-- Update Existing Generic Records (Optional Migration)
-- =============================================================================

-- If any existing records use generic 'idp' or 'mdm', you can optionally
-- migrate them to specific types. For now, we'll leave them as-is for
-- backward compatibility.

-- Example migration (commented out):
-- UPDATE integration_configs
--   SET integration_type = 'okta'
--   WHERE integration_type = 'idp'
--     AND LOWER(name) LIKE '%okta%';

-- UPDATE integration_configs
--   SET integration_type = 'jamf'
--   WHERE integration_type = 'mdm'
--     AND LOWER(name) LIKE '%jamf%';

-- =============================================================================
-- Add Integration Type Index (if not exists)
-- =============================================================================

-- Ensure index exists for filtering by integration_type
CREATE INDEX IF NOT EXISTS idx_integration_configs_type_enabled
  ON integration_configs(integration_type, is_enabled)
  WHERE is_enabled = true;

-- =============================================================================
-- Helper View: Integration Summary
-- =============================================================================

-- Create a view that summarizes integrations by type for admin dashboard
CREATE OR REPLACE VIEW integration_summary AS
SELECT
  integration_type,
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE is_enabled = true) as enabled_configs,
  COUNT(*) FILTER (WHERE last_sync_status = 'success') as successful_syncs,
  COUNT(*) FILTER (WHERE last_sync_status = 'failed') as failed_syncs,
  MAX(last_sync_at) as most_recent_sync,
  COUNT(*) FILTER (WHERE environment = 'production') as production_configs,
  COUNT(*) FILTER (WHERE is_sandbox = true) as sandbox_configs
FROM integration_configs
GROUP BY integration_type
ORDER BY integration_type;

COMMENT ON VIEW integration_summary IS
  'Summary statistics of integration configs by provider type for admin dashboard';

-- =============================================================================
-- Example Okta Configuration (Commented Out)
-- =============================================================================

/*
-- Okta Directory Sync (for pulling user/group data into M.O.S.S.)
INSERT INTO integration_configs (
  integration_type,
  name,
  is_enabled,
  environment,
  is_sandbox,
  config,
  credentials_encrypted,
  sync_settings,
  auto_sync_enabled,
  sync_schedule
) VALUES (
  'okta',
  'Okta Directory Sync - Production',
  false, -- Enable after testing
  'production',
  false,
  '{
    "domain": "yourcompany.okta.com",
    "api_version": "v1",
    "timeout_ms": 30000,
    "auth_method": "oauth"
  }'::jsonb,
  -- Use encryption library: encrypt(JSON.stringify({
  --   okta_client_id: "...",
  --   okta_client_secret: "..."
  -- }))
  'encrypted:credentials:here',
  '{
    "sync_groups": true,
    "sync_group_members": true,
    "sync_user_metadata": true,
    "sync_app_assignments": true,
    "group_filter": "MOSS",
    "user_match_strategy": "email",
    "create_missing_users": false,
    "custom_field_mappings": {
      "lastLogin": "last_okta_login",
      "status": "okta_status",
      "activated": "okta_activated_date"
    }
  }'::jsonb,
  true,
  '0 2 * * *' -- Daily at 2 AM
);

-- Jamf MDM Sync (for pulling computer/device data into M.O.S.S.)
INSERT INTO integration_configs (
  integration_type,
  name,
  is_enabled,
  environment,
  is_sandbox,
  config,
  credentials_encrypted,
  sync_settings,
  auto_sync_enabled,
  sync_schedule
) VALUES (
  'jamf',
  'Jamf Pro MDM Sync - Production',
  false,
  'production',
  false,
  '{
    "base_url": "https://yourcompany.jamfcloud.com",
    "api_version": "v1",
    "timeout_ms": 30000
  }'::jsonb,
  -- Use encryption library: encrypt(JSON.stringify({
  --   jamf_client_id: "...",
  --   jamf_client_secret: "..."
  -- }))
  'encrypted:credentials:here',
  '{
    "sync_computers": true,
    "sync_computer_groups": true,
    "sync_users": true,
    "sync_sections": ["GENERAL", "HARDWARE", "SOFTWARE", "USER_AND_LOCATION", "GROUP_MEMBERSHIPS"],
    "smart_group_filter": "MOSS Test Devices",
    "create_missing_locations": true,
    "update_existing_devices": true
  }'::jsonb,
  true,
  '0 */6 * * *' -- Every 6 hours
);
*/

-- =============================================================================
-- Validation Function
-- =============================================================================

-- Function to validate integration_type values
CREATE OR REPLACE FUNCTION validate_integration_type(p_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_type IN (
    'okta', 'jamf', 'azure_ad', 'intune', 'aws', 'gcp',
    'idp', 'mdm', 'rmm', 'cloud_provider', 'ticketing',
    'monitoring', 'backup', 'other'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_integration_type(VARCHAR) IS
  'Validates that integration_type is one of the supported provider types';
