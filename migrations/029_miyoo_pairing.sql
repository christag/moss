-- ============================================================================
-- Migration 029: Miyoo Mini Plus Device Pairing
-- Adds support for pairing Miyoo Mini Plus devices with 6-digit codes
-- ============================================================================

-- Miyoo pairing codes table for device authentication
CREATE TABLE IF NOT EXISTS miyoo_pairing_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 6-digit pairing code
    code VARCHAR(6) NOT NULL,

    -- Expiration and usage tracking
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    used_by_device_id UUID, -- References miyoo_devices.id after pairing

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique active codes
    CONSTRAINT unique_active_code UNIQUE (code)
);

-- Miyoo devices table - tracks paired devices and their API tokens
CREATE TABLE IF NOT EXISTS miyoo_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Device identification
    device_name VARCHAR(255) NOT NULL, -- User-friendly name: "Living Room Miyoo", "Portable Console"
    device_serial VARCHAR(255), -- Optional: Miyoo serial number if available

    -- Associated API token
    api_token_id UUID NOT NULL REFERENCES api_tokens(id) ON DELETE CASCADE,

    -- Usage tracking
    last_sync_at TIMESTAMP,
    last_sync_ip VARCHAR(45), -- IPv4 or IPv6
    sync_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique device names per user
    CONSTRAINT unique_user_device_name UNIQUE (user_id, device_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_miyoo_pairing_user_id ON miyoo_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_miyoo_pairing_code ON miyoo_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_miyoo_pairing_expires_at ON miyoo_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_miyoo_devices_user_id ON miyoo_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_miyoo_devices_api_token_id ON miyoo_devices(api_token_id);
CREATE INDEX IF NOT EXISTS idx_miyoo_devices_is_active ON miyoo_devices(is_active) WHERE is_active = true;

-- Update timestamp trigger for miyoo_devices
CREATE OR REPLACE FUNCTION update_miyoo_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER miyoo_devices_updated_at_trigger
    BEFORE UPDATE ON miyoo_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_miyoo_devices_updated_at();

-- Function to generate unique 6-digit pairing code
CREATE OR REPLACE FUNCTION generate_miyoo_pairing_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        -- Generate random 6-digit code (100000-999999)
        new_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');

        -- Check if code is already active (not used and not expired)
        SELECT EXISTS (
            SELECT 1 FROM miyoo_pairing_codes
            WHERE code = new_code
            AND used_at IS NULL
            AND expires_at > NOW()
        ) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;

        -- Prevent infinite loop
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique pairing code after % attempts', max_attempts;
        END IF;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired pairing codes (can be run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_pairing_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM miyoo_pairing_codes
    WHERE expires_at < NOW() - INTERVAL '24 hours' -- Keep for 24 hours after expiration for audit
    AND (used_at IS NOT NULL OR expires_at < NOW());

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to record Miyoo device sync
CREATE OR REPLACE FUNCTION record_miyoo_sync(device_id UUID, ip_address VARCHAR(45))
RETURNS VOID AS $$
BEGIN
    UPDATE miyoo_devices
    SET
        last_sync_at = NOW(),
        last_sync_ip = ip_address,
        sync_count = sync_count + 1
    WHERE id = device_id;
END;
$$ LANGUAGE plpgsql;

-- View for Miyoo devices with API token info (without sensitive data)
CREATE OR REPLACE VIEW miyoo_devices_list AS
SELECT
    md.id,
    md.user_id,
    md.device_name,
    md.device_serial,
    md.api_token_id,
    at.token_name,
    at.token_prefix,
    at.scopes,
    md.last_sync_at,
    md.last_sync_ip,
    md.sync_count,
    md.is_active,
    md.created_at,
    md.updated_at,
    u.email as user_email,
    p.full_name as user_full_name
FROM miyoo_devices md
JOIN api_tokens at ON md.api_token_id = at.id
JOIN users u ON md.user_id = u.id
JOIN people p ON u.person_id = p.id;

-- Comments for documentation
COMMENT ON TABLE miyoo_pairing_codes IS 'Temporary 6-digit codes for pairing Miyoo Mini Plus devices';
COMMENT ON COLUMN miyoo_pairing_codes.code IS '6-digit numeric code, expires in 10 minutes';
COMMENT ON COLUMN miyoo_pairing_codes.expires_at IS 'Codes expire 10 minutes after creation';
COMMENT ON TABLE miyoo_devices IS 'Paired Miyoo Mini Plus devices with associated API tokens';
COMMENT ON COLUMN miyoo_devices.device_name IS 'User-friendly device name (e.g., "Living Room Miyoo")';
COMMENT ON COLUMN miyoo_devices.api_token_id IS 'Associated read-only API token for device authentication';
