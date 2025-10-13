-- Migration 010: Add Missing Foreign Key Indexes
-- Purpose: Improve JOIN performance on foreign key columns
-- Addresses: DEF-ROUND2-MASTER-009 - Missing Foreign Key Indexes

-- Attachment tables - attached_by indexes (8 indexes)
CREATE INDEX IF NOT EXISTS idx_company_attachments_attached_by ON company_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_contract_attachments_attached_by ON contract_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_device_attachments_attached_by ON device_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_document_attachments_attached_by ON document_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_location_attachments_attached_by ON location_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_network_attachments_attached_by ON network_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_person_attachments_attached_by ON person_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_room_attachments_attached_by ON room_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_saas_service_attachments_attached_by ON saas_service_attachments(attached_by);
CREATE INDEX IF NOT EXISTS idx_software_attachments_attached_by ON software_attachments(attached_by);

-- Device relationships (2 indexes)
CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_used_by_id ON devices(last_used_by_id);

-- People relationships (1 index)
CREATE INDEX IF NOT EXISTS idx_people_manager_id ON people(manager_id);

-- SaaS services (1 index)
CREATE INDEX IF NOT EXISTS idx_saas_services_technical_contact_id ON saas_services(technical_contact_id);

-- System settings (1 index)
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON system_settings(updated_by);

-- Update table statistics for query planner
ANALYZE;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 010 complete: Added 15 foreign key indexes';
END $$;
