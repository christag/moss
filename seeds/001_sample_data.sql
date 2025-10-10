-- Seed Data: Sample Companies, Locations, Rooms, People, and Devices
-- This provides realistic test data for development

-- Companies
INSERT INTO companies (id, name, company_type, website, status) VALUES
('00000000-0000-0000-0000-000000000001', 'TechCorp Industries', 'own_organization', 'https://techcorp.example.com', 'active'),
('00000000-0000-0000-0000-000000000002', 'Dell Technologies', 'vendor', 'https://dell.com', 'active'),
('00000000-0000-0000-0000-000000000003', 'HP Inc.', 'manufacturer', 'https://hp.com', 'active'),
('00000000-0000-0000-0000-000000000004', 'Cisco Systems', 'vendor', 'https://cisco.com', 'active'),
('00000000-0000-0000-0000-000000000005', 'Microsoft Corporation', 'vendor', 'https://microsoft.com', 'active'),
('00000000-0000-0000-0000-000000000006', 'Acme Consulting', 'partner', 'https://acme.example.com', 'active');

-- Locations
INSERT INTO locations (id, name, company_id, address_line1, city, state_province, postal_code, country, status) VALUES
('00000000-0000-0000-0001-000000000001', 'Headquarters', '00000000-0000-0000-0000-000000000001', '123 Tech Boulevard', 'San Francisco', 'CA', '94103', 'USA', 'active'),
('00000000-0000-0000-0001-000000000002', 'East Coast Office', '00000000-0000-0000-0000-000000000001', '456 Innovation Drive', 'New York', 'NY', '10001', 'USA', 'active'),
('00000000-0000-0000-0001-000000000003', 'Remote Data Center', '00000000-0000-0000-0000-000000000001', '789 Cloud Street', 'Austin', 'TX', '78701', 'USA', 'active');

-- Rooms
INSERT INTO rooms (id, name, location_id, room_type, floor) VALUES
('00000000-0000-0000-0002-000000000001', 'Main Server Room', '00000000-0000-0000-0001-000000000001', 'server_room', '1'),
('00000000-0000-0000-0002-000000000002', 'IT Office', '00000000-0000-0000-0001-000000000001', 'office', '2'),
('00000000-0000-0000-0002-000000000003', 'Conference Room A', '00000000-0000-0000-0001-000000000001', 'conference_room', '3'),
('00000000-0000-0000-0002-000000000004', 'Network Closet B', '00000000-0000-0000-0001-000000000002', 'server_room', '1'),
('00000000-0000-0000-0002-000000000005', 'Storage Room', '00000000-0000-0000-0001-000000000001', 'storage', 'B1');

-- People
INSERT INTO people (id, first_name, last_name, email, phone, person_type, company_id, employee_id, job_title, department, location_id, status) VALUES
('00000000-0000-0000-0003-000000000001', 'Alice', 'Johnson', 'alice.johnson@techcorp.example.com', '555-0101', 'employee', '00000000-0000-0000-0000-000000000001', 'EMP001', 'IT Director', 'Information Technology', '00000000-0000-0000-0001-000000000001', 'active'),
('00000000-0000-0000-0003-000000000002', 'Bob', 'Smith', 'bob.smith@techcorp.example.com', '555-0102', 'employee', '00000000-0000-0000-0000-000000000001', 'EMP002', 'Network Administrator', 'Information Technology', '00000000-0000-0000-0001-000000000001', 'active'),
('00000000-0000-0000-0003-000000000003', 'Carol', 'Williams', 'carol.williams@techcorp.example.com', '555-0103', 'employee', '00000000-0000-0000-0000-000000000001', 'EMP003', 'Systems Engineer', 'Information Technology', '00000000-0000-0000-0001-000000000002', 'active'),
('00000000-0000-0000-0003-000000000004', 'David', 'Brown', 'david.brown@techcorp.example.com', '555-0104', 'employee', '00000000-0000-0000-0000-000000000001', 'EMP004', 'Help Desk Specialist', 'Information Technology', '00000000-0000-0000-0001-000000000001', 'active'),
('00000000-0000-0000-0003-000000000005', 'Eve', 'Davis', 'eve.davis@acme.example.com', '555-0201', 'contractor', '00000000-0000-0000-0000-000000000006', NULL, 'Security Consultant', 'Consulting', '00000000-0000-0000-0001-000000000001', 'active');

-- Set manager relationships
UPDATE people SET manager_id = '00000000-0000-0000-0003-000000000001' WHERE id IN ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0003-000000000004');

-- Networks
INSERT INTO networks (id, name, vlan_id, network_address, network_type, gateway, dns_primary, dhcp_enabled, location_id) VALUES
('00000000-0000-0000-0004-000000000001', 'Management VLAN', 10, '10.0.10.0/24', 'management', '10.0.10.1', '10.0.10.1', true, '00000000-0000-0000-0001-000000000001'),
('00000000-0000-0000-0004-000000000002', 'Production VLAN', 20, '10.0.20.0/24', 'production', '10.0.20.1', '10.0.10.1', true, '00000000-0000-0000-0001-000000000001'),
('00000000-0000-0000-0004-000000000003', 'Guest WiFi', 30, '10.0.30.0/24', 'guest', '10.0.30.1', '8.8.8.8', true, '00000000-0000-0000-0001-000000000001'),
('00000000-0000-0000-0004-000000000004', 'Server VLAN', 100, '10.0.100.0/24', 'production', '10.0.100.1', '10.0.10.1', false, '00000000-0000-0000-0001-000000000001');

-- Devices
INSERT INTO devices (id, name, device_type, manufacturer, model, serial_number, asset_tag, location_id, room_id, status) VALUES
-- Network Equipment
('00000000-0000-0000-0005-000000000001', 'Core Switch 01', 'network_switch', 'Cisco Systems', 'Catalyst 9300', 'FDO2345A1BC', 'NET-001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),
('00000000-0000-0000-0005-000000000002', 'Access Switch 02', 'network_switch', 'Cisco Systems', 'Catalyst 2960', 'FDO2345A2CD', 'NET-002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),
('00000000-0000-0000-0005-000000000003', 'Firewall 01', 'firewall', 'Cisco Systems', 'ASA 5516-X', 'JAD2234567A', 'NET-003', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),

-- Servers
('00000000-0000-0000-0005-000000000004', 'Web Server 01', 'server', 'Dell Technologies', 'PowerEdge R740', 'ABCD1234567', 'SRV-001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),
('00000000-0000-0000-0005-000000000005', 'Database Server 01', 'server', 'Dell Technologies', 'PowerEdge R740xd', 'EFGH7654321', 'SRV-002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),
('00000000-0000-0000-0005-000000000006', 'File Server 01', 'server', 'HP Inc.', 'ProLiant DL380 Gen10', 'HPFG9876543', 'SRV-003', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'active'),

-- Workstations
('00000000-0000-0000-0005-000000000007', 'Alice Laptop', 'laptop', 'Dell Technologies', 'Latitude 7420', 'LAPTOP001', 'WS-001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', 'active'),
('00000000-0000-0000-0005-000000000008', 'Bob Desktop', 'desktop', 'HP Inc.', 'EliteDesk 800 G6', 'DESKTOP001', 'WS-002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', 'active'),
('00000000-0000-0000-0005-000000000009', 'Carol Laptop', 'laptop', 'Dell Technologies', 'Latitude 7420', 'LAPTOP002', 'WS-003', '00000000-0000-0000-0001-000000000002', NULL, 'active');

-- Assign devices to people
UPDATE devices SET assigned_to = '00000000-0000-0000-0003-000000000001' WHERE id = '00000000-0000-0000-0005-000000000007';
UPDATE devices SET assigned_to = '00000000-0000-0000-0003-000000000002' WHERE id = '00000000-0000-0000-0005-000000000008';
UPDATE devices SET assigned_to = '00000000-0000-0000-0003-000000000003' WHERE id = '00000000-0000-0000-0005-000000000009';

-- IOs (Network Interfaces)
INSERT INTO ios (id, device_id, interface_name, interface_type, speed, duplex, trunk_mode, native_network_id, status) VALUES
-- Core Switch interfaces
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0005-000000000001', 'GigabitEthernet1/0/1', 'network_ethernet', '1000', 'full', 'trunk', '00000000-0000-0000-0004-000000000001', 'active'),
('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0005-000000000001', 'GigabitEthernet1/0/2', 'network_ethernet', '1000', 'full', 'access', '00000000-0000-0000-0004-000000000002', 'active'),
('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0005-000000000001', 'GigabitEthernet1/0/3', 'network_ethernet', '1000', 'full', 'access', '00000000-0000-0000-0004-000000000002', 'active'),

-- Access Switch interfaces
('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0005-000000000002', 'GigabitEthernet1/0/1', 'network_ethernet', '1000', 'full', 'trunk', '00000000-0000-0000-0004-000000000001', 'active'),
('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0005-000000000002', 'GigabitEthernet1/0/5', 'network_ethernet', '1000', 'full', 'access', '00000000-0000-0000-0004-000000000002', 'active'),

-- Server interfaces
('00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0005-000000000004', 'eth0', 'network_ethernet', '10000', 'full', 'access', '00000000-0000-0000-0004-000000000004', 'active'),
('00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0005-000000000005', 'eth0', 'network_ethernet', '10000', 'full', 'access', '00000000-0000-0000-0004-000000000004', 'active'),

-- Workstation interfaces
('00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0005-000000000007', 'WiFi', 'network_wifi', '867', 'full', 'access', '00000000-0000-0000-0004-000000000002', 'active'),
('00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0005-000000000008', 'eth0', 'network_ethernet', '1000', 'full', 'access', '00000000-0000-0000-0004-000000000002', 'active');

-- IO Connections (physical topology)
UPDATE ios SET connected_to_io_id = '00000000-0000-0000-0006-000000000001' WHERE id = '00000000-0000-0000-0006-000000000004'; -- Access switch uplink to core
UPDATE ios SET connected_to_io_id = '00000000-0000-0000-0006-000000000002' WHERE id = '00000000-0000-0000-0006-000000000006'; -- Web server to core
UPDATE ios SET connected_to_io_id = '00000000-0000-0000-0006-000000000003' WHERE id = '00000000-0000-0000-0006-000000000007'; -- DB server to core
UPDATE ios SET connected_to_io_id = '00000000-0000-0000-0006-000000000005' WHERE id = '00000000-0000-0000-0006-000000000009'; -- Bob's desktop to access switch

-- VLAN tagging for trunk ports
INSERT INTO io_tagged_networks (io_id, network_id) VALUES
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0004-000000000002'), -- Core switch trunk carries Production VLAN
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0004-000000000003'), -- Core switch trunk carries Guest VLAN
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0004-000000000004'), -- Core switch trunk carries Server VLAN
('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0004-000000000002'), -- Access switch trunk carries Production VLAN
('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0004-000000000003'); -- Access switch trunk carries Guest VLAN

-- IP Addresses
INSERT INTO ip_addresses (id, ip_address, ip_type, network_id, io_id, dns_name) VALUES
('00000000-0000-0000-0007-000000000001', '10.0.10.10', 'static', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0006-000000000001', 'core-sw01.techcorp.local'),
('00000000-0000-0000-0007-000000000002', '10.0.10.11', 'static', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0006-000000000004', 'access-sw02.techcorp.local'),
('00000000-0000-0000-0007-000000000003', '10.0.100.10', 'static', '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0006-000000000006', 'web01.techcorp.local'),
('00000000-0000-0000-0007-000000000004', '10.0.100.11', 'static', '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0006-000000000007', 'db01.techcorp.local'),
('00000000-0000-0000-0007-000000000005', '10.0.20.50', 'dhcp', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0006-000000000008', 'alice-laptop.techcorp.local'),
('00000000-0000-0000-0007-000000000006', '10.0.20.51', 'static', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0006-000000000009', 'bob-desktop.techcorp.local');

-- Groups
INSERT INTO groups (id, name, group_type, description) VALUES
('00000000-0000-0000-0008-000000000001', 'IT Department', 'custom', 'All IT staff members'),
('00000000-0000-0000-0008-000000000002', 'Network Admins', 'custom', 'Network administration team'),
('00000000-0000-0000-0008-000000000003', 'Help Desk', 'custom', 'Help desk support team');

-- Group Members
INSERT INTO group_members (group_id, person_id) VALUES
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0003-000000000001'),
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0003-000000000002'),
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0003-000000000003'),
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0003-000000000004'),
('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0003-000000000002'),
('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0003-000000000004');

-- Software Catalog
INSERT INTO software (id, name, publisher_id, category, software_type, license_model) VALUES
('00000000-0000-0000-0009-000000000001', 'Microsoft 365', '00000000-0000-0000-0000-000000000005', 'Productivity', 'application', 'subscription'),
('00000000-0000-0000-0009-000000000002', 'Windows 11 Pro', '00000000-0000-0000-0000-000000000005', 'Operating System', 'operating_system', 'perpetual'),
('00000000-0000-0000-0009-000000000003', 'Slack', NULL, 'Communication', 'application', 'subscription');

-- RBAC: Predefined Roles
INSERT INTO roles (id, name, description, is_system) VALUES
('00000000-0000-0000-000a-000000000001', 'Admin', 'Full system access with all permissions', true),
('00000000-0000-0000-000a-000000000002', 'Editor', 'Can view and edit all objects, but cannot delete or manage permissions', true),
('00000000-0000-0000-000a-000000000003', 'Viewer', 'Read-only access to all objects', true);

-- Permissions (object types × actions)
INSERT INTO permissions (object_type, action) VALUES
-- Companies
('companies', 'view'),
('companies', 'edit'),
('companies', 'delete'),
('companies', 'manage_permissions'),
-- Locations
('locations', 'view'),
('locations', 'edit'),
('locations', 'delete'),
('locations', 'manage_permissions'),
-- Rooms
('rooms', 'view'),
('rooms', 'edit'),
('rooms', 'delete'),
('rooms', 'manage_permissions'),
-- People
('people', 'view'),
('people', 'edit'),
('people', 'delete'),
('people', 'manage_permissions'),
-- Devices
('devices', 'view'),
('devices', 'edit'),
('devices', 'delete'),
('devices', 'manage_permissions'),
-- Networks
('networks', 'view'),
('networks', 'edit'),
('networks', 'delete'),
('networks', 'manage_permissions'),
-- Software
('software', 'view'),
('software', 'edit'),
('software', 'delete'),
('software', 'manage_permissions'),
-- SaaS Services
('saas_services', 'view'),
('saas_services', 'edit'),
('saas_services', 'delete'),
('saas_services', 'manage_permissions'),
-- Licenses
('software_licenses', 'view'),
('software_licenses', 'edit'),
('software_licenses', 'delete'),
('software_licenses', 'manage_permissions'),
-- Documents
('documents', 'view'),
('documents', 'edit'),
('documents', 'delete'),
('documents', 'manage_permissions'),
-- Contracts
('contracts', 'view'),
('contracts', 'edit'),
('contracts', 'delete'),
('contracts', 'manage_permissions');

-- Role Permissions: Admin gets all
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000001', id FROM permissions;

-- Role Permissions: Editor gets view and edit only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000002', id FROM permissions WHERE action IN ('view', 'edit');

-- Role Permissions: Viewer gets view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-000a-000000000003', id FROM permissions WHERE action = 'view';

-- Role Assignments: Make Alice an Admin
INSERT INTO role_assignments (role_id, person_id, scope) VALUES
('00000000-0000-0000-000a-000000000001', '00000000-0000-0000-0003-000000000001', 'global');

-- Role Assignments: Make Bob an Editor
INSERT INTO role_assignments (role_id, person_id, scope) VALUES
('00000000-0000-0000-000a-000000000002', '00000000-0000-0000-0003-000000000002', 'global');
