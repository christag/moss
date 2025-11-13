-- Migration 027: Integration Environment & Tenant Isolation
-- Purpose: Add environment, tenant, and sandbox fields to support multi-tenant
--          development with production API testing without data leakage
-- Author: Claude
-- Date: 2025-Nov-06

-- =============================================================================
-- Add Environment Isolation Fields to integration_configs
-- =============================================================================

-- Add new columns to integration_configs for environment isolation
ALTER TABLE integration_configs
  ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production'
    CHECK (environment IN ('development', 'staging', 'production')),
  ADD COLUMN IF NOT EXISTS tenant_subdomain VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_scope JSONB DEFAULT '{}';

-- Create indexes for efficient environment filtering
CREATE INDEX IF NOT EXISTS idx_integration_configs_environment
  ON integration_configs(environment);

CREATE INDEX IF NOT EXISTS idx_integration_configs_tenant
  ON integration_configs(tenant_subdomain)
  WHERE tenant_subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_integration_configs_sandbox
  ON integration_configs(is_sandbox)
  WHERE is_sandbox = true;

-- Composite index for multi-tenant queries (tenant + environment)
CREATE INDEX IF NOT EXISTS idx_integration_configs_tenant_env
  ON integration_configs(tenant_subdomain, environment)
  WHERE tenant_subdomain IS NOT NULL;

-- =============================================================================
-- Column Comments
-- =============================================================================

COMMENT ON COLUMN integration_configs.environment IS
  'Deployment environment: development (local testing), staging, or production (live customer data)';

COMMENT ON COLUMN integration_configs.tenant_subdomain IS
  'For multi-tenant SaaS: Customer subdomain for tenant isolation (e.g., "acme" for acme.moss.com)';

COMMENT ON COLUMN integration_configs.is_sandbox IS
  'Flag indicating if this is a test/sandbox integration (true) vs production (false)';

COMMENT ON COLUMN integration_configs.access_scope IS
  'Integration-specific access restrictions: {"okta_group_filter": "profile.department eq \"IT\"", "jamf_smart_group_id": 123}';

-- =============================================================================
-- Update Existing Records
-- =============================================================================

-- Set existing records to production environment (safe default)
UPDATE integration_configs
  SET environment = 'production',
      is_sandbox = false
  WHERE environment IS NULL OR environment = 'production';

-- =============================================================================
-- Helper Function: Get Current Environment
-- =============================================================================

-- Function to determine environment based on context (for query filtering)
CREATE OR REPLACE FUNCTION get_current_environment()
RETURNS TEXT AS $$
BEGIN
  -- In practice, this would be set by the application based on NODE_ENV
  -- For now, default to production for safety
  RETURN COALESCE(current_setting('app.environment', true), 'production');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_environment() IS
  'Returns current application environment context (development, staging, production)';

-- =============================================================================
-- Example Usage (Commented Out)
-- =============================================================================

/*
-- Development integration config (YOUR testing credentials)
INSERT INTO integration_configs (
  integration_type,
  name,
  is_enabled,
  environment,
  is_sandbox,
  config,
  credentials_encrypted,
  access_scope
) VALUES (
  'okta',
  'Okta Dev Testing - Your Company',
  true,
  'development',
  true,
  '{"base_url": "https://yourcompany.okta.com", "api_version": "v1"}'::jsonb,
  -- Use encryption library: encrypt(process.env.OKTA_DEV_API_TOKEN)
  'encrypted:token:here',
  '{"group_filter": "MOSS Integration Test Users"}'::jsonb
);

-- Production integration config (customer's credentials)
INSERT INTO integration_configs (
  integration_type,
  name,
  is_enabled,
  environment,
  is_sandbox,
  tenant_subdomain,
  config,
  credentials_encrypted,
  access_scope
) VALUES (
  'okta',
  'Customer Okta Production',
  true,
  'production',
  false,
  'acme',  -- For acme.moss.com tenant
  '{"base_url": "https://acme-corp.okta.com", "api_version": "v1"}'::jsonb,
  -- Encrypted customer OAuth token
  'encrypted:customer:token:here',
  '{"group_filter": "profile.department eq \"IT\""}'::jsonb
);

-- Query integrations by environment (for application code)
-- Development mode: Only show dev configs
SELECT * FROM integration_configs
WHERE environment = 'development'
  AND is_enabled = true;

-- Production mode: Only show production configs for specific tenant
SELECT * FROM integration_configs
WHERE environment = 'production'
  AND tenant_subdomain = 'acme'
  AND is_enabled = true;

-- Multi-tenant query: Get all production integrations across tenants
SELECT tenant_subdomain, name, integration_type, last_sync_at
FROM integration_configs
WHERE environment = 'production'
  AND is_enabled = true
ORDER BY tenant_subdomain, integration_type;
*/
