-- Migration 001: Initial Schema
-- This migration creates the complete M.O.S.S. database schema
-- Source: dbsetup.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) CHECK (company_type IN ('own_organization', 'vendor', 'manufacturer', 'partner')),
    website VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    room_type VARCHAR(50) CHECK (room_type IN ('server_room', 'office', 'conference_room', 'storage', 'studio', 'control_room', 'other')),
    floor VARCHAR(50),
    capacity INTEGER,
    access_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People table
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    person_type VARCHAR(50) CHECK (person_type IN ('employee', 'contractor', 'vendor_contact', 'other')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    employee_id VARCHAR(100),
    job_title VARCHAR(255),
    department VARCHAR(255),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES people(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    asset_tag VARCHAR(100),
    purchase_date DATE,
    warranty_expiration DATE,
    install_date DATE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES people(id) ON DELETE SET NULL,
    parent_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    os_name VARCHAR(100),
    os_version VARCHAR(100),
    cpu VARCHAR(255),
    ram_gb INTEGER,
    storage_gb INTEGER,
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    hostname VARCHAR(255),
    power_draw_watts INTEGER,
    voltage INTEGER,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Networks table
CREATE TABLE networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vlan_id INTEGER,
    network_address VARCHAR(50),
    network_type VARCHAR(50) CHECK (network_type IN ('management', 'production', 'guest', 'iot', 'storage', 'backup', 'other')),
    gateway VARCHAR(45),
    dns_primary VARCHAR(45),
    dns_secondary VARCHAR(45),
    dhcp_enabled BOOLEAN DEFAULT false,
    dhcp_range_start VARCHAR(45),
    dhcp_range_end VARCHAR(45),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IOs (Interfaces/Ports) table
CREATE TABLE ios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    interface_name VARCHAR(100) NOT NULL,
    interface_type VARCHAR(50) CHECK (interface_type IN ('network_ethernet', 'network_fiber', 'network_wifi', 'broadcast_sdi', 'broadcast_hdmi', 'broadcast_xlr', 'broadcast_coax', 'power_input', 'power_output', 'infrastructure_patch', 'data_usb', 'data_thunderbolt', 'other')),
    speed VARCHAR(50),
    duplex VARCHAR(20),
    mac_address VARCHAR(17),
    trunk_mode VARCHAR(20) CHECK (trunk_mode IN ('access', 'trunk', 'hybrid', 'n/a')),
    native_network_id UUID REFERENCES networks(id) ON DELETE SET NULL,
    connected_to_io_id UUID REFERENCES ios(id) ON DELETE SET NULL,
    voltage INTEGER,
    amperage DECIMAL(6,2),
    wattage INTEGER,
    connector_type VARCHAR(100),
    media_type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IO Tagged Networks junction table
CREATE TABLE io_tagged_networks (
    io_id UUID REFERENCES ios(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (io_id, network_id)
);

-- IP Addresses table
CREATE TABLE ip_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL,
    ip_type VARCHAR(50) CHECK (ip_type IN ('static', 'dhcp', 'reserved', 'floating')),
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    io_id UUID REFERENCES ios(id) ON DELETE SET NULL,
    dns_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, network_id)
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    group_type VARCHAR(50) CHECK (group_type IN ('active_directory', 'okta', 'jamf_smart', 'custom', 'other')),
    source_system VARCHAR(100),
    external_id VARCHAR(255),
    description TEXT,
    sync_enabled BOOLEAN DEFAULT false,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members junction table
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, person_id)
);

-- Software table
CREATE TABLE software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    publisher_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    category VARCHAR(100),
    software_type VARCHAR(50) CHECK (software_type IN ('application', 'operating_system', 'utility', 'driver', 'other')),
    license_model VARCHAR(50) CHECK (license_model IN ('perpetual', 'subscription', 'freemium', 'open_source', 'other')),
    version VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SaaS Services table
CREATE TABLE saas_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    software_id UUID REFERENCES software(id) ON DELETE SET NULL,
    environment VARCHAR(50) CHECK (environment IN ('production', 'staging', 'development', 'testing', 'other')),
    service_url VARCHAR(500),
    admin_url VARCHAR(500),
    sso_provider VARCHAR(100),
    sso_protocol VARCHAR(50),
    scim_enabled BOOLEAN DEFAULT false,
    business_owner_id UUID REFERENCES people(id) ON DELETE SET NULL,
    technical_contact_id UUID REFERENCES people(id) ON DELETE SET NULL,
    user_count INTEGER,
    cost DECIMAL(10, 2),
    billing_frequency VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SaaS Service Integrations junction table
CREATE TABLE saas_service_integrations (
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    integrated_service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) CHECK (integration_type IN ('sso_provider', 'data_sync', 'webhook', 'api', 'other')),
    description TEXT,
    PRIMARY KEY (service_id, integrated_service_id)
);

-- Person SaaS Services junction table
CREATE TABLE person_saas_services (
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    access_level VARCHAR(50),
    PRIMARY KEY (person_id, service_id)
);

-- Group SaaS Services junction table
CREATE TABLE group_saas_services (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    access_level VARCHAR(50),
    PRIMARY KEY (group_id, service_id)
);

-- Installed Applications table
CREATE TABLE installed_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE CASCADE,
    version VARCHAR(100),
    deployment_method VARCHAR(50) CHECK (deployment_method IN ('mdm', 'gpo', 'manual', 'self_service', 'other')),
    install_path VARCHAR(500),
    package_id VARCHAR(255),
    auto_update BOOLEAN DEFAULT false,
    license_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Installed Applications junction table
CREATE TABLE device_installed_applications (
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    install_date DATE,
    PRIMARY KEY (device_id, application_id)
);

-- Group Installed Applications junction table
CREATE TABLE group_installed_applications (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    application_id UUID REFERENCES installed_applications(id) ON DELETE CASCADE,
    deployment_date DATE,
    PRIMARY KEY (group_id, application_id)
);

-- Software Licenses table
CREATE TABLE software_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID REFERENCES software(id) ON DELETE CASCADE,
    license_type VARCHAR(50) CHECK (license_type IN ('per_user', 'per_device', 'site', 'concurrent', 'other')),
    seat_count INTEGER,
    seats_used INTEGER DEFAULT 0,
    license_key TEXT,
    activation_code TEXT,
    purchase_date DATE,
    expiration_date DATE,
    cost DECIMAL(10, 2),
    billing_frequency VARCHAR(50),
    vendor_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    contract_id UUID,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Person Software Licenses junction table
CREATE TABLE person_software_licenses (
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    seat_count INTEGER DEFAULT 1,
    assigned_date DATE,
    PRIMARY KEY (person_id, license_id)
);

-- Group Software Licenses junction table
CREATE TABLE group_software_licenses (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    seat_count INTEGER,
    assigned_date DATE,
    PRIMARY KEY (group_id, license_id)
);

-- Service Software Licenses junction table
CREATE TABLE service_software_licenses (
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
    seat_count INTEGER,
    assigned_date DATE,
    PRIMARY KEY (service_id, license_id)
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    document_type VARCHAR(50) CHECK (document_type IN ('policy', 'procedure', 'runbook', 'diagram', 'sop', 'other')),
    author_id UUID REFERENCES people(id) ON DELETE SET NULL,
    version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document junction tables
CREATE TABLE document_devices (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, device_id)
);

CREATE TABLE document_networks (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, network_id)
);

CREATE TABLE document_saas_services (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, service_id)
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

-- External Documents table
CREATE TABLE external_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    external_document_type VARCHAR(50) CHECK (external_document_type IN ('password_vault', 'ticket_system', 'wiki', 'confluence', 'sharepoint', 'other')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External Document junction tables
CREATE TABLE external_document_devices (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, device_id)
);

CREATE TABLE external_document_networks (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, network_id)
);

CREATE TABLE external_document_saas_services (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    service_id UUID REFERENCES saas_services(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, service_id)
);

CREATE TABLE external_document_locations (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, location_id)
);

CREATE TABLE external_document_rooms (
    external_document_id UUID REFERENCES external_documents(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (external_document_id, room_id)
);

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    contract_number VARCHAR(100),
    start_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    renewal_notice_period_days INTEGER,
    cost DECIMAL(10, 2),
    billing_frequency VARCHAR(50),
    description TEXT,
    terms TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update foreign keys
ALTER TABLE software_licenses ADD CONSTRAINT fk_contract
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

ALTER TABLE installed_applications ADD CONSTRAINT fk_license
    FOREIGN KEY (license_id) REFERENCES software_licenses(id) ON DELETE SET NULL;

-- RBAC tables
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_type VARCHAR(100) NOT NULL,
    action VARCHAR(50) CHECK (action IN ('view', 'edit', 'delete', 'manage_permissions')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(object_type, action)
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    scope VARCHAR(50) CHECK (scope IN ('global', 'location', 'object')),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((person_id IS NOT NULL AND group_id IS NULL) OR (person_id IS NULL AND group_id IS NOT NULL))
);

CREATE TABLE object_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_type VARCHAR(100) NOT NULL,
    object_id UUID NOT NULL,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    permission VARCHAR(50) CHECK (permission IN ('view', 'edit', 'delete', 'manage_permissions')),
    granted BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((person_id IS NOT NULL AND group_id IS NULL) OR (person_id IS NULL AND group_id IS NOT NULL))
);

-- Create indexes
CREATE INDEX idx_locations_company ON locations(company_id);
CREATE INDEX idx_rooms_location ON rooms(location_id);
CREATE INDEX idx_people_company ON people(company_id);
CREATE INDEX idx_people_location ON people(location_id);
CREATE INDEX idx_people_manager ON people(manager_id);
CREATE INDEX idx_devices_location ON devices(location_id);
CREATE INDEX idx_devices_assigned ON devices(assigned_to);
CREATE INDEX idx_devices_parent ON devices(parent_device_id);
CREATE INDEX idx_ios_device ON ios(device_id);
CREATE INDEX idx_ios_connected ON ios(connected_to_io_id);
CREATE INDEX idx_ios_network ON ios(native_network_id);
CREATE INDEX idx_ip_network ON ip_addresses(network_id);
CREATE INDEX idx_ip_io ON ip_addresses(io_id);
CREATE INDEX idx_software_publisher ON software(publisher_id);
CREATE INDEX idx_saas_software ON saas_services(software_id);
CREATE INDEX idx_installed_software ON installed_applications(software_id);
CREATE INDEX idx_licenses_software ON software_licenses(software_id);
CREATE INDEX idx_licenses_vendor ON software_licenses(vendor_id);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_role_assignments_person ON role_assignments(person_id);
CREATE INDEX idx_role_assignments_group ON role_assignments(group_id);
CREATE INDEX idx_role_assignments_location ON role_assignments(location_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers to all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ios_updated_at BEFORE UPDATE ON ios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON ip_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_software_updated_at BEFORE UPDATE ON software FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_services_updated_at BEFORE UPDATE ON saas_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installed_applications_updated_at BEFORE UPDATE ON installed_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_software_licenses_updated_at BEFORE UPDATE ON software_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_documents_updated_at BEFORE UPDATE ON external_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
