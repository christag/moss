-- Migration 004: Add Software License Junction Tables
-- Purpose: Enable person and group assignments to software licenses
-- Date: 2025-10-11
-- Related Defect: DEF-UAT-API-003

-- =====================================================
-- Person-Software License Assignments
-- =====================================================

CREATE TABLE IF NOT EXISTS person_software_licenses (
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (person_id, license_id)
);

-- Indexes for person_software_licenses
CREATE INDEX IF NOT EXISTS idx_person_software_licenses_person_id
    ON person_software_licenses(person_id);
CREATE INDEX IF NOT EXISTS idx_person_software_licenses_license_id
    ON person_software_licenses(license_id);
CREATE INDEX IF NOT EXISTS idx_person_software_licenses_assigned_date
    ON person_software_licenses(assigned_date);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_person_software_licenses_updated_at
    BEFORE UPDATE ON person_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Group-Software License Assignments
-- =====================================================

CREATE TABLE IF NOT EXISTS group_software_licenses (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, license_id)
);

-- Indexes for group_software_licenses
CREATE INDEX IF NOT EXISTS idx_group_software_licenses_group_id
    ON group_software_licenses(group_id);
CREATE INDEX IF NOT EXISTS idx_group_software_licenses_license_id
    ON group_software_licenses(license_id);
CREATE INDEX IF NOT EXISTS idx_group_software_licenses_assigned_date
    ON group_software_licenses(assigned_date);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_group_software_licenses_updated_at
    BEFORE UPDATE ON group_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Update software_licenses table to track seat usage
-- =====================================================

-- Add column to track assigned seats (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'software_licenses'
        AND column_name = 'seats_assigned'
    ) THEN
        ALTER TABLE software_licenses
        ADD COLUMN seats_assigned INTEGER DEFAULT 0 CHECK (seats_assigned >= 0);
    END IF;
END $$;

-- Add column to track purchased seats (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'software_licenses'
        AND column_name = 'seats_purchased'
    ) THEN
        ALTER TABLE software_licenses
        ADD COLUMN seats_purchased INTEGER CHECK (seats_purchased > 0);
    END IF;
END $$;

-- Create function to automatically update seat counts
CREATE OR REPLACE FUNCTION update_license_seat_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update seats_assigned count based on person and group assignments
    UPDATE software_licenses
    SET seats_assigned = (
        SELECT COUNT(DISTINCT person_id)
        FROM person_software_licenses
        WHERE license_id = COALESCE(NEW.license_id, OLD.license_id)
    ) + (
        SELECT COALESCE(SUM(member_count), 0)
        FROM (
            SELECT COUNT(gm.person_id) as member_count
            FROM group_software_licenses gsl
            INNER JOIN group_members gm ON gsl.group_id = gm.group_id
            WHERE gsl.license_id = COALESCE(NEW.license_id, OLD.license_id)
            GROUP BY gsl.group_id
        ) subquery
    )
    WHERE id = COALESCE(NEW.license_id, OLD.license_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update seat counts
CREATE TRIGGER update_license_seats_after_person_insert
    AFTER INSERT ON person_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count();

CREATE TRIGGER update_license_seats_after_person_delete
    AFTER DELETE ON person_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count();

CREATE TRIGGER update_license_seats_after_group_insert
    AFTER INSERT ON group_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count();

CREATE TRIGGER update_license_seats_after_group_delete
    AFTER DELETE ON group_software_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count();

-- Function to update seat counts when group membership changes
CREATE OR REPLACE FUNCTION update_license_seat_count_for_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all licenses assigned to this group
    UPDATE software_licenses sl
    SET seats_assigned = (
        SELECT COUNT(DISTINCT person_id)
        FROM person_software_licenses psl
        WHERE psl.license_id = sl.id
    ) + (
        SELECT COALESCE(SUM(member_count), 0)
        FROM (
            SELECT COUNT(gm.person_id) as member_count
            FROM group_software_licenses gsl
            INNER JOIN group_members gm ON gsl.group_id = gm.group_id
            WHERE gsl.license_id = sl.id
            GROUP BY gsl.group_id
        ) subquery
    )
    WHERE sl.id IN (
        SELECT license_id
        FROM group_software_licenses
        WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Also update seat count when group membership changes
CREATE TRIGGER update_license_seats_after_member_insert
    AFTER INSERT ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count_for_group();

CREATE TRIGGER update_license_seats_after_member_delete
    AFTER DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_license_seat_count_for_group();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE person_software_licenses IS
    'Junction table linking people to software licenses for individual assignments';
COMMENT ON TABLE group_software_licenses IS
    'Junction table linking groups to software licenses for group-based assignments';

COMMENT ON COLUMN software_licenses.seats_assigned IS
    'Automatically calculated count of seats in use (people + group members)';
COMMENT ON COLUMN software_licenses.seats_purchased IS
    'Total number of seats purchased for this license';

-- =====================================================
-- Verification queries (commented out)
-- =====================================================

-- Verify tables were created:
-- SELECT tablename FROM pg_tables WHERE tablename IN ('person_software_licenses', 'group_software_licenses');

-- Verify indexes were created:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('person_software_licenses', 'group_software_licenses');

-- Verify triggers were created:
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE '%license%';

-- Test seat count calculation:
-- SELECT id, seats_purchased, seats_assigned, (seats_purchased - seats_assigned) as available_seats
-- FROM software_licenses WHERE seats_purchased IS NOT NULL;
