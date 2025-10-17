-- ============================================================================
-- Migration 022: Dropdown Field Options Management
-- ============================================================================
-- Purpose: Create centralized system for managing dropdown field values
-- Enables admins to add/edit/archive dropdown options without code changes
-- Implements soft-delete for safety when options are in use
-- ============================================================================

-- Create dropdown_field_options table
CREATE TABLE IF NOT EXISTS dropdown_field_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Field identification
    object_type VARCHAR(50) NOT NULL,      -- 'devices', 'people', 'locations', etc.
    field_name VARCHAR(50) NOT NULL,       -- 'device_type', 'person_type', 'status', etc.

    -- Option values
    option_value VARCHAR(100) NOT NULL,    -- 'computer', 'server', 'employee', etc.
    option_label VARCHAR(255) NOT NULL,    -- Display name (can be more readable than value)

    -- Organization and visibility
    display_order INTEGER DEFAULT 0,       -- For sorting in dropdowns
    is_active BOOLEAN DEFAULT true,        -- Soft delete flag (archived options)
    is_system BOOLEAN DEFAULT false,       -- System options cannot be deleted

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,         -- Cached count of records using this option

    -- Visual customization
    color VARCHAR(20),                     -- Optional hex color for badges (e.g., '#28C077')
    description TEXT,                      -- Optional help text

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure uniqueness per field
    UNIQUE(object_type, field_name, option_value)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_lookup
    ON dropdown_field_options(object_type, field_name, is_active);

CREATE INDEX IF NOT EXISTS idx_dropdown_options_value
    ON dropdown_field_options(option_value);

CREATE INDEX IF NOT EXISTS idx_dropdown_options_active
    ON dropdown_field_options(is_active)
    WHERE is_active = true;

-- Create function to update usage_count for a specific option
CREATE OR REPLACE FUNCTION calculate_dropdown_usage_count(
    p_object_type VARCHAR,
    p_field_name VARCHAR,
    p_option_value VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_table_name VARCHAR;
    v_query TEXT;
BEGIN
    -- Map object types to table names
    v_table_name := CASE p_object_type
        WHEN 'companies' THEN 'companies'
        WHEN 'locations' THEN 'locations'
        WHEN 'rooms' THEN 'rooms'
        WHEN 'people' THEN 'people'
        WHEN 'devices' THEN 'devices'
        WHEN 'networks' THEN 'networks'
        WHEN 'ios' THEN 'ios'
        WHEN 'ip_addresses' THEN 'ip_addresses'
        WHEN 'software' THEN 'software'
        WHEN 'saas_services' THEN 'saas_services'
        WHEN 'installed_applications' THEN 'installed_applications'
        WHEN 'software_licenses' THEN 'software_licenses'
        WHEN 'groups' THEN 'groups'
        WHEN 'documents' THEN 'documents'
        WHEN 'external_documents' THEN 'external_documents'
        WHEN 'contracts' THEN 'contracts'
        ELSE NULL
    END;

    -- If table name found, count usage
    IF v_table_name IS NOT NULL THEN
        v_query := format(
            'SELECT COUNT(*) FROM %I WHERE %I = $1',
            v_table_name,
            p_field_name
        );
        EXECUTE v_query INTO v_count USING p_option_value;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh all usage counts for a specific field
CREATE OR REPLACE FUNCTION refresh_dropdown_usage_counts(
    p_object_type VARCHAR,
    p_field_name VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_option RECORD;
    v_count INTEGER;
    v_total_updated INTEGER := 0;
BEGIN
    -- Update usage_count for all options in this field
    FOR v_option IN
        SELECT id, option_value
        FROM dropdown_field_options
        WHERE object_type = p_object_type
        AND field_name = p_field_name
    LOOP
        v_count := calculate_dropdown_usage_count(
            p_object_type,
            p_field_name,
            v_option.option_value
        );

        UPDATE dropdown_field_options
        SET usage_count = v_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_option.id;

        v_total_updated := v_total_updated + 1;
    END LOOP;

    RETURN v_total_updated;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE dropdown_field_options IS 'Centralized management of dropdown field values with soft-delete support for data safety';
COMMENT ON COLUMN dropdown_field_options.object_type IS 'Database table/object type (e.g., devices, people)';
COMMENT ON COLUMN dropdown_field_options.field_name IS 'Field/column name (e.g., device_type, status)';
COMMENT ON COLUMN dropdown_field_options.option_value IS 'Stored value in database (snake_case)';
COMMENT ON COLUMN dropdown_field_options.option_label IS 'Display label in UI (human-readable)';
COMMENT ON COLUMN dropdown_field_options.is_active IS 'FALSE = archived (not shown in dropdowns but preserved for existing records)';
COMMENT ON COLUMN dropdown_field_options.is_system IS 'TRUE = cannot be deleted or edited (core system values)';
COMMENT ON COLUMN dropdown_field_options.usage_count IS 'Cached count of records using this option (updated via function)';
COMMENT ON COLUMN dropdown_field_options.color IS 'Optional hex color for visual badges (e.g., #28C077)';

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_dropdown_field_options_updated_at
    BEFORE UPDATE ON dropdown_field_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Migration 022: Dropdown Field Options';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created dropdown_field_options table';
    RAISE NOTICE 'Created helper functions for usage tracking';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run seeds/005_dropdown_options.sql to populate initial options';
    RAISE NOTICE '2. Navigate to /admin/fields to manage dropdown options';
    RAISE NOTICE '==============================================';
END $$;
