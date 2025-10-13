/**
 * Migration 013: Add Composite Indexes for Complex JOINs
 *
 * Purpose: Optimize performance for common multi-column queries and JOINs
 * Defect: DEF-ROUND2-MASTER-007
 * Date: 2025-10-12
 *
 * Composite indexes help when queries filter on multiple columns simultaneously
 * or when joining tables on multiple conditions.
 */

-- ============================================================================
-- IP Address Management - Common JOIN patterns
-- ============================================================================

-- IP addresses often queried by network + type for subnet visualization
CREATE INDEX IF NOT EXISTS idx_ip_addresses_network_type
ON ip_addresses(network_id, type)
WHERE network_id IS NOT NULL;

-- IP addresses often queried by io_id + type for device connectivity
CREATE INDEX IF NOT EXISTS idx_ip_addresses_io_type
ON ip_addresses(io_id, type)
WHERE io_id IS NOT NULL;

-- ============================================================================
-- Device Management - Common query patterns
-- ============================================================================

-- Devices often filtered by location + status
CREATE INDEX IF NOT EXISTS idx_devices_location_status
ON devices(location_id, status)
WHERE location_id IS NOT NULL;

-- Devices often filtered by room + status
CREATE INDEX IF NOT EXISTS idx_devices_room_status
ON devices(room_id, status)
WHERE room_id IS NOT NULL;

-- Devices often queried by assigned_to + status for user equipment lists
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to_status
ON devices(assigned_to_id, status)
WHERE assigned_to_id IS NOT NULL;

-- Devices often filtered by type + manufacturer
CREATE INDEX IF NOT EXISTS idx_devices_type_manufacturer
ON devices(device_type, manufacturer);

-- ============================================================================
-- Network Interface (IO) Management - Common patterns
-- ============================================================================

-- IOs often queried by device + interface_type
CREATE INDEX IF NOT EXISTS idx_ios_device_type
ON ios(device_id, interface_type)
WHERE device_id IS NOT NULL;

-- IOs often queried by device + status for active ports
CREATE INDEX IF NOT EXISTS idx_ios_device_status
ON ios(device_id, status)
WHERE device_id IS NOT NULL;

-- IOs often queried by network + trunk_mode for VLAN config
CREATE INDEX IF NOT EXISTS idx_ios_network_trunk
ON ios(native_network_id, trunk_mode)
WHERE native_network_id IS NOT NULL;

-- ============================================================================
-- People Management - Common query patterns
-- ============================================================================

-- People often filtered by company + person_type
CREATE INDEX IF NOT EXISTS idx_people_company_type
ON people(company_id, person_type)
WHERE company_id IS NOT NULL;

-- People often filtered by location + status
CREATE INDEX IF NOT EXISTS idx_people_location_status
ON people(location_id, status)
WHERE location_id IS NOT NULL;

-- ============================================================================
-- Software License Management - Common patterns
-- ============================================================================

-- Licenses often queried by software + expiration for renewal tracking
CREATE INDEX IF NOT EXISTS idx_licenses_software_expiration
ON software_licenses(software_id, expiration_date)
WHERE software_id IS NOT NULL AND expiration_date IS NOT NULL;

-- Licenses often queried by vendor + expiration for vendor management
CREATE INDEX IF NOT EXISTS idx_licenses_vendor_expiration
ON software_licenses(vendor_id, expiration_date)
WHERE vendor_id IS NOT NULL AND expiration_date IS NOT NULL;

-- ============================================================================
-- Document Associations - Junction table optimization
-- ============================================================================

-- Document associations often queried by object + document
CREATE INDEX IF NOT EXISTS idx_document_devices_device_doc
ON document_devices(device_id, document_id);

CREATE INDEX IF NOT EXISTS idx_document_networks_network_doc
ON document_networks(network_id, document_id);

CREATE INDEX IF NOT EXISTS idx_document_locations_location_doc
ON document_locations(location_id, document_id);

-- ============================================================================
-- Role Assignments - RBAC query optimization
-- ============================================================================

-- Role assignments often queried by person + scope_type
CREATE INDEX IF NOT EXISTS idx_role_assignments_person_scope
ON role_assignments(person_id, scope_type)
WHERE person_id IS NOT NULL;

-- Role assignments often queried by group + scope_type
CREATE INDEX IF NOT EXISTS idx_role_assignments_group_scope
ON role_assignments(group_id, scope_type)
WHERE group_id IS NOT NULL;

-- ============================================================================
-- Update Statistics
-- ============================================================================

-- Refresh table statistics for query planner
ANALYZE ip_addresses;
ANALYZE devices;
ANALYZE ios;
ANALYZE people;
ANALYZE software_licenses;
ANALYZE document_devices;
ANALYZE document_networks;
ANALYZE document_locations;
ANALYZE role_assignments;

-- Log completion
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Count new indexes created
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE 'idx_%_status'
     OR indexname LIKE 'idx_%_type'
     OR indexname LIKE 'idx_%_expiration'
     OR indexname LIKE 'idx_%_scope';

  RAISE NOTICE 'Migration 013 complete: Added composite indexes for performance optimization';
  RAISE NOTICE 'Total composite indexes: %', index_count;
END $$;
