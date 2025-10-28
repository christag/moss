-- Migration: 026_custom_reports.sql
-- Add custom reports and dashboard functionality
-- Enables users to create custom reports with filtering, grouping, and aggregations
-- Enables users to create custom dashboards with drag-and-drop widgets

-- ============================================================================
-- SAVED REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(255) NOT NULL,
  description TEXT,
  object_type VARCHAR(50) NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  grouping JSONB DEFAULT '[]'::jsonb,
  aggregations JSONB DEFAULT '[]'::jsonb,
  sorting JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for custom_reports
CREATE INDEX idx_custom_reports_object_type ON custom_reports(object_type);
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_public ON custom_reports(is_public) WHERE is_public = true;
CREATE INDEX idx_custom_reports_system ON custom_reports(is_system) WHERE is_system = true;

-- Updated trigger for custom_reports
CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CUSTOM DASHBOARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for custom_dashboards
CREATE INDEX idx_custom_dashboards_created_by ON custom_dashboards(created_by);
CREATE INDEX idx_custom_dashboards_default ON custom_dashboards(is_default, created_by);
CREATE INDEX idx_custom_dashboards_public ON custom_dashboards(is_public) WHERE is_public = true;

-- Updated trigger for custom_dashboards
CREATE TRIGGER update_custom_dashboards_updated_at
  BEFORE UPDATE ON custom_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DASHBOARD WIDGET TYPES CATALOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_widget_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_name VARCHAR(100) NOT NULL UNIQUE,
  widget_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  configuration_schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for widget types
CREATE INDEX idx_dashboard_widget_types_category ON dashboard_widget_types(category);
CREATE INDEX idx_dashboard_widget_types_type ON dashboard_widget_types(widget_type);

-- ============================================================================
-- SEED DATA: Widget Types
-- ============================================================================
INSERT INTO dashboard_widget_types (widget_name, widget_type, category, description, configuration_schema) VALUES
('Stat Counter', 'stat', 'general', 'Single metric with icon and optional link', '{"fields": ["metric", "icon", "color", "link"]}'::jsonb),
('Bar Chart', 'chart', 'analytics', 'Vertical bar chart for comparing values', '{"fields": ["dataSource", "xField", "yField", "color", "chartType"]}'::jsonb),
('Line Chart', 'chart', 'analytics', 'Time series line chart for trends', '{"fields": ["dataSource", "xField", "yField", "color", "chartType"]}'::jsonb),
('Pie Chart', 'chart', 'analytics', 'Circular pie or donut chart for proportions', '{"fields": ["dataSource", "labelField", "valueField", "chartType"]}'::jsonb),
('Area Chart', 'chart', 'analytics', 'Area chart for cumulative data visualization', '{"fields": ["dataSource", "xField", "yField", "color", "chartType"]}'::jsonb),
('Data Table', 'table', 'general', 'Tabular data display with sorting', '{"fields": ["dataSource", "columns", "pageSize"]}'::jsonb),
('Simple List', 'list', 'general', 'Bulleted list with optional links', '{"fields": ["dataSource", "labelField", "linkPattern"]}'::jsonb),
('Expiring Items', 'expiring', 'assets', 'Items expiring soon (warranties, licenses, contracts)', '{"fields": ["itemType", "daysThreshold", "limit"]}'::jsonb),
('Network Utilization', 'network', 'network', 'Subnet utilization donut chart', '{"fields": ["networkId"]}'::jsonb),
('Recent Activity', 'activity', 'general', 'Recent changes and audit log entries', '{"fields": ["objectTypes", "limit"]}'::jsonb)
ON CONFLICT (widget_name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Pre-Built Report Templates
-- ============================================================================
INSERT INTO custom_reports (report_name, description, object_type, fields, filters, grouping, aggregations, sorting, is_public, is_system, created_by) VALUES
-- 1. Device Inventory
(
  'Device Inventory',
  'Complete device inventory with all key fields including location and manufacturer',
  'device',
  '["hostname", "device_type", "manufacturer", "model", "serial_number", "asset_tag", "purchase_date", "warranty_expiration", "status"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "hostname", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 2. Expiring Warranties
(
  'Expiring Warranties (Next 90 Days)',
  'Devices with warranties expiring in the next 90 days',
  'device',
  '["hostname", "device_type", "manufacturer", "model", "warranty_expiration", "serial_number"]'::jsonb,
  '{"type": "group", "logicalOperator": "AND", "conditions": [{"type": "condition", "field": "warranty_expiration", "operator": "greater_than_or_equal", "value": "NOW()"}, {"type": "condition", "field": "warranty_expiration", "operator": "less_than_or_equal", "value": "NOW() + INTERVAL ''90 days''"}]}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "warranty_expiration", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 3. License Utilization
(
  'License Utilization Report',
  'Software licenses showing seats used vs total seats available',
  'software_license',
  '["software_name", "license_type", "seats_total", "seats_used", "expiration_date", "purchase_date"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "software_name", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 4. Network VLAN Allocation
(
  'Network VLAN Allocation',
  'Complete list of networks/VLANs with VLAN IDs and IP ranges',
  'network',
  '["network_name", "vlan_id", "ip_range", "gateway", "description", "location_name"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "vlan_id", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 5. Software Deployment Status
(
  'Software Deployment Status',
  'Installed applications showing deployment status across devices',
  'installed_application',
  '["software_name", "version", "device_hostname", "install_date", "license_key"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "software_name", "direction": "ASC"}, {"field": "device_hostname", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 6. Contract Renewals (Next 60 Days)
(
  'Contract Renewals (Next 60 Days)',
  'Contracts with renewal dates in the next 60 days',
  'contract',
  '["contract_name", "vendor_name", "contract_type", "renewal_date", "annual_cost", "description"]'::jsonb,
  '{"type": "group", "logicalOperator": "AND", "conditions": [{"type": "condition", "field": "renewal_date", "operator": "greater_than_or_equal", "value": "NOW()"}, {"type": "condition", "field": "renewal_date", "operator": "less_than_or_equal", "value": "NOW() + INTERVAL ''60 days''"}]}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "renewal_date", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 7. People Directory
(
  'People Directory',
  'Complete directory of all people with contact information',
  'person',
  '["full_name", "email", "phone", "department", "job_title", "employment_status", "location_name"]'::jsonb,
  '{"type": "condition", "field": "employment_status", "operator": "equals", "value": "active"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "full_name", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 8. Orphaned Devices
(
  'Orphaned Devices (No Location/Owner)',
  'Devices without assigned location or owner',
  'device',
  '["hostname", "device_type", "manufacturer", "model", "serial_number", "status"]'::jsonb,
  '{"type": "group", "logicalOperator": "OR", "conditions": [{"type": "condition", "field": "location_id", "operator": "is_null"}, {"type": "condition", "field": "owner_id", "operator": "is_null"}]}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "hostname", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 9. Device Lifecycle Report
(
  'Device Lifecycle Report',
  'Device lifecycle from purchase to retirement',
  'device',
  '["hostname", "device_type", "manufacturer", "purchase_date", "install_date", "warranty_expiration", "retirement_date", "status"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "purchase_date", "direction": "DESC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 10. IP Address Allocation
(
  'IP Address Allocation',
  'All allocated IP addresses with associated devices and networks',
  'ip_address',
  '["ip_address", "hostname", "network_name", "mac_address", "dns_name", "is_reserved"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "ip_address", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 11. High-Value Assets
(
  'High-Value Assets (>$5000)',
  'Devices with purchase price exceeding $5000',
  'device',
  '["hostname", "device_type", "manufacturer", "model", "purchase_price", "purchase_date", "location_name"]'::jsonb,
  '{"type": "condition", "field": "purchase_price", "operator": "greater_than", "value": "5000"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "purchase_price", "direction": "DESC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 12. Mobile Device Inventory
(
  'Mobile Device Inventory',
  'All mobile devices (phones, tablets)',
  'device',
  '["hostname", "device_type", "manufacturer", "model", "serial_number", "owner_name", "phone_number"]'::jsonb,
  '{"type": "group", "logicalOperator": "OR", "conditions": [{"type": "condition", "field": "device_type", "operator": "equals", "value": "phone"}, {"type": "condition", "field": "device_type", "operator": "equals", "value": "tablet"}]}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "hostname", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 13. Server Inventory
(
  'Server Inventory',
  'All servers with key specifications',
  'device',
  '["hostname", "manufacturer", "model", "serial_number", "location_name", "room_name", "rack_position"]'::jsonb,
  '{"type": "condition", "field": "device_type", "operator": "equals", "value": "server"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "location_name", "direction": "ASC"}, {"field": "hostname", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 14. SaaS Service Catalog
(
  'SaaS Service Catalog',
  'All SaaS services with subscription details',
  'saas_service',
  '["service_name", "vendor_name", "subscription_type", "monthly_cost", "renewal_date", "license_count", "primary_contact"]'::jsonb,
  '{"type": "condition", "field": "status", "operator": "equals", "value": "active"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"field": "service_name", "direction": "ASC"}]'::jsonb,
  true,
  true,
  NULL
),

-- 15. Devices by Manufacturer
(
  'Devices Grouped by Manufacturer',
  'Device count grouped by manufacturer',
  'device',
  '["manufacturer"]'::jsonb,
  '{}'::jsonb,
  '["manufacturer"]'::jsonb,
  '[{"type": "COUNT", "field": "*", "alias": "device_count"}]'::jsonb,
  '[{"field": "device_count", "direction": "DESC"}]'::jsonb,
  true,
  true,
  NULL
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE custom_reports IS 'User-created custom reports with flexible filtering and grouping';
COMMENT ON TABLE custom_dashboards IS 'User-created custom dashboards with drag-and-drop widgets';
COMMENT ON TABLE dashboard_widget_types IS 'Catalog of available dashboard widget types';

COMMENT ON COLUMN custom_reports.object_type IS 'Object type to report on (device, person, location, etc.)';
COMMENT ON COLUMN custom_reports.fields IS 'Array of field names to include in report';
COMMENT ON COLUMN custom_reports.filters IS 'Filter conditions with operators and logical grouping';
COMMENT ON COLUMN custom_reports.grouping IS 'Array of fields to group by (for aggregation reports)';
COMMENT ON COLUMN custom_reports.aggregations IS 'Aggregation functions (COUNT, SUM, AVG, MIN, MAX)';
COMMENT ON COLUMN custom_reports.sorting IS 'Array of sort configurations (field + direction)';
COMMENT ON COLUMN custom_reports.is_system IS 'True for pre-built templates (non-editable)';

COMMENT ON COLUMN custom_dashboards.layout IS 'React-grid-layout positions and sizes';
COMMENT ON COLUMN custom_dashboards.widgets IS 'Array of widget configurations';
COMMENT ON COLUMN custom_dashboards.is_default IS 'True if this is the user''s default dashboard';
