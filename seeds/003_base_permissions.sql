-- ============================================================================
-- Base Permissions Seed Data
-- Creates all base permissions for RBAC system
-- ============================================================================

-- Insert base permissions for all object types and actions
-- Object types match the 16 core object types in M.O.S.S.
-- Actions: view, edit, delete, manage_permissions

INSERT INTO permissions (permission_name, object_type, action, description) VALUES
-- People permissions
('view_people', 'people', 'view', 'View people records'),
('edit_people', 'people', 'edit', 'Edit people records'),
('delete_people', 'people', 'delete', 'Delete people records'),
('manage_permissions_people', 'people', 'manage_permissions', 'Manage permissions for people'),

-- Groups permissions
('view_groups', 'groups', 'view', 'View groups'),
('edit_groups', 'groups', 'edit', 'Edit groups'),
('delete_groups', 'groups', 'delete', 'Delete groups'),
('manage_permissions_groups', 'groups', 'manage_permissions', 'Manage permissions for groups'),

-- Companies permissions
('view_companies', 'companies', 'view', 'View companies'),
('edit_companies', 'companies', 'edit', 'Edit companies'),
('delete_companies', 'companies', 'delete', 'Delete companies'),
('manage_permissions_companies', 'companies', 'manage_permissions', 'Manage permissions for companies'),

-- Locations permissions
('view_locations', 'locations', 'view', 'View locations'),
('edit_locations', 'locations', 'edit', 'Edit locations'),
('delete_locations', 'locations', 'delete', 'Delete locations'),
('manage_permissions_locations', 'locations', 'manage_permissions', 'Manage permissions for locations'),

-- Rooms permissions
('view_rooms', 'rooms', 'view', 'View rooms'),
('edit_rooms', 'rooms', 'edit', 'Edit rooms'),
('delete_rooms', 'rooms', 'delete', 'Delete rooms'),
('manage_permissions_rooms', 'rooms', 'manage_permissions', 'Manage permissions for rooms'),

-- Devices permissions
('view_devices', 'devices', 'view', 'View devices'),
('edit_devices', 'devices', 'edit', 'Edit devices'),
('delete_devices', 'devices', 'delete', 'Delete devices'),
('manage_permissions_devices', 'devices', 'manage_permissions', 'Manage permissions for devices'),

-- IOs permissions
('view_ios', 'ios', 'view', 'View interfaces/ports'),
('edit_ios', 'ios', 'edit', 'Edit interfaces/ports'),
('delete_ios', 'ios', 'delete', 'Delete interfaces/ports'),
('manage_permissions_ios', 'ios', 'manage_permissions', 'Manage permissions for interfaces/ports'),

-- Networks permissions
('view_networks', 'networks', 'view', 'View networks'),
('edit_networks', 'networks', 'edit', 'Edit networks'),
('delete_networks', 'networks', 'delete', 'Delete networks'),
('manage_permissions_networks', 'networks', 'manage_permissions', 'Manage permissions for networks'),

-- IP Addresses permissions
('view_ip_addresses', 'ip_addresses', 'view', 'View IP addresses'),
('edit_ip_addresses', 'ip_addresses', 'edit', 'Edit IP addresses'),
('delete_ip_addresses', 'ip_addresses', 'delete', 'Delete IP addresses'),
('manage_permissions_ip_addresses', 'ip_addresses', 'manage_permissions', 'Manage permissions for IP addresses'),

-- Software permissions
('view_software', 'software', 'view', 'View software'),
('edit_software', 'software', 'edit', 'Edit software'),
('delete_software', 'software', 'delete', 'Delete software'),
('manage_permissions_software', 'software', 'manage_permissions', 'Manage permissions for software'),

-- Software Licenses permissions
('view_software_licenses', 'software_licenses', 'view', 'View software licenses'),
('edit_software_licenses', 'software_licenses', 'edit', 'Edit software licenses'),
('delete_software_licenses', 'software_licenses', 'delete', 'Delete software licenses'),
('manage_permissions_software_licenses', 'software_licenses', 'manage_permissions', 'Manage permissions for software licenses'),

-- Installed Applications permissions
('view_installed_applications', 'installed_applications', 'view', 'View installed applications'),
('edit_installed_applications', 'installed_applications', 'edit', 'Edit installed applications'),
('delete_installed_applications', 'installed_applications', 'delete', 'Delete installed applications'),
('manage_permissions_installed_applications', 'installed_applications', 'manage_permissions', 'Manage permissions for installed applications'),

-- SaaS Services permissions
('view_saas_services', 'saas_services', 'view', 'View SaaS services'),
('edit_saas_services', 'saas_services', 'edit', 'Edit SaaS services'),
('delete_saas_services', 'saas_services', 'delete', 'Delete SaaS services'),
('manage_permissions_saas_services', 'saas_services', 'manage_permissions', 'Manage permissions for SaaS services'),

-- Documents permissions
('view_documents', 'documents', 'view', 'View documents'),
('edit_documents', 'documents', 'edit', 'Edit documents'),
('delete_documents', 'documents', 'delete', 'Delete documents'),
('manage_permissions_documents', 'documents', 'manage_permissions', 'Manage permissions for documents'),

-- External Documents permissions
('view_external_documents', 'external_documents', 'view', 'View external documents'),
('edit_external_documents', 'external_documents', 'edit', 'Edit external documents'),
('delete_external_documents', 'external_documents', 'delete', 'Delete external documents'),
('manage_permissions_external_documents', 'external_documents', 'manage_permissions', 'Manage permissions for external documents'),

-- Contracts permissions
('view_contracts', 'contracts', 'view', 'View contracts'),
('edit_contracts', 'contracts', 'edit', 'Edit contracts'),
('delete_contracts', 'contracts', 'delete', 'Delete contracts'),
('manage_permissions_contracts', 'contracts', 'manage_permissions', 'Manage permissions for contracts');

COMMENT ON TABLE permissions IS 'Base permissions seeded by 003_base_permissions.sql - Total: 64 permissions (16 object types × 4 actions)';
