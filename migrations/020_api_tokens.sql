-- ============================================================================
-- Migration 023: API Tokens
-- Adds support for Bearer token authentication for API access
-- ============================================================================

-- API Tokens table for programmatic API access
CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token identification
    token_name VARCHAR(255) NOT NULL, -- User-friendly name: "Production Server", "Mobile App"
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash of the actual token
    token_prefix VARCHAR(16) NOT NULL, -- First 8-10 chars for display (e.g., "moss_abc...")

    -- Permissions and scopes
    scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb, -- ['read', 'write', 'admin']

    -- Usage tracking
    last_used_at TIMESTAMP,
    last_used_ip VARCHAR(45), -- IPv4 or IPv6
    usage_count INTEGER DEFAULT 0,

    -- Expiration and status
    expires_at TIMESTAMP, -- NULL = never expires
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique token names per user
    CONSTRAINT unique_user_token_name UNIQUE (user_id, token_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_is_active ON api_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Update timestamp trigger for api_tokens
CREATE OR REPLACE FUNCTION update_api_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_tokens_updated_at_trigger
    BEFORE UPDATE ON api_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_api_tokens_updated_at();

-- View for API token list (without sensitive data)
CREATE OR REPLACE VIEW api_tokens_list AS
SELECT
    t.id,
    t.user_id,
    t.token_name,
    t.token_prefix,
    t.scopes,
    t.last_used_at,
    t.last_used_ip,
    t.usage_count,
    t.expires_at,
    t.is_active,
    t.created_at,
    t.updated_at,
    u.email as user_email,
    p.full_name as user_full_name
FROM api_tokens t
JOIN users u ON t.user_id = u.id
JOIN people p ON u.person_id = p.id;

-- Function to check if token is valid (not expired, is active)
CREATE OR REPLACE FUNCTION is_token_valid(token_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM api_tokens
        WHERE id = token_id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record token usage
CREATE OR REPLACE FUNCTION record_token_usage(token_id UUID, ip_address VARCHAR(45))
RETURNS VOID AS $$
BEGIN
    UPDATE api_tokens
    SET
        last_used_at = NOW(),
        last_used_ip = ip_address,
        usage_count = usage_count + 1
    WHERE id = token_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired tokens (can be run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_tokens
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW() - INTERVAL '90 days' -- Keep for 90 days after expiration for audit
    AND is_active = false;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE api_tokens IS 'API tokens for Bearer token authentication';
COMMENT ON COLUMN api_tokens.token_hash IS 'bcrypt hash of the full token (never store plaintext)';
COMMENT ON COLUMN api_tokens.token_prefix IS 'First 8-10 characters of token for display purposes (e.g., moss_abc12345...)';
COMMENT ON COLUMN api_tokens.scopes IS 'JSON array of permission scopes: read, write, admin';
COMMENT ON COLUMN api_tokens.expires_at IS 'NULL means token never expires (not recommended for production)';
