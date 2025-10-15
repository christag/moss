-- IT Asset Management System - PostgreSQL Database Schema
-- Complete database structure for comprehensive IT infrastructure tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE INFRASTRUCTURE TABLES
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('own_organization', 'vendor', 'manufacturer', 'service_provider', 'partner', 'customer', 'other')),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100),
    account_number VARCHAR(100),
    support_url VARCHAR(255),
    support_phone VARCHAR(50),
    support_email VARCHAR(255),
    tax_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100),
    location_type VARCHAR(50) CHECK (location_type IN ('office', 'datacenter', 'colo', 'remote', 'warehouse', 'studio', 'broadcast_facility')),
    timezone VARCHAR(50),
    contact_phone VARCHAR(50),
    access_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    room_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    room_type VARCHAR(50) CHECK (room_type IN ('office', 'conference_room', 'server_room', 'closet', 'studio', 'control_room', 'edit_bay', 'storage', 'other')),
    floor VARCHAR(50),
    capacity INTEGER,
    access_requirements VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    username VARCHAR(100),
    employee_id VARCHAR(100),
    person_type VARCHAR(50) NOT NULL CHECK (person_type IN ('employee', 'contractor', 'vendor_contact', 'partner', 'customer', 'other')),
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    start_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    manager_id UUID REFERENCES people(id) ON DELETE SET NULL,
    preferred_contact_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES people(id) ON DELETE SET NULL,
    last_used_by_id UUID REFERENCES people(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    hostname VARCHAR(255),
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('computer', 'server', 'switch', 'router', 'firewall', 'printer', 'mobile', 'iot', 'appliance', 'av_equipment', 'broadcast_equipment', 'patch_panel', 'ups', 'pdu', 'chassis', 'module', 'blade')),
    serial_number VARCHAR(255),
    model VARCHAR(255),
    manufacturer VARCHAR(255),
    purchase_date DATE,
    warranty_expiration DATE,
    install_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'retired', 'repair', 'storage')),
    asset_tag VARCHAR(100),
    operating_system VARCHAR(100),
    os_version VARCHAR(100),
    last_audit_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    network_name VARCHAR(255) NOT NULL,
    network_address VARCHAR(50),
    vlan_id INTEGER,
    network_type VARCHAR(50) CHECK (network_type IN ('lan', 'wan', 'dmz', 'guest', 'management', 'storage', 'production', 'broadcast')),
    gateway VARCHAR(50),
    dns_servers TEXT,
    dhcp_enabled BOOLEAN DEFAULT false,
    dhcp_range_start VARCHAR(50),
    dhcp_range_end VARCHAR(50),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    native_network_id UUID REFERENCES networks(id) ON DELETE SET NULL,
    connected_to_io_id UUID REFERENCES ios(id) ON DELETE SET NULL,
    interface_name VARCHAR(255) NOT NULL,
    interface_type VARCHAR(50) NOT NULL CHECK (interface_type IN ('ethernet', 'wifi', 'virtual', 'fiber_optic', 'sdi', 'hdmi', 'xlr', 'usb', 'thunderbolt', 'displayport', 'coax', 'serial', 'patch_panel_port', 'power_input', 'power_output', 'other')),
    media_type VARCHAR(50) CHECK (media_type IN ('single_mode_fiber', 'multi_mode_fiber', 'cat5e', 'cat6', 'cat6a', 'coax', 'wireless', 'ac_power', 'dc_power', 'poe', 'other')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'monitoring', 'reserved')),
    speed VARCHAR(50),
    duplex VARCHAR(20) CHECK (duplex IN ('full', 'half', 'auto', 'n/a')),
    trunk_mode VARCHAR(20) CHECK (trunk_mode IN ('access', 'trunk', 'hybrid', 'n/a')),
    port_number VARCHAR(50),
    mac_address VARCHAR(17),
    voltage VARCHAR(20),
    amperage VARCHAR(20),
    wattage VARCHAR(20),
    power_connector_type VARCHAR(50),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE io_tagged_networks (
    io_id UUID REFERENCES ios(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (io_id, network_id)
);

CREATE TABLE ip_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    io_id UUID REFERENCES ios(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE SET NULL,
    ip_address VARCHAR(50) NOT NULL,
    ip_version VARCHAR(10) CHECK (ip_version IN ('v4', 'v6')),
    type VARCHAR(50) CHECK (type IN ('static', 'dhcp', 'reserved', 'floating')),
    dns_name VARCHAR(255),
    assignment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SOFTWARE & SERVICES TABLES
-- ============================================================================

CREATE TABLE software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    software_category VARCHAR(50) CHECK (software_category IN ('productivity', 'security', 'development', 'communication', 'infrastructure', 'collaboration', 'broadcast', 'media', 'other')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saas_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    business_owner_id UUID REFERENCES people(id) ON DELETE SET NULL,
    technical_contact_id UUID REFERENCES people(id) ON DELETE SET NULL,
    service_name VARCHAR(255) NOT NULL,
    service_url VARCHAR(255),
    account_id VARCHAR(255),
    environment VARCHAR(50) CHECK (environment IN ('production', 'staging', 'dev', 'sandbox')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'inactive', 'cancelled')),
    subscription_start DATE,
    subscription_end DATE,
    seat_count INTEGER,
    cost DECIMAL(10, 2),
    billing_frequency VARCHAR(50),
    criticality VARCHAR(20) CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
    sso_provider VARCHAR(50),
    sso_protocol VARCHAR(50),
    scim_enabled BOOLEAN DEFAULT false,
    provisioning_type VARCHAR(50),
    api_access_enabled BOOLEAN DEFAULT false,
    api_documentation_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saas_service_integrations (
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    integrated_service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, integrated_service_id)
);

CREATE TABLE installed_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE SET NULL,
    application_name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    install_method VARCHAR(50),
    deployment_platform VARCHAR(50),
    package_id VARCHAR(255),
    deployment_status VARCHAR(50) CHECK (deployment_status IN ('pilot', 'production', 'deprecated', 'retired')),
    install_date DATE,
    auto_update_enabled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE installed_application_devices (
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, device_id)
);

CREATE TABLE software_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE SET NULL,
    purchased_from_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    license_key TEXT,
    license_type VARCHAR(50) CHECK (license_type IN ('perpetual', 'subscription', 'free', 'volume', 'site', 'concurrent')),
    purchase_date DATE,
    expiration_date DATE,
    seat_count INTEGER,
    seats_used INTEGER,
    cost DECIMAL(10, 2),
    renewal_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE license_saas_services (
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (license_id, service_id)
);

CREATE TABLE license_installed_applications (
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    PRIMARY KEY (license_id, application_id)
);

CREATE TABLE license_people (
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (license_id, person_id)
);

-- ============================================================================
-- GROUPS & ACCESS TABLES
-- ============================================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255) NOT NULL,
    group_type VARCHAR(50) CHECK (group_type IN ('active_directory', 'okta', 'google_workspace', 'jamf_smart_group', 'intune', 'custom', 'distribution_list', 'security')),
    description TEXT,
    group_id_external VARCHAR(255),
    created_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, person_id)
);

CREATE TABLE group_saas_services (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, service_id)
);

CREATE TABLE group_installed_applications (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, application_id)
);

CREATE TABLE person_saas_services (
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, service_id)
);

-- ============================================================================
-- DOCUMENTATION & CONTRACTS TABLES
-- ============================================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    contract_name VARCHAR(255) NOT NULL,
    contract_number VARCHAR(100),
    contract_type VARCHAR(50) CHECK (contract_type IN ('support', 'license', 'service', 'lease', 'maintenance', 'consulting')),
    start_date DATE,
    end_date DATE,
    cost DECIMAL(10, 2),
    billing_frequency VARCHAR(50),
    auto_renew BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER,
    terms TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contract_software (
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    software_id UUID REFERENCES software(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, software_id)
);

CREATE TABLE contract_saas_services (
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, service_id)
);

CREATE TABLE contract_devices (
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, device_id)
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES people(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('policy', 'procedure', 'diagram', 'runbook', 'architecture', 'sop', 'network_diagram', 'rack_diagram', 'other')),
    content TEXT,
    version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_date DATE,
    updated_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_devices (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, device_id)
);

CREATE TABLE document_saas_services (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, service_id)
);

CREATE TABLE document_installed_applications (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, application_id)
);

CREATE TABLE document_networks (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, network_id)
);

CREATE TABLE document_locations (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, location_id)
);

CREATE TABLE document_rooms (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, room_id)
);

CREATE TABLE external_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('password_vault', 'ssl_certificate', 'domain_registrar', 'ticket', 'runbook', 'diagram', 'wiki_page', 'contract', 'invoice', 'other')),
    url TEXT,
    description TEXT,
    notes TEXT,
    created_date DATE,
    updated_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE external_document_devices (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, device_id)
);

CREATE TABLE external_document_installed_applications (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, application_id)
);

CREATE TABLE external_document_saas_services (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, service_id)
);

CREATE TABLE external_document_people (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, person_id)
);

CREATE TABLE external_document_companies (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, company_id)
);

CREATE TABLE external_document_networks (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, network_id)
);

CREATE TABLE external_document_rooms (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, room_id)
);

-- ============================================================================
-- RBAC TABLES
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) NOT NULL,
    object_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'edit', 'delete', 'manage_permissions')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    scope VARCHAR(50) CHECK (scope IN ('global', 'location', 'specific_objects')),
    assigned_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((person_id IS NOT NULL AND group_id IS NULL) OR (person_id IS NULL AND group_id IS NOT NULL))
);

CREATE TABLE role_assignment_locations (
    assignment_id UUID REFERENCES role_assignments(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, location_id)
);

CREATE TABLE object_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    object_type VARCHAR(50) NOT NULL,
    object_id UUID NOT NULL,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('view', 'edit', 'delete', 'manage_permissions')),
    granted_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((person_id IS NOT NULL AND group_id IS NULL) OR (person_id IS NULL AND group_id IS NOT NULL))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Companies
CREATE INDEX idx_companies_type ON companies(company_type);
CREATE INDEX idx_companies_name ON companies(company_name);

-- Locations
CREATE INDEX idx_locations_company ON locations(company_id);
CREATE INDEX idx_locations_type ON locations(location_type);

-- Rooms
CREATE INDEX idx_rooms_location ON rooms(location_id);
CREATE INDEX idx_rooms_type ON rooms(room_type);

-- People
CREATE INDEX idx_people_company ON people(company_id);
CREATE INDEX idx_people_location ON people(location_id);
CREATE INDEX idx_people_type ON people(person_type);
CREATE INDEX idx_people_status ON people(status);
CREATE INDEX idx_people_email ON people(email);

-- Devices
CREATE INDEX idx_devices_parent ON devices(parent_device_id);
CREATE INDEX idx_devices_assigned_to ON devices(assigned_to_id);
CREATE INDEX idx_devices_location ON devices(location_id);
CREATE INDEX idx_devices_room ON devices(room_id);
CREATE INDEX idx_devices_type ON devices(device_type);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_serial ON devices(serial_number);

-- IOs
CREATE INDEX idx_ios_device ON ios(device_id);
CREATE INDEX idx_ios_room ON ios(room_id);
CREATE INDEX idx_ios_network ON ios(native_network_id);
CREATE INDEX idx_ios_connected_to ON ios(connected_to_io_id);
CREATE INDEX idx_ios_type ON ios(interface_type);
CREATE INDEX idx_ios_mac ON ios(mac_address);

-- Networks
CREATE INDEX idx_networks_location ON networks(location_id);
CREATE INDEX idx_networks_vlan ON networks(vlan_id);

-- IP Addresses
CREATE INDEX idx_ip_addresses_io ON ip_addresses(io_id);
CREATE INDEX idx_ip_addresses_network ON ip_addresses(network_id);
CREATE INDEX idx_ip_addresses_address ON ip_addresses(ip_address);

-- Software
CREATE INDEX idx_software_company ON software(company_id);
CREATE INDEX idx_software_category ON software(software_category);

-- SaaS Services
CREATE INDEX idx_saas_software ON saas_services(software_id);
CREATE INDEX idx_saas_company ON saas_services(company_id);
CREATE INDEX idx_saas_status ON saas_services(status);
CREATE INDEX idx_saas_owner ON saas_services(business_owner_id);

-- Installed Applications
CREATE INDEX idx_installed_apps_software ON installed_applications(software_id);
CREATE INDEX idx_installed_apps_status ON installed_applications(deployment_status);

-- Licenses
CREATE INDEX idx_licenses_software ON software_licenses(software_id);
CREATE INDEX idx_licenses_company ON software_licenses(purchased_from_id);
CREATE INDEX idx_licenses_expiration ON software_licenses(expiration_date);

-- Groups
CREATE INDEX idx_groups_type ON groups(group_type);

-- Contracts
CREATE INDEX idx_contracts_company ON contracts(company_id);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- Documents
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- External Documents
CREATE INDEX idx_external_docs_type ON external_documents(document_type);

-- RBAC
CREATE INDEX idx_role_assignments_role ON role_assignments(role_id);
CREATE INDEX idx_role_assignments_person ON role_assignments(person_id);
CREATE INDEX idx_role_assignments_group ON role_assignments(group_id);
CREATE INDEX idx_object_permissions_object ON object_permissions(object_type, object_id);
CREATE INDEX idx_object_permissions_person ON object_permissions(person_id);
CREATE INDEX idx_object_permissions_group ON object_permissions(group_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ios_updated_at BEFORE UPDATE ON ios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON ip_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_software_updated_at BEFORE UPDATE ON software FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_services_updated_at BEFORE UPDATE ON saas_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installed_applications_updated_at BEFORE UPDATE ON installed_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_software_licenses_updated_at BEFORE UPDATE ON software_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_documents_updated_at BEFORE UPDATE ON external_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_assignments_updated_at BEFORE UPDATE ON role_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_object_permissions_updated_at BEFORE UPDATE ON object_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

