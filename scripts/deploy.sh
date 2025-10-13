#!/bin/bash
# ============================================================================
# M.O.S.S. Production Deployment Script
# Handles zero-downtime deployment with rolling updates
# ============================================================================

set -e  # Exit on error

echo "======================================================================"
echo "M.O.S.S. Production Deployment"
echo "======================================================================"

# Configuration
COMPOSE_FILE="docker-compose.yml"
APP_SERVICE="app"
BACKUP_BEFORE_DEPLOY=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    log_error ".env.production file not found!"
    log_info "Copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Backup database before deployment (optional but recommended)
if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
    log_info "Creating pre-deployment database backup..."
    ./scripts/backup.sh || log_warn "Backup failed, continuing anyway..."
fi

# Pull latest code (if deploying from git)
if [ -d .git ]; then
    log_info "Pulling latest code from git..."
    git pull
fi

# Run database migrations
log_info "Running database migrations..."
docker compose -f $COMPOSE_FILE run --rm app node -e "
  const { getPool } = require('./src/lib/db');
  const fs = require('fs');
  const path = require('path');

  async function runMigrations() {
    const pool = getPool();
    const migrationsDir = './migrations';
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log('Running migrations...');
    for (const file of files) {
      console.log('  →', file);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
    }
    console.log('Migrations complete!');
    process.exit(0);
  }

  runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
"

# Build new image
log_info "Building new application image..."
docker compose -f $COMPOSE_FILE build $APP_SERVICE

# Rolling update: Start new container alongside old one
log_info "Starting new application container..."
docker compose -f $COMPOSE_FILE up -d --no-deps --scale $APP_SERVICE=2 $APP_SERVICE

# Wait for new container to be healthy
log_info "Waiting for new container to be healthy..."
sleep 10

# Check health endpoint
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f $COMPOSE_FILE exec -T $APP_SERVICE wget -q -O- http://localhost:3000/api/health > /dev/null 2>&1; then
        log_info "New container is healthy!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_info "Waiting for health check... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "New container failed health check!"
    log_error "Rolling back..."
    docker compose -f $COMPOSE_FILE up -d --no-deps --scale $APP_SERVICE=1 $APP_SERVICE
    exit 1
fi

# Stop old container (rolling update complete)
log_info "Stopping old container..."
docker compose -f $COMPOSE_FILE up -d --no-deps --scale $APP_SERVICE=1 $APP_SERVICE

# Clean up old images
log_info "Cleaning up old Docker images..."
docker image prune -f

echo "======================================================================"
echo "✓ Deployment Complete!"
echo "======================================================================"
echo ""
log_info "Application is now running the latest version"
log_info "Check logs with: docker compose logs -f app"
log_info "Check status with: docker compose ps"
echo ""
