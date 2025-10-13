-- Migration 007: File Attachments
-- Add file attachment support for all object types

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Main file_attachments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL, -- Stored filename (UUID-based, safe)
    original_filename VARCHAR(255) NOT NULL, -- User's original filename
    file_size BIGINT NOT NULL, -- File size in bytes
    mime_type VARCHAR(100) NOT NULL, -- MIME type (image/png, application/pdf, etc.)
    storage_path TEXT NOT NULL, -- Backend-specific path or key
    storage_backend VARCHAR(20) NOT NULL DEFAULT 'local', -- local, s3, nfs, smb
    metadata JSONB, -- Flexible metadata: width, height, duration, page_count, exif, etc.
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, quarantined, deleted
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for file_attachments
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX idx_file_attachments_mime_type ON file_attachments(mime_type);
CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at DESC);
CREATE INDEX idx_file_attachments_status ON file_attachments(status);
CREATE INDEX idx_file_attachments_storage_backend ON file_attachments(storage_backend);

-- Trigger for updated_at
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Junction tables for multi-object attachment support
-- =============================================================================

-- Device attachments
CREATE TABLE IF NOT EXISTS device_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, device_id)
);

CREATE INDEX idx_device_attachments_device_id ON device_attachments(device_id);
CREATE INDEX idx_device_attachments_attached_at ON device_attachments(attached_at DESC);

-- Person attachments
CREATE TABLE IF NOT EXISTS person_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, person_id)
);

CREATE INDEX idx_person_attachments_person_id ON person_attachments(person_id);
CREATE INDEX idx_person_attachments_attached_at ON person_attachments(attached_at DESC);

-- Location attachments
CREATE TABLE IF NOT EXISTS location_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, location_id)
);

CREATE INDEX idx_location_attachments_location_id ON location_attachments(location_id);
CREATE INDEX idx_location_attachments_attached_at ON location_attachments(attached_at DESC);

-- Room attachments
CREATE TABLE IF NOT EXISTS room_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, room_id)
);

CREATE INDEX idx_room_attachments_room_id ON room_attachments(room_id);
CREATE INDEX idx_room_attachments_attached_at ON room_attachments(attached_at DESC);

-- Network attachments
CREATE TABLE IF NOT EXISTS network_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, network_id)
);

CREATE INDEX idx_network_attachments_network_id ON network_attachments(network_id);
CREATE INDEX idx_network_attachments_attached_at ON network_attachments(attached_at DESC);

-- Document attachments
CREATE TABLE IF NOT EXISTS document_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, document_id)
);

CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX idx_document_attachments_attached_at ON document_attachments(attached_at DESC);

-- Contract attachments
CREATE TABLE IF NOT EXISTS contract_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, contract_id)
);

CREATE INDEX idx_contract_attachments_contract_id ON contract_attachments(contract_id);
CREATE INDEX idx_contract_attachments_attached_at ON contract_attachments(attached_at DESC);

-- Company attachments
CREATE TABLE IF NOT EXISTS company_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, company_id)
);

CREATE INDEX idx_company_attachments_company_id ON company_attachments(company_id);
CREATE INDEX idx_company_attachments_attached_at ON company_attachments(attached_at DESC);

-- Software attachments
CREATE TABLE IF NOT EXISTS software_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, software_id)
);

CREATE INDEX idx_software_attachments_software_id ON software_attachments(software_id);
CREATE INDEX idx_software_attachments_attached_at ON software_attachments(attached_at DESC);

-- SaaS service attachments
CREATE TABLE IF NOT EXISTS saas_service_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    saas_service_id UUID NOT NULL REFERENCES saas_services(id) ON DELETE CASCADE,
    attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
    attached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, saas_service_id)
);

CREATE INDEX idx_saas_service_attachments_saas_service_id ON saas_service_attachments(saas_service_id);
CREATE INDEX idx_saas_service_attachments_attached_at ON saas_service_attachments(attached_at DESC);

-- =============================================================================
-- System settings for file upload constraints
-- =============================================================================

-- Maximum file size in megabytes (default: 50 MB)
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.max_file_size_mb',
    '50',
    'storage',
    'Maximum file size for uploads in megabytes'
) ON CONFLICT (key) DO NOTHING;

-- Allowed MIME types (JSON array)
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.allowed_mime_types',
    '["image/jpeg","image/png","image/gif","image/webp","image/svg+xml","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv","text/html","application/json","application/zip","application/x-zip-compressed"]',
    'storage',
    'Allowed MIME types for file uploads (JSON array)'
) ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Helper function to get attachment count for an object
-- =============================================================================

CREATE OR REPLACE FUNCTION get_attachment_count(
    p_object_type VARCHAR,
    p_object_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    CASE p_object_type
        WHEN 'device' THEN
            SELECT COUNT(*) INTO v_count FROM device_attachments WHERE device_id = p_object_id;
        WHEN 'person' THEN
            SELECT COUNT(*) INTO v_count FROM person_attachments WHERE person_id = p_object_id;
        WHEN 'location' THEN
            SELECT COUNT(*) INTO v_count FROM location_attachments WHERE location_id = p_object_id;
        WHEN 'room' THEN
            SELECT COUNT(*) INTO v_count FROM room_attachments WHERE room_id = p_object_id;
        WHEN 'network' THEN
            SELECT COUNT(*) INTO v_count FROM network_attachments WHERE network_id = p_object_id;
        WHEN 'document' THEN
            SELECT COUNT(*) INTO v_count FROM document_attachments WHERE document_id = p_object_id;
        WHEN 'contract' THEN
            SELECT COUNT(*) INTO v_count FROM contract_attachments WHERE contract_id = p_object_id;
        WHEN 'company' THEN
            SELECT COUNT(*) INTO v_count FROM company_attachments WHERE company_id = p_object_id;
        WHEN 'software' THEN
            SELECT COUNT(*) INTO v_count FROM software_attachments WHERE software_id = p_object_id;
        WHEN 'saas_service' THEN
            SELECT COUNT(*) INTO v_count FROM saas_service_attachments WHERE saas_service_id = p_object_id;
        ELSE
            v_count := 0;
    END CASE;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON TABLE file_attachments IS 'Stores uploaded file metadata and references';
COMMENT ON COLUMN file_attachments.filename IS 'Safe stored filename (UUID-based)';
COMMENT ON COLUMN file_attachments.original_filename IS 'Original user-provided filename';
COMMENT ON COLUMN file_attachments.storage_path IS 'Backend-specific path or key for file retrieval';
COMMENT ON COLUMN file_attachments.metadata IS 'JSONB field for flexible metadata (dimensions, duration, EXIF, etc.)';
COMMENT ON COLUMN file_attachments.status IS 'active=available, quarantined=virus scan failed, deleted=soft deleted';

COMMENT ON FUNCTION get_attachment_count IS 'Helper function to get attachment count for any object type';
