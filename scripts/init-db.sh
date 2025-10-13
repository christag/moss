#!/bin/bash
# ============================================================================
# M.O.S.S. Database Initialization Script
# Runs all migrations in order and sets up the database for first use
# ============================================================================

set -e  # Exit on error

echo "======================================================================"
echo "M.O.S.S. Database Initialization"
echo "======================================================================"

# Database connection parameters
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-moss}"
DB_USER="${POSTGRES_USER:-moss}"

echo "Connecting to PostgreSQL at ${DB_HOST}:${DB_PORT}..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Create database if it doesn't exist
echo "Checking if database '${DB_NAME}' exists..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<-EOSQL
  SELECT 'CREATE DATABASE ${DB_NAME}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
EOSQL

echo "Database '${DB_NAME}' is ready!"

# Enable UUID extension
echo "Enabling uuid-ossp extension..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' || true

# Run migrations
MIGRATION_DIR="/app/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
  MIGRATION_DIR="./migrations"
fi

if [ -d "$MIGRATION_DIR" ]; then
  echo "Running database migrations from ${MIGRATION_DIR}..."

  # Get list of migration files in order
  MIGRATIONS=$(find "$MIGRATION_DIR" -name "*.sql" | sort)

  if [ -z "$MIGRATIONS" ]; then
    echo "No migration files found. Skipping migrations."
  else
    for migration in $MIGRATIONS; do
      filename=$(basename "$migration")
      echo "  → Running migration: ${filename}"
      PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" -v ON_ERROR_STOP=1

      if [ $? -eq 0 ]; then
        echo "    ✓ Migration ${filename} completed successfully"
      else
        echo "    ✗ Migration ${filename} failed!"
        exit 1
      fi
    done
  fi
else
  echo "Migration directory not found: ${MIGRATION_DIR}"
  echo "Skipping migrations."
fi

echo "======================================================================"
echo "Database initialization complete!"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "  1. Start the M.O.S.S. application"
echo "  2. Navigate to http://localhost:3000/setup"
echo "  3. Complete the first-run setup wizard"
echo ""
