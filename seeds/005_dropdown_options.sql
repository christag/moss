-- ============================================================================
-- Seed 005: Initial Dropdown Field Options
-- ============================================================================
-- Purpose: Populate dropdown_field_options with all built-in dropdown values
-- Source: Extracted from CHECK constraints in migrations/001_initial_schema.sql
-- Total: ~200 options across 29 fields in 16 object types
-- ============================================================================

BEGIN;

-- ============================================================================
-- COMPANIES
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('companies', 'company_type', 'own_organization', 'Own Organization', 1, true, '#1C7FF2'),
('companies', 'company_type', 'vendor', 'Vendor', 2, true, '#28C077'),
('companies', 'company_type', 'manufacturer', 'Manufacturer', 3, true, '#FFBB5C'),
('companies', 'company_type', 'service_provider', 'Service Provider', 4, true, '#BCF46E'),
('companies', 'company_type', 'partner', 'Partner', 5, true, '#ACD7FF'),
('companies', 'company_type', 'customer', 'Customer', 6, true, '#FD6A3D'),
('companies', 'company_type', 'other', 'Other', 7, true, NULL);

-- ============================================================================
-- LOCATIONS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('locations', 'location_type', 'office', 'Office', 1, true, '#1C7FF2'),
('locations', 'location_type', 'datacenter', 'Data Center', 2, true, '#28C077'),
('locations', 'location_type', 'colo', 'Colocation Facility', 3, true, '#FFBB5C'),
('locations', 'location_type', 'remote', 'Remote Location', 4, true, '#ACD7FF'),
('locations', 'location_type', 'warehouse', 'Warehouse', 5, true, '#BCF46E'),
('locations', 'location_type', 'studio', 'Studio', 6, true, '#FD6A3D'),
('locations', 'location_type', 'broadcast_facility', 'Broadcast Facility', 7, true, '#FFBB5C');

-- ============================================================================
-- ROOMS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('rooms', 'room_type', 'office', 'Office', 1, true, '#1C7FF2'),
('rooms', 'room_type', 'conference_room', 'Conference Room', 2, true, '#ACD7FF'),
('rooms', 'room_type', 'server_room', 'Server Room', 3, true, '#28C077'),
('rooms', 'room_type', 'closet', 'Closet', 4, true, NULL),
('rooms', 'room_type', 'studio', 'Studio', 5, true, '#FD6A3D'),
('rooms', 'room_type', 'control_room', 'Control Room', 6, true, '#FFBB5C'),
('rooms', 'room_type', 'edit_bay', 'Edit Bay', 7, true, '#BCF46E'),
('rooms', 'room_type', 'storage', 'Storage', 8, true, NULL),
('rooms', 'room_type', 'other', 'Other', 9, true, NULL);

-- ============================================================================
-- PEOPLE
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('people', 'person_type', 'employee', 'Employee', 1, true, '#1C7FF2'),
('people', 'person_type', 'contractor', 'Contractor', 2, true, '#FFBB5C'),
('people', 'person_type', 'vendor_contact', 'Vendor Contact', 3, true, '#28C077'),
('people', 'person_type', 'partner', 'Partner', 4, true, '#ACD7FF'),
('people', 'person_type', 'customer', 'Customer', 5, true, '#FD6A3D'),
('people', 'person_type', 'other', 'Other', 6, true, NULL);

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('people', 'status', 'active', 'Active', 1, true, '#28C077'),
('people', 'status', 'inactive', 'Inactive', 2, true, '#ACD7FF'),
('people', 'status', 'terminated', 'Terminated', 3, true, '#FD6A3D');

-- ============================================================================
-- DEVICES
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('devices', 'device_type', 'computer', 'Computer', 1, true, '#1C7FF2'),
('devices', 'device_type', 'server', 'Server', 2, true, '#28C077'),
('devices', 'device_type', 'switch', 'Switch', 3, true, '#FFBB5C'),
('devices', 'device_type', 'router', 'Router', 4, true, '#BCF46E'),
('devices', 'device_type', 'firewall', 'Firewall', 5, true, '#FD6A3D'),
('devices', 'device_type', 'printer', 'Printer', 6, true, '#ACD7FF'),
('devices', 'device_type', 'mobile', 'Mobile Device', 7, true, '#1C7FF2'),
('devices', 'device_type', 'iot', 'IoT Device', 8, true, '#BCF46E'),
('devices', 'device_type', 'appliance', 'Appliance', 9, true, NULL),
('devices', 'device_type', 'av_equipment', 'AV Equipment', 10, true, '#FD6A3D'),
('devices', 'device_type', 'broadcast_equipment', 'Broadcast Equipment', 11, true, '#FFBB5C'),
('devices', 'device_type', 'patch_panel', 'Patch Panel', 12, true, NULL),
('devices', 'device_type', 'ups', 'UPS', 13, true, '#28C077'),
('devices', 'device_type', 'pdu', 'PDU', 14, true, '#28C077'),
('devices', 'device_type', 'chassis', 'Chassis', 15, true, NULL),
('devices', 'device_type', 'module', 'Module', 16, true, NULL),
('devices', 'device_type', 'blade', 'Blade Server', 17, true, '#28C077');

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('devices', 'status', 'active', 'Active', 1, true, '#28C077'),
('devices', 'status', 'retired', 'Retired', 2, true, '#ACD7FF'),
('devices', 'status', 'repair', 'In Repair', 3, true, '#FFBB5C'),
('devices', 'status', 'storage', 'In Storage', 4, true, NULL);

-- ============================================================================
-- NETWORKS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('networks', 'network_type', 'lan', 'LAN', 1, true, '#1C7FF2'),
('networks', 'network_type', 'wan', 'WAN', 2, true, '#28C077'),
('networks', 'network_type', 'dmz', 'DMZ', 3, true, '#FD6A3D'),
('networks', 'network_type', 'guest', 'Guest Network', 4, true, '#ACD7FF'),
('networks', 'network_type', 'management', 'Management', 5, true, '#FFBB5C'),
('networks', 'network_type', 'storage', 'Storage Network', 6, true, '#28C077'),
('networks', 'network_type', 'production', 'Production', 7, true, '#BCF46E'),
('networks', 'network_type', 'broadcast', 'Broadcast Network', 8, true, '#FD6A3D');

-- ============================================================================
-- IOS (INTERFACES/PORTS)
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ios', 'interface_type', 'ethernet', 'Ethernet', 1, true, '#1C7FF2'),
('ios', 'interface_type', 'wifi', 'WiFi', 2, true, '#ACD7FF'),
('ios', 'interface_type', 'virtual', 'Virtual', 3, true, '#BCF46E'),
('ios', 'interface_type', 'fiber_optic', 'Fiber Optic', 4, true, '#28C077'),
('ios', 'interface_type', 'sdi', 'SDI', 5, true, '#FD6A3D'),
('ios', 'interface_type', 'hdmi', 'HDMI', 6, true, '#FFBB5C'),
('ios', 'interface_type', 'xlr', 'XLR', 7, true, '#FD6A3D'),
('ios', 'interface_type', 'usb', 'USB', 8, true, '#1C7FF2'),
('ios', 'interface_type', 'thunderbolt', 'Thunderbolt', 9, true, '#ACD7FF'),
('ios', 'interface_type', 'displayport', 'DisplayPort', 10, true, '#1C7FF2'),
('ios', 'interface_type', 'coax', 'Coaxial', 11, true, NULL),
('ios', 'interface_type', 'serial', 'Serial', 12, true, NULL),
('ios', 'interface_type', 'patch_panel_port', 'Patch Panel Port', 13, true, '#28C077'),
('ios', 'interface_type', 'power_input', 'Power Input', 14, true, '#28C077'),
('ios', 'interface_type', 'power_output', 'Power Output', 15, true, '#28C077'),
('ios', 'interface_type', 'other', 'Other', 16, true, NULL);

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ios', 'media_type', 'single_mode_fiber', 'Single-Mode Fiber', 1, true, '#28C077'),
('ios', 'media_type', 'multi_mode_fiber', 'Multi-Mode Fiber', 2, true, '#28C077'),
('ios', 'media_type', 'cat5e', 'Cat5e', 3, true, '#1C7FF2'),
('ios', 'media_type', 'cat6', 'Cat6', 4, true, '#1C7FF2'),
('ios', 'media_type', 'cat6a', 'Cat6a', 5, true, '#1C7FF2'),
('ios', 'media_type', 'coax', 'Coaxial', 6, true, NULL),
('ios', 'media_type', 'wireless', 'Wireless', 7, true, '#ACD7FF'),
('ios', 'media_type', 'ac_power', 'AC Power', 8, true, '#28C077'),
('ios', 'media_type', 'dc_power', 'DC Power', 9, true, '#28C077'),
('ios', 'media_type', 'poe', 'Power over Ethernet', 10, true, '#BCF46E'),
('ios', 'media_type', 'other', 'Other', 11, true, NULL);

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ios', 'status', 'active', 'Active', 1, true, '#28C077'),
('ios', 'status', 'inactive', 'Inactive', 2, true, '#ACD7FF'),
('ios', 'status', 'monitoring', 'Monitoring', 3, true, '#FFBB5C'),
('ios', 'status', 'reserved', 'Reserved', 4, true, '#BCF46E');

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ios', 'duplex', 'full', 'Full Duplex', 1, true, '#28C077'),
('ios', 'duplex', 'half', 'Half Duplex', 2, true, '#FFBB5C'),
('ios', 'duplex', 'auto', 'Auto', 3, true, '#ACD7FF'),
('ios', 'duplex', 'n/a', 'N/A', 4, true, NULL);

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ios', 'trunk_mode', 'access', 'Access Port', 1, true, '#1C7FF2'),
('ios', 'trunk_mode', 'trunk', 'Trunk Port', 2, true, '#28C077'),
('ios', 'trunk_mode', 'hybrid', 'Hybrid Port', 3, true, '#FFBB5C'),
('ios', 'trunk_mode', 'n/a', 'N/A', 4, true, NULL);

-- ============================================================================
-- IP ADDRESSES
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ip_addresses', 'ip_version', 'v4', 'IPv4', 1, true, '#1C7FF2'),
('ip_addresses', 'ip_version', 'v6', 'IPv6', 2, true, '#28C077');

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('ip_addresses', 'type', 'static', 'Static', 1, true, '#1C7FF2'),
('ip_addresses', 'type', 'dhcp', 'DHCP', 2, true, '#28C077'),
('ip_addresses', 'type', 'reserved', 'Reserved', 3, true, '#FFBB5C'),
('ip_addresses', 'type', 'floating', 'Floating IP', 4, true, '#ACD7FF');

-- ============================================================================
-- SOFTWARE
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('software', 'software_category', 'productivity', 'Productivity', 1, true, '#1C7FF2'),
('software', 'software_category', 'security', 'Security', 2, true, '#FD6A3D'),
('software', 'software_category', 'development', 'Development', 3, true, '#28C077'),
('software', 'software_category', 'communication', 'Communication', 4, true, '#ACD7FF'),
('software', 'software_category', 'infrastructure', 'Infrastructure', 5, true, '#28C077'),
('software', 'software_category', 'collaboration', 'Collaboration', 6, true, '#BCF46E'),
('software', 'software_category', 'broadcast', 'Broadcast', 7, true, '#FD6A3D'),
('software', 'software_category', 'media', 'Media Production', 8, true, '#FFBB5C'),
('software', 'software_category', 'other', 'Other', 9, true, NULL);

-- ============================================================================
-- SAAS SERVICES
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('saas_services', 'environment', 'production', 'Production', 1, true, '#28C077'),
('saas_services', 'environment', 'staging', 'Staging', 2, true, '#FFBB5C'),
('saas_services', 'environment', 'dev', 'Development', 3, true, '#ACD7FF'),
('saas_services', 'environment', 'sandbox', 'Sandbox', 4, true, '#BCF46E');

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('saas_services', 'status', 'active', 'Active', 1, true, '#28C077'),
('saas_services', 'status', 'trial', 'Trial', 2, true, '#FFBB5C'),
('saas_services', 'status', 'inactive', 'Inactive', 3, true, '#ACD7FF'),
('saas_services', 'status', 'cancelled', 'Cancelled', 4, true, '#FD6A3D');

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('saas_services', 'criticality', 'critical', 'Critical', 1, true, '#FD6A3D'),
('saas_services', 'criticality', 'high', 'High', 2, true, '#FFBB5C'),
('saas_services', 'criticality', 'medium', 'Medium', 3, true, '#BCF46E'),
('saas_services', 'criticality', 'low', 'Low', 4, true, '#ACD7FF');

-- ============================================================================
-- INSTALLED APPLICATIONS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('installed_applications', 'deployment_status', 'pilot', 'Pilot', 1, true, '#FFBB5C'),
('installed_applications', 'deployment_status', 'production', 'Production', 2, true, '#28C077'),
('installed_applications', 'deployment_status', 'deprecated', 'Deprecated', 3, true, '#FD6A3D'),
('installed_applications', 'deployment_status', 'retired', 'Retired', 4, true, '#ACD7FF');

-- ============================================================================
-- SOFTWARE LICENSES
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('software_licenses', 'license_type', 'perpetual', 'Perpetual', 1, true, '#1C7FF2'),
('software_licenses', 'license_type', 'subscription', 'Subscription', 2, true, '#28C077'),
('software_licenses', 'license_type', 'free', 'Free/Open Source', 3, true, '#BCF46E'),
('software_licenses', 'license_type', 'volume', 'Volume License', 4, true, '#FFBB5C'),
('software_licenses', 'license_type', 'site', 'Site License', 5, true, '#ACD7FF'),
('software_licenses', 'license_type', 'concurrent', 'Concurrent/Floating', 6, true, '#FD6A3D');

-- ============================================================================
-- GROUPS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('groups', 'group_type', 'active_directory', 'Active Directory', 1, true, '#1C7FF2'),
('groups', 'group_type', 'okta', 'Okta', 2, true, '#ACD7FF'),
('groups', 'group_type', 'google_workspace', 'Google Workspace', 3, true, '#28C077'),
('groups', 'group_type', 'jamf_smart_group', 'Jamf Smart Group', 4, true, '#FFBB5C'),
('groups', 'group_type', 'intune', 'Microsoft Intune', 5, true, '#1C7FF2'),
('groups', 'group_type', 'custom', 'Custom', 6, true, '#BCF46E'),
('groups', 'group_type', 'distribution_list', 'Distribution List', 7, true, '#ACD7FF'),
('groups', 'group_type', 'security', 'Security Group', 8, true, '#FD6A3D');

-- ============================================================================
-- CONTRACTS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('contracts', 'contract_type', 'support', 'Support Contract', 1, true, '#28C077'),
('contracts', 'contract_type', 'license', 'License Agreement', 2, true, '#1C7FF2'),
('contracts', 'contract_type', 'service', 'Service Agreement', 3, true, '#ACD7FF'),
('contracts', 'contract_type', 'lease', 'Lease', 4, true, '#FFBB5C'),
('contracts', 'contract_type', 'maintenance', 'Maintenance', 5, true, '#28C077'),
('contracts', 'contract_type', 'consulting', 'Consulting', 6, true, '#BCF46E');

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('documents', 'document_type', 'policy', 'Policy', 1, true, '#FD6A3D'),
('documents', 'document_type', 'procedure', 'Procedure', 2, true, '#1C7FF2'),
('documents', 'document_type', 'diagram', 'Diagram', 3, true, '#28C077'),
('documents', 'document_type', 'runbook', 'Runbook', 4, true, '#FFBB5C'),
('documents', 'document_type', 'architecture', 'Architecture', 5, true, '#ACD7FF'),
('documents', 'document_type', 'sop', 'SOP', 6, true, '#1C7FF2'),
('documents', 'document_type', 'network_diagram', 'Network Diagram', 7, true, '#28C077'),
('documents', 'document_type', 'rack_diagram', 'Rack Diagram', 8, true, '#28C077'),
('documents', 'document_type', 'other', 'Other', 9, true, NULL);

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('documents', 'status', 'draft', 'Draft', 1, true, '#FFBB5C'),
('documents', 'status', 'published', 'Published', 2, true, '#28C077'),
('documents', 'status', 'archived', 'Archived', 3, true, '#ACD7FF');

-- ============================================================================
-- EXTERNAL DOCUMENTS
-- ============================================================================

INSERT INTO dropdown_field_options (object_type, field_name, option_value, option_label, display_order, is_system, color) VALUES
('external_documents', 'document_type', 'password_vault', 'Password Vault Entry', 1, true, '#FD6A3D'),
('external_documents', 'document_type', 'ssl_certificate', 'SSL Certificate', 2, true, '#28C077'),
('external_documents', 'document_type', 'domain_registrar', 'Domain Registrar', 3, true, '#1C7FF2'),
('external_documents', 'document_type', 'ticket', 'Support Ticket', 4, true, '#FFBB5C'),
('external_documents', 'document_type', 'runbook', 'Runbook', 5, true, '#ACD7FF'),
('external_documents', 'document_type', 'diagram', 'Diagram', 6, true, '#28C077'),
('external_documents', 'document_type', 'wiki_page', 'Wiki Page', 7, true, '#BCF46E'),
('external_documents', 'document_type', 'contract', 'Contract', 8, true, '#1C7FF2'),
('external_documents', 'document_type', 'invoice', 'Invoice', 9, true, '#FFBB5C'),
('external_documents', 'document_type', 'other', 'Other', 10, true, NULL);

COMMIT;

-- Log successful seed
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Seed 005: Dropdown Field Options';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Seeded dropdown options for 29 fields';
    RAISE NOTICE 'Total options: ~200';
    RAISE NOTICE 'All options marked as system (is_system=true)';
    RAISE NOTICE 'Colors assigned for visual badges';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage: Navigate to /admin/fields to manage';
    RAISE NOTICE '==============================================';
END $$;
