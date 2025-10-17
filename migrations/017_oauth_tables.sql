-- Migration 020: OAuth 2.1 Tables for MCP Server
-- Creates tables for OAuth client management, authorization codes, and tokens

-- OAuth Clients (applications that can access MCP)
CREATE TABLE IF NOT EXISTS oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret VARCHAR(255) NOT NULL, -- hashed with bcrypt
  client_name VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL, -- Array of allowed redirect URIs
  allowed_scopes TEXT[] NOT NULL DEFAULT ARRAY['mcp:read'], -- mcp:read, mcp:tools, mcp:resources, mcp:prompts, mcp:write
  client_type VARCHAR(50) NOT NULL DEFAULT 'confidential', -- confidential or public
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX idx_oauth_clients_is_active ON oauth_clients(is_active);

-- OAuth Authorization Codes (short-lived, used in authorization code flow)
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  code_challenge VARCHAR(255) NOT NULL, -- PKCE code_challenge (S256 hash)
  code_challenge_method VARCHAR(10) NOT NULL DEFAULT 'S256', -- S256 or plain
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oauth_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX idx_oauth_auth_codes_client_id ON oauth_authorization_codes(client_id);
CREATE INDEX idx_oauth_auth_codes_user_id ON oauth_authorization_codes(user_id);
CREATE INDEX idx_oauth_auth_codes_expires_at ON oauth_authorization_codes(expires_at);

-- OAuth Access Tokens and Refresh Tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token VARCHAR(512) UNIQUE NOT NULL, -- JWT
  refresh_token VARCHAR(512) UNIQUE, -- JWT, nullable for client_credentials flow
  client_id UUID NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for client_credentials flow
  scopes TEXT[] NOT NULL,
  access_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE, -- NULL if no refresh token
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oauth_tokens_access_token ON oauth_tokens(access_token);
CREATE INDEX idx_oauth_tokens_refresh_token ON oauth_tokens(refresh_token);
CREATE INDEX idx_oauth_tokens_client_id ON oauth_tokens(client_id);
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_revoked ON oauth_tokens(revoked);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(access_token_expires_at);

-- Function to clean up expired authorization codes (should be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_authorization_codes
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired and revoked tokens (should be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_tokens
  WHERE (access_token_expires_at < NOW() AND (refresh_token_expires_at < NOW() OR refresh_token_expires_at IS NULL))
     OR revoked = true;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all tokens for a specific user (useful for user logout or account deletion)
CREATE OR REPLACE FUNCTION revoke_user_oauth_tokens(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE oauth_tokens
  SET revoked = true, updated_at = NOW()
  WHERE user_id = p_user_id AND revoked = false;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all tokens for a specific client (useful for client key rotation)
CREATE OR REPLACE FUNCTION revoke_client_oauth_tokens(p_client_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE oauth_tokens
  SET revoked = true, updated_at = NOW()
  WHERE client_id = p_client_id AND revoked = false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE oauth_clients IS 'OAuth 2.1 clients that can access the MCP server';
COMMENT ON TABLE oauth_authorization_codes IS 'Short-lived authorization codes for OAuth 2.1 authorization code flow with PKCE';
COMMENT ON TABLE oauth_tokens IS 'OAuth 2.1 access tokens and refresh tokens for MCP server access';
