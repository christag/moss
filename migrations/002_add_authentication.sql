/**
 * Migration: Add Authentication Foundation
 * Date: 2025-10-10
 * Description: Adds users, roles, and session management tables
 */

-- Create role enum (system-level permissions)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'user',        -- Standard user access
    'admin',       -- Administrative access
    'super_admin'  -- Full system access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table: Links people to authentication
-- Key principle: Not all people are users, but all users are people
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL UNIQUE REFERENCES people(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE, -- Denormalized from people for quick auth lookup
  password_hash TEXT NOT NULL, -- Bcrypt hash
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table: For NextAuth.js session management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verification tokens table: For password resets and email verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL, -- Email or user ID
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (identifier, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Authentication users linked to people. Not all people have user accounts.';
COMMENT ON COLUMN users.person_id IS 'Reference to person record. Creates 1:1 relationship.';
COMMENT ON COLUMN users.email IS 'Denormalized from people.email for fast authentication lookup.';
COMMENT ON COLUMN users.role IS 'System-level role: user, admin, or super_admin. Separate from groups.';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active. Deactivated users cannot login.';

COMMENT ON TABLE sessions IS 'NextAuth.js session storage for stateless authentication.';
COMMENT ON TABLE verification_tokens IS 'Tokens for password resets and email verification.';

-- Create view for user details with person information
CREATE OR REPLACE VIEW user_details AS
SELECT
  u.id AS user_id,
  u.person_id,
  u.email,
  u.role,
  u.is_active,
  u.last_login,
  u.password_changed_at,
  u.created_at AS user_created_at,
  u.updated_at AS user_updated_at,
  p.full_name,
  p.username,
  p.mobile,
  p.person_type,
  p.company_id,
  c.company_name,
  p.location_id,
  l.location_name,
  p.job_title,
  p.department,
  p.status AS person_status
FROM users u
INNER JOIN people p ON u.person_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN locations l ON p.location_id = l.id;

COMMENT ON VIEW user_details IS 'Combined view of user and person information for easy querying.';
