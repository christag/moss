-- ============================================================================
-- Migration 025: Advanced Search with Saved Filters
-- ============================================================================
-- Description: Adds support for saving and managing search filters across
--              all object types in M.O.S.S. Users can save complex filter
--              combinations and quickly reapply them.
--
-- Created: 2025-10-26
-- Author: Claude Code
-- ============================================================================

-- Create saved_filters table
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Filter metadata
    filter_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- What object type does this filter apply to?
    object_type VARCHAR(50) NOT NULL CHECK (object_type IN (
        'devices', 'networks', 'ios', 'ip_addresses', 'people', 'companies',
        'locations', 'rooms', 'groups', 'software', 'saas_services',
        'installed_applications', 'software_licenses', 'documents',
        'external_documents', 'contracts'
    )),

    -- Filter configuration (JSONB for flexibility)
    -- Structure:
    -- {
    --   "search": "search term",
    --   "filters": {
    --     "column_name": "filter_value",
    --     ...
    --   },
    --   "sort_by": "column_name",
    --   "sort_order": "asc|desc"
    -- }
    filter_config JSONB NOT NULL DEFAULT '{}',

    -- Sharing and visibility
    is_public BOOLEAN DEFAULT false, -- If true, all users can see this filter
    is_default BOOLEAN DEFAULT false, -- If true, this is the user's default filter for this object type

    -- Usage tracking
    last_used_at TIMESTAMP,
    use_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_object_type ON saved_filters(object_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_public ON saved_filters(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_saved_filters_default ON saved_filters(user_id, object_type, is_default) WHERE is_default = true;

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_object_type ON saved_filters(user_id, object_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_saved_filters_updated_at
    BEFORE UPDATE ON saved_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one default filter per user per object type
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
    -- If this filter is being set as default
    IF NEW.is_default = true THEN
        -- Unset all other default filters for this user and object type
        UPDATE saved_filters
        SET is_default = false
        WHERE user_id = NEW.user_id
          AND object_type = NEW.object_type
          AND id != NEW.id
          AND is_default = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default filter
CREATE TRIGGER enforce_single_default_filter
    BEFORE INSERT OR UPDATE ON saved_filters
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_filter();

-- Create view for public filters (accessible by all users)
CREATE OR REPLACE VIEW public_saved_filters AS
SELECT
    sf.*,
    u.email as created_by_email,
    COALESCE(p.full_name, u.email) as created_by_full_name
FROM saved_filters sf
JOIN users u ON sf.user_id = u.id
LEFT JOIN people p ON u.person_id = p.id
WHERE sf.is_public = true;

-- Grant permissions
GRANT SELECT ON public_saved_filters TO PUBLIC;

-- Add comments for documentation
COMMENT ON TABLE saved_filters IS 'Stores saved search/filter configurations for quick reapplication across all M.O.S.S. object types';
COMMENT ON COLUMN saved_filters.filter_config IS 'JSONB object containing search terms, column filters, and sort configuration';
COMMENT ON COLUMN saved_filters.is_public IS 'When true, filter is visible to all users (useful for org-wide standard filters)';
COMMENT ON COLUMN saved_filters.is_default IS 'When true, this filter is automatically applied when user visits the object list page';
COMMENT ON VIEW public_saved_filters IS 'Public saved filters accessible by all users with creator information';

-- ============================================================================
-- End Migration 025
-- ============================================================================
