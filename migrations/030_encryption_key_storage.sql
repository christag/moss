-- ============================================================================
-- Migration 030: Encryption Key Storage
-- ============================================================================
-- Description: Add encryption_keys table for auto-generated AES-256 encryption
--              keys used to secure integration credentials. Supports ENV var
--              override for advanced deployments.
--
-- Created: 2025-Nov-13
-- Author: Claude Code
-- ============================================================================

-- Create encryption_keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- The encryption key itself (base64-encoded 256-bit key)
    -- Stored in plaintext - protected by database access controls
    -- Priority: ENV var ENCRYPTION_KEY > this database value
    encryption_key TEXT NOT NULL,

    -- Metadata
    description TEXT DEFAULT 'Auto-generated encryption key',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Only one active key at a time (future: support key rotation)
    is_active BOOLEAN DEFAULT true,

    -- Future: Key rotation support
    rotated_at TIMESTAMP,
    replaced_by_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL
);

-- Ensure only one active key exists at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_keys_active
    ON encryption_keys(is_active)
    WHERE is_active = true;

-- Index for key rotation queries
CREATE INDEX IF NOT EXISTS idx_encryption_keys_created
    ON encryption_keys(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE encryption_keys IS
    'Stores auto-generated AES-256 encryption keys for securing integration credentials. Priority order: ENCRYPTION_KEY env var > active database key > auto-generate new key.';

COMMENT ON COLUMN encryption_keys.encryption_key IS
    'Base64-encoded 256-bit AES key. Stored in plaintext, protected by database access controls and optional ENCRYPTION_KEY env var override.';

COMMENT ON COLUMN encryption_keys.is_active IS
    'Only one key can be active at a time. Future feature: key rotation will deactivate old keys and create new ones.';

COMMENT ON COLUMN encryption_keys.replaced_by_key_id IS
    'For key rotation: points to the new key that replaced this one.';

-- ============================================================================
-- End Migration 030
-- ============================================================================
