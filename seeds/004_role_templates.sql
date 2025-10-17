-- ============================================================================
-- Seed Data: IT Role Templates
-- Provides industry-standard IT roles with appropriate permission sets
-- Run after 001_sample_data.sql to add these roles to existing schema
-- ============================================================================

-- Role Templates for IT Organizations
-- These are non-system roles that can be customized by admins

INSERT INTO roles (id, role_name, description, is_system_role, parent_role_id) VALUES
-- IT Admin: Full access to IT infrastructure objects
('00000000-0000-0000-000a-000000000010', 'IT Admin', 'Full access to devices, networks, software, and IT infrastructure. Can manage all IT assets but cannot manage users or system settings.', false, NULL),

-- Help Desk: View all, edit people/devices, create tickets
('00000000-0000-0000-000a-000000000011', 'Help Desk', 'Can view all objects, edit people and devices, and manage software licenses. Typical role for IT support staff.', false, NULL),

-- Network Admin: Full network and device access, view others
('00000000-0000-0000-000a-000000000012', 'Network Admin', 'Full control over networks, IOs, IP addresses, and network-related devices. Can view but not edit other objects.', false, NULL),

-- Security Auditor: View-only access to everything
('00000000-0000-0000-000a-000000000013', 'Security Auditor', 'Read-only access to all objects for security auditing and compliance purposes. Cannot make any changes.', false, NULL),

-- Location Manager: Full access within assigned locations only
('00000000-0000-0000-000a-000000000014', 'Location Manager', 'Can view and edit all objects, and delete most objects within assigned locations. Intended for use with location-scoped assignments.', false, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IT Admin Permissions
-- Full access to all IT-related objects, view access to organizational objects
-- ============================================================================

-- Devices: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'devices' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Networks: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'networks' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- IOs: Full access (if they exist in permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'ios' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- IP Addresses: Full access (if they exist in permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'ip_addresses' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Software: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'software' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- SaaS Services: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'saas_services' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Software Licenses: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'software_licenses' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Installed Applications: Full access (if they exist in permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'installed_applications' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- People: View and edit (for managing device assignments, not HR functions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'people' AND action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- Groups: View and edit (if they exist in permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'groups' AND action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- Locations, Rooms: View and edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type IN ('locations', 'rooms') AND action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- Companies: View only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'companies' AND action = 'view'
ON CONFLICT DO NOTHING;

-- Documents: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type IN ('documents', 'external_documents') AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Contracts: View and edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000010', id FROM permissions
WHERE object_type = 'contracts' AND action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Help Desk Permissions
-- View all, edit people/devices/licenses, no delete
-- ============================================================================

-- All objects: View access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE action = 'view'
ON CONFLICT DO NOTHING;

-- People: Edit (for user support)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE object_type = 'people' AND action = 'edit'
ON CONFLICT DO NOTHING;

-- Devices: Edit (for troubleshooting and asset management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE object_type = 'devices' AND action = 'edit'
ON CONFLICT DO NOTHING;

-- Software Licenses: Edit (for license assignment)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE object_type = 'software_licenses' AND action = 'edit'
ON CONFLICT DO NOTHING;

-- Installed Applications: Edit (for software deployment tracking)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE object_type = 'installed_applications' AND action = 'edit'
ON CONFLICT DO NOTHING;

-- Documents: Edit (for creating support documentation)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000011', id FROM permissions
WHERE object_type = 'documents' AND action = 'edit'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Network Admin Permissions
-- Full network infrastructure access, view everything else
-- ============================================================================

-- Networks: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type = 'networks' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- IOs: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type = 'ios' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- IP Addresses: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type = 'ip_addresses' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Devices with network interfaces: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type = 'devices' AND action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- Rooms (for network drops/ports): Edit access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type = 'rooms' AND action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- Everything else: View only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000012', id FROM permissions
WHERE object_type IN ('companies', 'locations', 'people', 'groups', 'software', 'saas_services',
                       'software_licenses', 'installed_applications', 'documents',
                       'external_documents', 'contracts')
AND action = 'view'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Security Auditor Permissions
-- View-only access to everything for compliance and auditing
-- ============================================================================

-- All objects: View access only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000013', id FROM permissions
WHERE action = 'view'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Location Manager Permissions
-- Intended for location-scoped assignments
-- Full access within assigned locations (except manage_permissions)
-- ============================================================================

-- All objects: View, edit, delete (but not manage_permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000014', id FROM permissions
WHERE action IN ('view', 'edit', 'delete')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE roles IS 'Extended with IT role templates: IT Admin, Help Desk, Network Admin, Security Auditor, Location Manager';
