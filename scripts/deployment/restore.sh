#!/bin/bash
# ============================================================================
# M.O.S.S. Database Restore Script
# Restores PostgreSQL database from backup file
# ============================================================================

set -e  # Exit on error

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/moss_backup_*.sql* 2>/dev/null || echo "No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment from .env.production if it exists
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Database configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-moss}"
POSTGRES_USER="${POSTGRES_USER:-moss}"

echo "======================================================================"
echo "M.O.S.S. Database Restore"
echo "======================================================================"
echo "Database: $POSTGRES_DB"
echo "Backup file: $BACKUP_FILE"
echo ""
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "⚠️  Make sure you have a backup of the current database before proceeding."
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress if file is gzipped
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    TEMP_FILE="/tmp/moss_restore_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# Stop application to prevent writes during restore
echo ""
echo "Stopping application..."
docker compose stop app

# Drop and recreate database
echo "Recreating database..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"

# Restore backup
echo "Restoring backup..."
cat "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Clean up temp file
if [ -n "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

# Restart application
echo "Restarting application..."
docker compose start app

echo ""
echo "======================================================================"
echo "✓ Restore Complete!"
echo "======================================================================"
echo "Database has been restored from: $(basename $BACKUP_FILE)"
echo "Application is starting up..."
echo ""
echo "Check logs with: docker compose logs -f app"
echo ""
