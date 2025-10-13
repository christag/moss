-- Migration 011: Add Network Hierarchy Support
-- Adds parent_network_id for subnet hierarchy and supernet relationships

-- Add parent_network_id column to networks table
ALTER TABLE networks
ADD COLUMN parent_network_id UUID REFERENCES networks(id) ON DELETE SET NULL;

-- Add index for performance on hierarchy queries
CREATE INDEX idx_networks_parent_network_id ON networks(parent_network_id);

-- Add function to prevent circular hierarchy
CREATE OR REPLACE FUNCTION check_network_hierarchy_cycle(
    network_id UUID,
    new_parent_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_parent UUID;
    depth INTEGER := 0;
    max_depth INTEGER := 10;
BEGIN
    -- NULL parent is always valid
    IF new_parent_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Cannot set parent to self
    IF network_id = new_parent_id THEN
        RETURN FALSE;
    END IF;

    -- Walk up the parent chain to detect cycles
    current_parent := new_parent_id;
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
        -- Check if we've reached the original network (cycle detected)
        IF current_parent = network_id THEN
            RETURN FALSE;
        END IF;

        -- Get the next parent in the chain
        SELECT parent_network_id INTO current_parent
        FROM networks
        WHERE id = current_parent;

        depth := depth + 1;
    END LOOP;

    -- If we hit max_depth, prevent excessively deep hierarchies
    IF depth >= max_depth THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the column
COMMENT ON COLUMN networks.parent_network_id IS 'Parent network for subnet hierarchy (supernet relationship)';

-- Migration complete
-- To apply: psql -U postgres -d moss -f migrations/011_add_network_hierarchy.sql
