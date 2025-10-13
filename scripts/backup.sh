#!/bin/bash
# ============================================================================
# M.O.S.S. Database Backup Script
# Creates timestamped PostgreSQL database backups
# ============================================================================

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESS=true

# Load environment from .env.production if it exists
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Database configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-moss}"
POSTGRES_USER="${POSTGRES_USER:-moss}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/moss_backup_$TIMESTAMP.sql"

echo "======================================================================"
echo "M.O.S.S. Database Backup"
echo "======================================================================"
echo "Database: $POSTGRES_DB"
echo "Backup file: $BACKUP_FILE"
echo ""

# Perform backup using docker compose exec
echo "Creating backup..."
if docker compose ps | grep -q postgres; then
    # Use docker compose exec if container is running
    docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
else
    echo "ERROR: PostgreSQL container is not running!"
    exit 1
fi

# Compress backup if enabled
if [ "$COMPRESS" = true ]; then
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    echo "Compressed to: $BACKUP_FILE"
fi

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Clean up old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "moss_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "moss_backup_*.sql*" -type f | wc -l)
echo "Remaining backups: $REMAINING_BACKUPS"

echo ""
echo "======================================================================"
echo "✓ Backup Complete!"
echo "======================================================================"
echo "Backup saved to: $BACKUP_FILE"
echo ""
