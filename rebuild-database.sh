#!/bin/bash

# Rebuild Database from dbsetup.sql
# This script drops all existing tables and recreates them from the schema file

set -e  # Exit on error

DB_URL="postgresql://moss:moss_dev_password@192.168.64.2:5432/moss"

echo "==================================="
echo "Database Rebuild Script"
echo "==================================="
echo ""
echo "This will:"
echo "  1. Drop all existing tables"
echo "  2. Recreate schema from dbsetup.sql"
echo "  3. Run seed data (optional)"
echo ""
echo "WARNING: This will delete all existing data!"
echo ""

# Check if dbsetup.sql exists
if [ ! -f "dbsetup.sql" ]; then
    echo "ERROR: dbsetup.sql not found in current directory"
    exit 1
fi

echo "Step 1: Dropping existing tables..."
echo "------------------------------------"

# Create a script to drop all tables
cat > /tmp/drop_all_tables.sql << 'DROPSQL'
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS document_external_documents CASCADE;
DROP TABLE IF EXISTS document_contracts CASCADE;
DROP TABLE IF EXISTS document_saas_services CASCADE;
DROP TABLE IF EXISTS document_networks CASCADE;
DROP TABLE IF EXISTS document_devices CASCADE;
DROP TABLE IF EXISTS document_locations CASCADE;
DROP TABLE IF EXISTS document_rooms CASCADE;
DROP TABLE IF EXISTS external_document_rooms CASCADE;
DROP TABLE IF EXISTS external_document_locations CASCADE;
DROP TABLE IF EXISTS external_document_devices CASCADE;
DROP TABLE IF EXISTS external_document_networks CASCADE;
DROP TABLE IF EXISTS external_document_saas_services CASCADE;
DROP TABLE IF EXISTS contract_saas_services CASCADE;
DROP TABLE IF EXISTS contract_software_licenses CASCADE;
DROP TABLE IF EXISTS license_people CASCADE;
DROP TABLE IF EXISTS license_installed_applications CASCADE;
DROP TABLE IF EXISTS license_saas_services CASCADE;
DROP TABLE IF EXISTS software_licenses CASCADE;
DROP TABLE IF EXISTS group_saas_services CASCADE;
DROP TABLE IF EXISTS person_saas_services CASCADE;
DROP TABLE IF EXISTS group_installed_applications CASCADE;
DROP TABLE IF EXISTS installed_application_devices CASCADE;
DROP TABLE IF EXISTS installed_applications CASCADE;
DROP TABLE IF EXISTS saas_service_integrations CASCADE;
DROP TABLE IF EXISTS saas_services CASCADE;
DROP TABLE IF EXISTS software CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS role_assignments CASCADE;
DROP TABLE IF EXISTS object_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS ip_addresses CASCADE;
DROP TABLE IF EXISTS io_tagged_networks CASCADE;
DROP TABLE IF EXISTS ios CASCADE;
DROP TABLE IF EXISTS networks CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS external_documents CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROPSQL

# Execute the drop script
psql "$DB_URL" -f /tmp/drop_all_tables.sql

echo ""
echo "Step 2: Creating schema from dbsetup.sql..."
echo "--------------------------------------------"

# Run dbsetup.sql
psql "$DB_URL" -f dbsetup.sql

echo ""
echo "Step 3: Running seed data..."
echo "-----------------------------"

# Check which seed files exist
if [ -f "seeds/001_companies_locations.sql" ]; then
    echo "  - Running seeds/001_companies_locations.sql"
    psql "$DB_URL" -f seeds/001_companies_locations.sql
fi

if [ -f "seeds/002_rooms.sql" ]; then
    echo "  - Running seeds/002_rooms.sql"
    psql "$DB_URL" -f seeds/002_rooms.sql
fi

# Note: 003_people.sql uses wrong schema, skip it for now
# if [ -f "seeds/003_people.sql" ]; then
#     echo "  - Running seeds/003_people.sql"
#     psql "$DB_URL" -f seeds/003_people.sql
# fi

echo ""
echo "==================================="
echo "Database rebuild complete!"
echo "==================================="
echo ""
echo "Schema recreated from dbsetup.sql"
echo "Seed data loaded: companies, locations, rooms"
echo ""
echo "Next step: Create new people seed data with correct schema"
