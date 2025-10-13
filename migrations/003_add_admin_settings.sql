-- ============================================================================
-- Migration 003: Admin Settings Panel
-- Adds tables for system configuration, integrations, custom fields, and audit logging
-- ============================================================================

-- System-wide settings table (key-value store with JSONB values)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'branding',
        'authentication',
        'storage',
        'notifications',
        'general'
    )),
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration configurations (IdP, MDM, RMM, Cloud providers, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN (
        'idp',              -- Identity Provider (Okta, Azure AD, etc.)
        'mdm',              -- Mobile Device Management (Jamf, Intune)
        'rmm',              -- Remote Monitoring & Management
        'cloud_provider',   -- AWS, Azure, GCP
        'ticketing',        -- Jira, ServiceNow
        'monitoring',       -- Datadog, New Relic
        'backup',           -- Backblaze, Acronis
        'other'
    )),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- okta, azure_ad, jamf, intune, aws, etc.
    config JSONB NOT NULL, -- Connection details, API keys (encrypted), endpoints
    sync_enabled BOOLEAN DEFAULT false,
    sync_frequency VARCHAR(50) CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50) CHECK (last_sync_status IN ('success', 'failed', 'in_progress', 'never_run')),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration sync logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB, -- Detailed sync information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_type VARCHAR(50) NOT NULL CHECK (object_type IN (
        'device',
        'person',
        'location',
        'room',
        'network',
        'software',
        'saas_service',
        'software_license',
        'document',
        'contract',
        'company'
    )),
    field_name VARCHAR(100) NOT NULL, -- Technical name (snake_case)
    field_label VARCHAR(255) NOT NULL, -- Display name
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN (
        'text',
        'number',
        'select',
        'multi_select',
        'date',
        'boolean',
        'textarea',
        'url',
        'email'
    )),
    field_options JSONB, -- For select/multi_select types: {"options": [{"value": "opt1", "label": "Option 1"}]}
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    help_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(object_type, field_name)
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- setting_changed, integration_added, field_created, role_modified, etc.
    category VARCHAR(50) NOT NULL, -- branding, auth, storage, integrations, fields, rbac, import_export
    target_type VARCHAR(50), -- What type of object was affected
    target_id UUID, -- ID of the affected object (if applicable)
    details JSONB NOT NULL, -- What changed (before/after values, additional context)
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated ON system_settings(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_sync_status ON integrations(last_sync_status);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON integration_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON integration_sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_fields_object ON custom_fields(object_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON custom_fields(object_type, display_order);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON admin_audit_log(category);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- System settings
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Integrations
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Custom fields
CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DEFAULT SETTINGS
-- ============================================================================

-- Branding defaults
INSERT INTO system_settings (key, value, category, description) VALUES
    ('branding.site_name', '"M.O.S.S."', 'branding', 'Site name displayed in header and browser title'),
    ('branding.logo_url', 'null', 'branding', 'URL to custom logo image'),
    ('branding.favicon_url', 'null', 'branding', 'URL to custom favicon'),
    ('branding.primary_color', '"#1C7FF2"', 'branding', 'Primary brand color (Morning Blue)'),
    ('branding.background_color', '"#FAF9F5"', 'branding', 'Background color (Off White)'),
    ('branding.text_color', '"#231F20"', 'branding', 'Text color (Brew Black)'),
    ('branding.accent_color', '"#28C077"', 'branding', 'Accent color (Green)')
ON CONFLICT (key) DO NOTHING;

-- Authentication defaults
INSERT INTO system_settings (key, value, category, description) VALUES
    ('auth.backend', '"local"', 'authentication', 'User authentication backend: local, ldap, saml'),
    ('auth.mfa_required', 'false', 'authentication', 'Require multi-factor authentication for all users'),
    ('auth.session_timeout', '2592000', 'authentication', 'Session timeout in seconds (default: 30 days)'),
    ('auth.password_min_length', '8', 'authentication', 'Minimum password length'),
    ('auth.password_require_uppercase', 'true', 'authentication', 'Require uppercase letters in passwords'),
    ('auth.password_require_lowercase', 'true', 'authentication', 'Require lowercase letters in passwords'),
    ('auth.password_require_numbers', 'true', 'authentication', 'Require numbers in passwords'),
    ('auth.password_require_special', 'false', 'authentication', 'Require special characters in passwords'),
    ('auth.saml.enabled', 'false', 'authentication', 'Enable SAML SSO authentication'),
    ('auth.saml.idp_entity_id', 'null', 'authentication', 'SAML Identity Provider Entity ID'),
    ('auth.saml.idp_sso_url', 'null', 'authentication', 'SAML Identity Provider SSO URL'),
    ('auth.saml.idp_certificate', 'null', 'authentication', 'SAML Identity Provider certificate')
ON CONFLICT (key) DO NOTHING;

-- Storage defaults
INSERT INTO system_settings (key, value, category, description) VALUES
    ('storage.backend', '"local"', 'storage', 'File storage backend: local, nfs, smb, s3'),
    ('storage.local.path', '"/var/lib/moss/uploads"', 'storage', 'Local storage path'),
    ('storage.s3.endpoint', 'null', 'storage', 'S3-compatible endpoint URL'),
    ('storage.s3.bucket', 'null', 'storage', 'S3 bucket name'),
    ('storage.s3.region', '"us-east-1"', 'storage', 'S3 region'),
    ('storage.s3.access_key', 'null', 'storage', 'S3 access key (encrypted)'),
    ('storage.s3.secret_key', 'null', 'storage', 'S3 secret key (encrypted)'),
    ('storage.nfs.server', 'null', 'storage', 'NFS server hostname or IP'),
    ('storage.nfs.path', 'null', 'storage', 'NFS share path'),
    ('storage.smb.server', 'null', 'storage', 'SMB/CIFS server hostname or IP'),
    ('storage.smb.share', 'null', 'storage', 'SMB share name'),
    ('storage.smb.username', 'null', 'storage', 'SMB username'),
    ('storage.smb.password', 'null', 'storage', 'SMB password (encrypted)')
ON CONFLICT (key) DO NOTHING;

-- Notification defaults
INSERT INTO system_settings (key, value, category, description) VALUES
    ('notifications.smtp.enabled', 'false', 'notifications', 'Enable email notifications'),
    ('notifications.smtp.host', 'null', 'notifications', 'SMTP server hostname'),
    ('notifications.smtp.port', '587', 'notifications', 'SMTP server port'),
    ('notifications.smtp.username', 'null', 'notifications', 'SMTP username'),
    ('notifications.smtp.password', 'null', 'notifications', 'SMTP password (encrypted)'),
    ('notifications.smtp.from_address', 'null', 'notifications', 'From email address'),
    ('notifications.smtp.from_name', '"M.O.S.S."', 'notifications', 'From name'),
    ('notifications.smtp.use_tls', 'true', 'notifications', 'Use TLS for SMTP connection')
ON CONFLICT (key) DO NOTHING;

-- General defaults
INSERT INTO system_settings (key, value, category, description) VALUES
    ('general.timezone', '"UTC"', 'general', 'Default system timezone'),
    ('general.date_format', '"YYYY-MM-DD"', 'general', 'Default date format'),
    ('general.items_per_page', '50', 'general', 'Default items per page in lists'),
    ('general.backup.enabled', 'false', 'general', 'Enable automatic backups'),
    ('general.backup.frequency', '"daily"', 'general', 'Backup frequency: daily, weekly'),
    ('general.backup.retention_days', '30', 'general', 'Number of days to retain backups')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_settings IS 'System-wide configuration settings stored as key-value pairs with JSONB values';
COMMENT ON TABLE integrations IS 'External system integrations (IdP, MDM, RMM, cloud providers, etc.)';
COMMENT ON TABLE integration_sync_logs IS 'Audit log of integration sync operations';
COMMENT ON TABLE custom_fields IS 'Custom field definitions for extending object types';
COMMENT ON TABLE admin_audit_log IS 'Audit log of all administrative actions';
