-- Migration 004: Add Performance Indexes
-- This migration adds additional indexes to optimize common query patterns
-- Run with: psql -U moss -d moss -f migrations/004_add_performance_indexes.sql

BEGIN;

-- ============================================================================
-- TIMESTAMP INDEXES
-- Optimize sorting by created_at and updated_at (common in list views)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_updated_at ON locations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_people_created_at ON people(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_people_updated_at ON people(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_updated_at ON devices(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_networks_created_at ON networks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_networks_updated_at ON networks(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_software_created_at ON software(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_software_updated_at ON software(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saas_services_created_at ON saas_services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_services_updated_at ON saas_services(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON software_licenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_licenses_updated_at ON software_licenses(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_updated_at ON contracts(updated_at DESC);

-- ============================================================================
-- NAME/SEARCH FIELD INDEXES
-- Optimize text searches and sorting by name fields
-- ============================================================================

-- Devices: hostname is frequently searched and sorted
CREATE INDEX IF NOT EXISTS idx_devices_hostname ON devices(hostname);
CREATE INDEX IF NOT EXISTS idx_devices_hostname_lower ON devices(LOWER(hostname));

-- People: full_name is frequently searched and sorted
CREATE INDEX IF NOT EXISTS idx_people_full_name ON people(full_name);
CREATE INDEX IF NOT EXISTS idx_people_full_name_lower ON people(LOWER(full_name));

-- Locations: location_name searching and sorting
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(location_name);
CREATE INDEX IF NOT EXISTS idx_locations_name_lower ON locations(LOWER(location_name));

-- Networks: network_name searching and sorting
CREATE INDEX IF NOT EXISTS idx_networks_name ON networks(network_name);
CREATE INDEX IF NOT EXISTS idx_networks_name_lower ON networks(LOWER(network_name));

-- Software: product_name searching and sorting
CREATE INDEX IF NOT EXISTS idx_software_product_name ON software(product_name);
CREATE INDEX IF NOT EXISTS idx_software_product_name_lower ON software(LOWER(product_name));

-- SaaS Services: service_name searching and sorting
CREATE INDEX IF NOT EXISTS idx_saas_service_name ON saas_services(service_name);
CREATE INDEX IF NOT EXISTS idx_saas_service_name_lower ON saas_services(LOWER(service_name));

-- Groups: group_name searching and sorting
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(group_name);
CREATE INDEX IF NOT EXISTS idx_groups_name_lower ON groups(LOWER(group_name));

-- Documents: title searching and sorting
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_title_lower ON documents(LOWER(title));

-- Rooms: room_name searching
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(room_name);

-- Contracts: contract_name searching
CREATE INDEX IF NOT EXISTS idx_contracts_name ON contracts(contract_name);

-- ============================================================================
-- DATE RANGE INDEXES
-- Optimize dashboard and expiration queries
-- ============================================================================

-- Devices: warranty expiration queries (dashboard widget)
CREATE INDEX IF NOT EXISTS idx_devices_warranty_exp ON devices(warranty_expiration) WHERE warranty_expiration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devices_warranty_active ON devices(warranty_expiration, status) WHERE status = 'active' AND warranty_expiration IS NOT NULL;

-- Devices: purchase date for reporting
CREATE INDEX IF NOT EXISTS idx_devices_purchase_date ON devices(purchase_date) WHERE purchase_date IS NOT NULL;

-- Software Licenses: expiration date queries (dashboard widget)
CREATE INDEX IF NOT EXISTS idx_licenses_expiration_active ON software_licenses(expiration_date) WHERE expiration_date IS NOT NULL;

-- Contracts: end date queries (dashboard widget)
CREATE INDEX IF NOT EXISTS idx_contracts_end_date_active ON contracts(end_date) WHERE end_date IS NOT NULL;

-- People: start date for tenure reporting
CREATE INDEX IF NOT EXISTS idx_people_start_date ON people(start_date) WHERE start_date IS NOT NULL;

-- ============================================================================
-- COMPOSITE INDEXES
-- Optimize common multi-column filter and sort combinations
-- ============================================================================

-- Devices: Common filters (status + type) with hostname sort
CREATE INDEX IF NOT EXISTS idx_devices_status_type_hostname ON devices(status, device_type, hostname);

-- Devices: Location-based queries with status
CREATE INDEX IF NOT EXISTS idx_devices_location_status ON devices(location_id, status) WHERE location_id IS NOT NULL;

-- Devices: Room-based queries with status
CREATE INDEX IF NOT EXISTS idx_devices_room_status ON devices(room_id, status) WHERE room_id IS NOT NULL;

-- People: Active users by type
CREATE INDEX IF NOT EXISTS idx_people_status_type ON people(status, person_type);

-- People: Company-based active users
CREATE INDEX IF NOT EXISTS idx_people_company_status ON people(company_id, status) WHERE company_id IS NOT NULL;

-- IOs: Device interfaces by type
CREATE INDEX IF NOT EXISTS idx_ios_device_type ON ios(device_id, interface_type);

-- Networks: Location networks by VLAN
CREATE INDEX IF NOT EXISTS idx_networks_location_vlan ON networks(location_id, vlan_id) WHERE location_id IS NOT NULL;

-- SaaS Services: Active services by software
CREATE INDEX IF NOT EXISTS idx_saas_software_status ON saas_services(software_id, status);

-- Software Licenses: Available seats tracking
CREATE INDEX IF NOT EXISTS idx_licenses_seats ON software_licenses(software_id, seat_count, seats_used) WHERE seat_count IS NOT NULL;

-- ============================================================================
-- JUNCTION TABLE INDEXES
-- Optimize many-to-many relationship queries
-- ============================================================================

-- Group membership lookups (both directions)
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_person ON group_members(person_id);

-- Device-document relationships
CREATE INDEX IF NOT EXISTS idx_document_devices_document ON document_devices(document_id);
CREATE INDEX IF NOT EXISTS idx_document_devices_device ON document_devices(device_id);

-- Network-document relationships
CREATE INDEX IF NOT EXISTS idx_document_networks_document ON document_networks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_networks_network ON document_networks(network_id);

-- Service-document relationships
CREATE INDEX IF NOT EXISTS idx_document_services_document ON document_saas_services(document_id);
CREATE INDEX IF NOT EXISTS idx_document_services_service ON document_saas_services(service_id);

-- Location-document relationships
CREATE INDEX IF NOT EXISTS idx_document_locations_document ON document_locations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_locations_location ON document_locations(location_id);

-- Room-document relationships
CREATE INDEX IF NOT EXISTS idx_document_rooms_document ON document_rooms(document_id);
CREATE INDEX IF NOT EXISTS idx_document_rooms_room ON document_rooms(room_id);

-- IO tagged networks (VLAN trunk configuration)
CREATE INDEX IF NOT EXISTS idx_io_tagged_networks_io ON io_tagged_networks(io_id);
CREATE INDEX IF NOT EXISTS idx_io_tagged_networks_network ON io_tagged_networks(network_id);

-- License assignments
CREATE INDEX IF NOT EXISTS idx_license_people_license ON license_people(license_id);
CREATE INDEX IF NOT EXISTS idx_license_people_person ON license_people(person_id);

CREATE INDEX IF NOT EXISTS idx_license_saas_services_license ON license_saas_services(license_id);
CREATE INDEX IF NOT EXISTS idx_license_saas_services_service ON license_saas_services(service_id);

CREATE INDEX IF NOT EXISTS idx_license_installed_apps_license ON license_installed_applications(license_id);
CREATE INDEX IF NOT EXISTS idx_license_installed_apps_app ON license_installed_applications(application_id);

-- Group-based access
CREATE INDEX IF NOT EXISTS idx_group_services_group ON group_saas_services(group_id);
CREATE INDEX IF NOT EXISTS idx_group_services_service ON group_saas_services(service_id);

CREATE INDEX IF NOT EXISTS idx_group_applications_group ON group_installed_applications(group_id);
CREATE INDEX IF NOT EXISTS idx_group_applications_app ON group_installed_applications(application_id);

CREATE INDEX IF NOT EXISTS idx_person_services_person ON person_saas_services(person_id);
CREATE INDEX IF NOT EXISTS idx_person_services_service ON person_saas_services(service_id);

-- Device-application deployments
CREATE INDEX IF NOT EXISTS idx_installed_app_devices_device ON installed_application_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_installed_app_devices_app ON installed_application_devices(application_id);

-- Contract relationships
CREATE INDEX IF NOT EXISTS idx_contract_software_contract ON contract_software(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_software_software ON contract_software(software_id);

CREATE INDEX IF NOT EXISTS idx_contract_saas_services_contract ON contract_saas_services(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_saas_services_service ON contract_saas_services(service_id);

CREATE INDEX IF NOT EXISTS idx_contract_devices_contract ON contract_devices(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_devices_device ON contract_devices(device_id);

-- Service integrations (SSO, provisioning)
CREATE INDEX IF NOT EXISTS idx_saas_integrations_service ON saas_service_integrations(service_id);
CREATE INDEX IF NOT EXISTS idx_saas_integrations_integrated ON saas_service_integrations(integrated_service_id);

-- ============================================================================
-- FULL TEXT SEARCH INDEXES (PostgreSQL GIN indexes for text search)
-- ============================================================================

-- Enable pg_trgm extension for similarity searches (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Devices: Full text search on hostname, model, manufacturer
CREATE INDEX IF NOT EXISTS idx_devices_hostname_trgm ON devices USING GIN (hostname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_model_trgm ON devices USING GIN (model gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_manufacturer_trgm ON devices USING GIN (manufacturer gin_trgm_ops);

-- People: Full text search on full_name, email
CREATE INDEX IF NOT EXISTS idx_people_name_trgm ON people USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_people_email_trgm ON people USING GIN (email gin_trgm_ops);

-- Locations: Full text search on location_name, city
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm ON locations USING GIN (location_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_city_trgm ON locations USING GIN (city gin_trgm_ops);

-- Software: Full text search on product_name
CREATE INDEX IF NOT EXISTS idx_software_name_trgm ON software USING GIN (product_name gin_trgm_ops);

-- Documents: Full text search on title and content
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_content_trgm ON documents USING GIN (content gin_trgm_ops);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify indexes were created successfully
-- ============================================================================

-- View all indexes on a specific table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'devices' ORDER BY indexname;

-- View index sizes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC
-- LIMIT 20;

-- Check if indexes are being used
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC
-- LIMIT 20;
