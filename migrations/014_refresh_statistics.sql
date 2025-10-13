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
ANALYZE installed_applications;
ANALYZE software_licenses;

-- ============================================================================
-- Group Management Tables
-- ============================================================================
ANALYZE groups;
ANALYZE group_members;
ANALYZE group_saas_services;
ANALYZE group_installed_applications;
ANALYZE group_software_licenses;

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
ANALYZE document_ios;
ANALYZE document_networks;
ANALYZE document_locations;
ANALYZE document_rooms;
ANALYZE document_saas_services;

-- ============================================================================
-- Assignment Junction Tables
-- ============================================================================
ANALYZE person_saas_services;
ANALYZE person_installed_applications;
ANALYZE person_software_licenses;

-- ============================================================================
-- Authentication & RBAC Tables
-- ============================================================================
ANALYZE users;
ANALYZE roles;
ANALYZE permissions;
ANALYZE role_assignments;
ANALYZE object_permissions;

-- ============================================================================
-- File Attachment Tables
-- ============================================================================
ANALYZE company_attachments;
ANALYZE contract_attachments;
ANALYZE device_attachments;
ANALYZE document_attachments;
ANALYZE location_attachments;
ANALYZE network_attachments;
ANALYZE person_attachments;
ANALYZE room_attachments;
ANALYZE saas_service_attachments;
ANALYZE software_attachments;

-- ============================================================================
-- System Tables
-- ============================================================================
ANALYZE system_settings;
ANALYZE admin_audit_log;

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
