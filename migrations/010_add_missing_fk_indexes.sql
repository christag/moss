-- Migration 010: Add Missing Foreign Key Indexes
-- Purpose: Improve JOIN performance on foreign key columns
-- Addresses: DEF-ROUND2-MASTER-009 - Missing Foreign Key Indexes

-- Note: Attachment tables will be created in migration 007 when implemented
-- For now, we skip attachment table indexes to avoid errors

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
  RAISE NOTICE 'Migration 010 complete: Added 5 foreign key indexes';
END $$;
