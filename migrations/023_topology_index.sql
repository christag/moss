-- Migration: Add index for network topology queries
-- Version: 023
-- Description: Creates index on ios.connected_to_io_id to optimize topology graph queries

-- Index for connected_to_io_id to speed up topology relationship queries
CREATE INDEX IF NOT EXISTS idx_ios_connected_to_io_id
ON ios (connected_to_io_id)
WHERE connected_to_io_id IS NOT NULL;

-- Index for native_network_id to support VLAN filtering in topology
CREATE INDEX IF NOT EXISTS idx_ios_native_network_id
ON ios (native_network_id)
WHERE native_network_id IS NOT NULL;

-- Composite index for device topology queries with network filtering
CREATE INDEX IF NOT EXISTS idx_ios_device_network
ON ios (device_id, native_network_id, connected_to_io_id)
WHERE connected_to_io_id IS NOT NULL;
