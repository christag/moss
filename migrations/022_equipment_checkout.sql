-- ============================================================================
-- Migration 022: Equipment Check-Out & Reservation System
-- ============================================================================
-- Purpose: Add equipment checkout, reservation, and condition tracking
-- MVP Core: Phases 1-5 (QR codes, reservations, checkout, checkin workflows)
-- Dependencies: file_attachments (migration 008), devices, people
-- ============================================================================

BEGIN;

-- Equipment Checkouts
CREATE TABLE IF NOT EXISTS equipment_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Device and person
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    checked_out_by UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,

    -- Dates
    checked_out_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'checked_out'
        CHECK (status IN ('checked_out', 'returned', 'overdue', 'lost')),

    -- Agreement
    agreement_signed_at TIMESTAMPTZ,
    signature_data TEXT, -- Base64 data URL from signature pad

    -- Late fees
    late_fee_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (late_fee_amount >= 0),

    -- Condition notes
    condition_on_checkout TEXT,
    condition_on_return TEXT,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_return_dates CHECK (
        actual_return_date IS NULL OR actual_return_date >= checked_out_at
    )
);

-- Equipment Reservations
CREATE TABLE IF NOT EXISTS equipment_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Device and person
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    reserved_by UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,

    -- Date range
    reservation_start TIMESTAMPTZ NOT NULL,
    reservation_end TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),

    -- Purpose and approval
    purpose TEXT,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES people(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_reservation_dates CHECK (reservation_end > reservation_start)
);

-- Agreement Templates
CREATE TABLE IF NOT EXISTS agreement_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template details
    template_name TEXT NOT NULL UNIQUE,
    template_text TEXT NOT NULL,

    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Tracking
    created_by UUID REFERENCES people(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Checkout Agreements (links checkouts to agreement PDFs)
CREATE TABLE IF NOT EXISTS checkout_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links
    checkout_id UUID NOT NULL REFERENCES equipment_checkouts(id) ON DELETE CASCADE,
    agreement_template_id UUID REFERENCES agreement_templates(id) ON DELETE SET NULL,

    -- Agreement text (snapshot at signing time)
    agreement_text TEXT NOT NULL,

    -- Signature
    signature_image_url TEXT, -- URL to file_attachments entry
    signed_at TIMESTAMPTZ NOT NULL,

    -- Audit trail
    signer_ip_address TEXT,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Condition Logs
CREATE TABLE IF NOT EXISTS equipment_condition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    checkout_id UUID REFERENCES equipment_checkouts(id) ON DELETE SET NULL,
    logged_by UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,

    -- Condition assessment
    condition TEXT NOT NULL
        CHECK (condition IN ('excellent', 'good', 'fair', 'damaged', 'broken')),
    damage_description TEXT,
    requires_repair BOOLEAN DEFAULT FALSE,

    -- When
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Condition Photos (junction table)
CREATE TABLE IF NOT EXISTS condition_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_log_id UUID NOT NULL REFERENCES equipment_condition_logs(id) ON DELETE CASCADE,
    file_attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (condition_log_id, file_attachment_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Equipment Checkouts
CREATE INDEX idx_checkouts_device ON equipment_checkouts(device_id);
CREATE INDEX idx_checkouts_person ON equipment_checkouts(checked_out_by);
CREATE INDEX idx_checkouts_status ON equipment_checkouts(status);
CREATE INDEX idx_checkouts_expected_return ON equipment_checkouts(expected_return_date);
CREATE INDEX idx_checkouts_created ON equipment_checkouts(created_at DESC);

-- Equipment Reservations
CREATE INDEX idx_reservations_device ON equipment_reservations(device_id);
CREATE INDEX idx_reservations_person ON equipment_reservations(reserved_by);
CREATE INDEX idx_reservations_status ON equipment_reservations(status);
CREATE INDEX idx_reservations_dates ON equipment_reservations(reservation_start, reservation_end);
CREATE INDEX idx_reservations_start ON equipment_reservations(reservation_start);
CREATE INDEX idx_reservations_end ON equipment_reservations(reservation_end);

-- Agreement Templates
CREATE INDEX idx_agreement_templates_active ON agreement_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_agreement_templates_default ON agreement_templates(is_default) WHERE is_default = TRUE;

-- Checkout Agreements
CREATE INDEX idx_agreements_checkout ON checkout_agreements(checkout_id);
CREATE INDEX idx_agreements_template ON checkout_agreements(agreement_template_id);

-- Condition Logs
CREATE INDEX idx_condition_logs_device ON equipment_condition_logs(device_id);
CREATE INDEX idx_condition_logs_checkout ON equipment_condition_logs(checkout_id);
CREATE INDEX idx_condition_logs_logged_at ON equipment_condition_logs(logged_at DESC);
CREATE INDEX idx_condition_logs_condition ON equipment_condition_logs(condition);

-- Condition Photos
CREATE INDEX idx_condition_photos_log ON condition_photos(condition_log_id);
CREATE INDEX idx_condition_photos_attachment ON condition_photos(file_attachment_id);

-- ============================================================================
-- Insert Default Agreement Template
-- ============================================================================

INSERT INTO agreement_templates (template_name, template_text, is_default, is_active)
VALUES (
    'Default Equipment Checkout Agreement',
    'EQUIPMENT CHECKOUT AGREEMENT

I, {{person_name}}, acknowledge receipt of the following equipment:
- {{device_name}} ({{device_asset_tag}})

I agree to:
1. Return this equipment by {{return_date}}
2. Use the equipment responsibly and only for intended purposes
3. Report any damage or issues immediately
4. Pay late fees if equipment is not returned on time
5. Accept financial responsibility for loss or damage

Signature below indicates acceptance of these terms.

Date: {{today_date}}',
    TRUE,
    TRUE
) ON CONFLICT (template_name) DO NOTHING;

COMMIT;

-- Log successful migration
DO $$
DECLARE
    v_checkouts_count INTEGER;
    v_reservations_count INTEGER;
    v_templates_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_checkouts_count FROM equipment_checkouts;
    SELECT COUNT(*) INTO v_reservations_count FROM equipment_reservations;
    SELECT COUNT(*) INTO v_templates_count FROM agreement_templates;

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Migration 022: Equipment Checkout System';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created 6 tables:';
    RAISE NOTICE '  - equipment_checkouts';
    RAISE NOTICE '  - equipment_reservations';
    RAISE NOTICE '  - agreement_templates';
    RAISE NOTICE '  - checkout_agreements';
    RAISE NOTICE '  - equipment_condition_logs';
    RAISE NOTICE '  - condition_photos';
    RAISE NOTICE '';
    RAISE NOTICE 'Initial counts:';
    RAISE NOTICE '  - Checkouts: %', v_checkouts_count;
    RAISE NOTICE '  - Reservations: %', v_reservations_count;
    RAISE NOTICE '  - Templates: %', v_templates_count;
    RAISE NOTICE '==============================================';
END $$;
