/**
 * Migration 014: Refresh Database Statistics
 *
 * Purpose: Update PostgreSQL query planner statistics for optimal performance
 * Defect: DEF-ROUND2-MASTER-011
 * Date: 2025-10-12
 *
 * ANALYZE collects statistics about table contents for the query planner
 * This should be run periodically, especially after:
 * - Large data imports
 * - Bulk updates/deletes
 * - Adding new indexes
 * - Significant data changes
 */

-- ============================================================================
-- Core Infrastructure Tables
-- ============================================================================
ANALYZE companies;
ANALYZE locations;
ANALYZE rooms;
ANALYZE people;
ANALYZE devices;
ANALYZE networks;
ANALYZE ios;
ANALYZE io_tagged_networks;
ANALYZE ip_addresses;

-- ============================================================================
-- Software & Services Tables
-- ============================================================================
ANALYZE software;
ANALYZE saas_services;
ANALYZE saas_service_integrations;
ANALYZE installed_applications;
ANALYZE software_licenses;

-- ============================================================================
-- Group Management Tables
-- ============================================================================
ANALYZE groups;
ANALYZE group_members;
ANALYZE group_saas_services;
ANALYZE group_installed_applications;
-- ANALYZE group_software_licenses; -- Table does not exist

-- ============================================================================
-- Documentation Tables
-- ============================================================================
ANALYZE documents;
ANALYZE external_documents;
ANALYZE contracts;

-- ============================================================================
-- Document Association Tables
-- ============================================================================
ANALYZE document_devices;
-- ANALYZE document_ios; -- Table does not exist
ANALYZE document_networks;
ANALYZE document_locations;
ANALYZE document_rooms;
ANALYZE document_saas_services;
ANALYZE document_installed_applications;
ANALYZE external_document_devices;
ANALYZE external_document_networks;
ANALYZE external_document_people;
ANALYZE external_document_rooms;
ANALYZE external_document_saas_services;
ANALYZE external_document_companies;
ANALYZE external_document_installed_applications;
ANALYZE contract_devices;
ANALYZE contract_software;
ANALYZE contract_saas_services;

-- ============================================================================
-- Assignment Junction Tables
-- ============================================================================
ANALYZE person_saas_services;
-- ANALYZE person_installed_applications; -- Table does not exist
-- ANALYZE person_software_licenses; -- Table does not exist
ANALYZE license_saas_services;
ANALYZE license_installed_applications;
ANALYZE license_people;
ANALYZE installed_application_devices;

-- ============================================================================
-- Authentication & RBAC Tables
-- ============================================================================
ANALYZE users;
ANALYZE sessions;
ANALYZE verification_tokens;
ANALYZE roles;
ANALYZE permissions;
ANALYZE role_permissions;
ANALYZE role_assignments;
ANALYZE role_assignment_locations;
ANALYZE object_permissions;

-- ============================================================================
-- File Attachment Tables (Not yet implemented)
-- ============================================================================
-- ANALYZE company_attachments; -- Table does not exist
-- ANALYZE contract_attachments; -- Table does not exist
-- ANALYZE device_attachments; -- Table does not exist
-- ANALYZE document_attachments; -- Table does not exist
-- ANALYZE location_attachments; -- Table does not exist
-- ANALYZE network_attachments; -- Table does not exist
-- ANALYZE person_attachments; -- Table does not exist
-- ANALYZE room_attachments; -- Table does not exist
-- ANALYZE saas_service_attachments; -- Table does not exist
-- ANALYZE software_attachments; -- Table does not exist

-- ============================================================================
-- System Tables
-- ============================================================================
ANALYZE system_settings;
ANALYZE integrations;
ANALYZE integration_sync_logs;
ANALYZE custom_fields;
-- ANALYZE admin_audit_log; -- Table does not exist

-- ============================================================================
-- Summary Report
-- ============================================================================
DO $$
DECLARE
  table_count INTEGER;
  total_rows BIGINT;
BEGIN
  -- Count total tables analyzed
  SELECT COUNT(*)
  INTO table_count
  FROM pg_stat_user_tables;

  -- Sum total rows across all tables
  SELECT SUM(n_live_tup)
  INTO total_rows
  FROM pg_stat_user_tables;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 014: Database Statistics Refresh';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total tables analyzed: %', table_count;
  RAISE NOTICE 'Total rows across all tables: %', total_rows;
  RAISE NOTICE 'Statistics updated: %', CURRENT_TIMESTAMP;
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Query planner will now use updated statistics.';
  RAISE NOTICE 'Run EXPLAIN ANALYZE on slow queries to verify improvements.';
END $$;
