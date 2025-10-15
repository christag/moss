-- Migration 007: File Attachments System
-- Add support for file attachments on multiple object types
-- Includes main attachments table and junction tables for linking

-- =============================================================================
-- Main File Attachments Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File information
    filename VARCHAR(255) NOT NULL,                  -- Stored filename (UUID-based)
    original_filename VARCHAR(255) NOT NULL,         -- User's original filename
    file_size BIGINT NOT NULL CHECK (file_size > 0), -- File size in bytes
    mime_type VARCHAR(100) NOT NULL,                 -- MIME type
    
    -- Storage information
    storage_path TEXT NOT NULL,                      -- Backend-specific path/key
    storage_backend VARCHAR(20) NOT NULL             -- Backend type
        CHECK (storage_backend IN ('local', 's3', 'nfs', 'smb')),
    
    -- Metadata (flexible JSONB for different file types)
    metadata JSONB,                                  -- Image dimensions, EXIF, etc.
    
    -- Tracking
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'quarantined', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for file_attachments
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX idx_file_attachments_storage_backend ON file_attachments(storage_backend);
CREATE INDEX idx_file_attachments_status ON file_attachments(status);
CREATE INDEX idx_file_attachments_mime_type ON file_attachments(mime_type);
CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at DESC);

-- =============================================================================
-- Junction Tables - Link attachments to different object types
-- =============================================================================

-- Device Attachments
CREATE TABLE IF NOT EXISTS device_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, device_id)
);

CREATE INDEX idx_device_attachments_device ON device_attachments(device_id);
CREATE INDEX idx_device_attachments_attached_at ON device_attachments(attached_at DESC);

-- Person Attachments
CREATE TABLE IF NOT EXISTS person_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, person_id)
);

CREATE INDEX idx_person_attachments_person ON person_attachments(person_id);
CREATE INDEX idx_person_attachments_attached_at ON person_attachments(attached_at DESC);

-- Location Attachments
CREATE TABLE IF NOT EXISTS location_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, location_id)
);

CREATE INDEX idx_location_attachments_location ON location_attachments(location_id);
CREATE INDEX idx_location_attachments_attached_at ON location_attachments(attached_at DESC);

-- Room Attachments
CREATE TABLE IF NOT EXISTS room_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, room_id)
);

CREATE INDEX idx_room_attachments_room ON room_attachments(room_id);
CREATE INDEX idx_room_attachments_attached_at ON room_attachments(attached_at DESC);

-- Network Attachments
CREATE TABLE IF NOT EXISTS network_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, network_id)
);

CREATE INDEX idx_network_attachments_network ON network_attachments(network_id);
CREATE INDEX idx_network_attachments_attached_at ON network_attachments(attached_at DESC);

-- Document Attachments
CREATE TABLE IF NOT EXISTS document_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, document_id)
);

CREATE INDEX idx_document_attachments_document ON document_attachments(document_id);
CREATE INDEX idx_document_attachments_attached_at ON document_attachments(attached_at DESC);

-- Contract Attachments
CREATE TABLE IF NOT EXISTS contract_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, contract_id)
);

CREATE INDEX idx_contract_attachments_contract ON contract_attachments(contract_id);
CREATE INDEX idx_contract_attachments_attached_at ON contract_attachments(attached_at DESC);

-- Company Attachments
CREATE TABLE IF NOT EXISTS company_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, company_id)
);

CREATE INDEX idx_company_attachments_company ON company_attachments(company_id);
CREATE INDEX idx_company_attachments_attached_at ON company_attachments(attached_at DESC);

-- Software Attachments
CREATE TABLE IF NOT EXISTS software_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, software_id)
);

CREATE INDEX idx_software_attachments_software ON software_attachments(software_id);
CREATE INDEX idx_software_attachments_attached_at ON software_attachments(attached_at DESC);

-- SaaS Service Attachments
CREATE TABLE IF NOT EXISTS saas_service_attachments (
    attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    saas_service_id UUID NOT NULL REFERENCES saas_services(id) ON DELETE CASCADE,
    attached_by UUID NOT NULL REFERENCES users(id),
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id, saas_service_id)
);

CREATE INDEX idx_saas_service_attachments_service ON saas_service_attachments(saas_service_id);
CREATE INDEX idx_saas_service_attachments_attached_at ON saas_service_attachments(attached_at DESC);

-- =============================================================================
-- Add default system settings for file attachments
-- =============================================================================

-- Storage backend setting (default: local)
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.backend',
    '"local"',
    'storage',
    'Storage backend for file attachments (local, s3, nfs, smb)'
)
ON CONFLICT (key) DO NOTHING;

-- Max file size setting (default: 50MB)
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.max_file_size_mb',
    '50',
    'storage',
    'Maximum file size for uploads in megabytes'
)
ON CONFLICT (key) DO NOTHING;

-- Local storage path (default: ./uploads)
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.local.path',
    '"./uploads"',
    'storage',
    'Local filesystem path for file storage'
)
ON CONFLICT (key) DO NOTHING;

-- Allowed MIME types
INSERT INTO system_settings (key, value, category, description)
VALUES (
    'storage.allowed_mime_types',
    '["image/jpeg","image/png","image/gif","image/webp","image/svg+xml","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv","text/html","application/json","application/zip","application/x-zip-compressed"]',
    'storage',
    'List of allowed MIME types for file uploads'
)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE file_attachments IS 'Central table for all file attachments across the system';
COMMENT ON COLUMN file_attachments.filename IS 'Stored filename (typically UUID-based for uniqueness)';
COMMENT ON COLUMN file_attachments.original_filename IS 'Original filename provided by user';
COMMENT ON COLUMN file_attachments.storage_path IS 'Full path or key in storage backend';
COMMENT ON COLUMN file_attachments.metadata IS 'Flexible JSONB for file-specific metadata (EXIF, dimensions, etc.)';
COMMENT ON COLUMN file_attachments.download_count IS 'Number of times file has been downloaded';

COMMENT ON TABLE device_attachments IS 'Links file attachments to devices (photos, manuals, etc.)';
COMMENT ON TABLE person_attachments IS 'Links file attachments to people (photos, resumes, etc.)';
COMMENT ON TABLE location_attachments IS 'Links file attachments to locations (maps, photos, etc.)';
COMMENT ON TABLE room_attachments IS 'Links file attachments to rooms (photos, layouts, etc.)';
COMMENT ON TABLE network_attachments IS 'Links file attachments to networks (diagrams, configs, etc.)';
COMMENT ON TABLE document_attachments IS 'Links file attachments to documents';
COMMENT ON TABLE contract_attachments IS 'Links file attachments to contracts (signed PDFs, etc.)';
COMMENT ON TABLE company_attachments IS 'Links file attachments to companies (logos, documents, etc.)';
COMMENT ON TABLE software_attachments IS 'Links file attachments to software (installers, licenses, etc.)';
COMMENT ON TABLE saas_service_attachments IS 'Links file attachments to SaaS services (configs, screenshots, etc.)';

