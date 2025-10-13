# M.O.S.S. Docker Deployment

This document explains the Docker-based deployment architecture for M.O.S.S.

## Architecture Overview

M.O.S.S. uses a three-container architecture:

```
┌─────────────────────────────────────────┐
│         M.O.S.S. Application            │
│         (Node.js + Next.js)             │
│              Port 3000                  │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Redis     │
│   Port 5432 │  │  Port 6379  │
└─────────────┘  └─────────────┘
```

## Containers

### 1. Application Container (`moss_app`)

**Image**: Custom Next.js build
**Purpose**: Serves the web application
**Features**:
- Multi-stage Docker build for optimized image size
- Health checks via `/api/health`
- Runs as non-root user (nextjs:nodejs)
- Standalone Next.js output for production

**Configuration**:
- All settings via environment variables
- Overrides database `system_settings` table
- Hot-reloadable (1-minute cache)

### 2. PostgreSQL Container (`moss_postgres`)

**Image**: postgres:16-alpine
**Purpose**: Primary data storage
**Features**:
- Automatic initialization via `init-db.sh`
- Runs all migrations on first start
- Optimized configuration for IT asset workloads
- Health checks via `pg_isready`

**Persistence**:
- Data stored in `postgres_data` volume
- Survives container restarts
- Backed up via `backup.sh` script

### 3. Redis Container (`moss_redis`)

**Image**: redis:7-alpine
**Purpose**: Caching and sessions (future)
**Features**:
- Password-protected
- AOF persistence enabled
- LRU eviction policy (512MB max memory)
- Health checks via `redis-cli`

**Persistence**:
- Data stored in `redis_data` volume
- Append-only file (AOF) for durability

## Networks

All containers run on a dedicated bridge network (`moss_network`) with subnet `172.20.0.0/16`.

**Isolation**:
- PostgreSQL and Redis NOT exposed to public internet
- Only application container accepts external traffic
- Internal DNS resolution via container names

## Volumes

Three persistent volumes:

1. **postgres_data**: Database files
2. **redis_data**: Redis persistence
3. **uploads_data**: File attachments (local storage)

**Location**: `/var/lib/docker/volumes/moss_*`

## Configuration Methods

### 1. Environment Variables (Highest Priority)

Set in `.env.production` file:

```bash
MOSS_SITE_NAME=My Company CMDB
MOSS_PRIMARY_COLOR=#FF0000
MOSS_STORAGE_BACKEND=s3
```

These override database settings immediately.

### 2. Database Settings (Fallback)

Configured via admin UI at `/admin`:
- Persisted in `system_settings` table
- Cached for 1 minute
- Used if environment variable not set

### 3. Defaults (Last Resort)

Hard-coded defaults in application code.

## Deployment Modes

### Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Features**:
- Hot reload enabled
- Source code mounted as volume
- Debug logging enabled
- Different ports (3001, 5433, 6380)

### Production

```bash
docker compose up -d
```

**Features**:
- Optimized builds
- Health checks enabled
- Automatic restarts
- Resource limits (optional)

## Health Checks

All containers include health checks:

**Application**:
```bash
curl http://localhost:3000/api/health
```

**PostgreSQL**:
```bash
docker compose exec postgres pg_isready -U moss
```

**Redis**:
```bash
docker compose exec redis redis-cli ping
```

## Zero-Downtime Updates

The `deploy.sh` script performs rolling updates:

1. Start new container (scale=2)
2. Wait for health checks
3. Stop old container (scale=1)
4. Cleanup

**No service interruption** during updates.

## Security Features

### Container Security

- Non-root user in application container
- Read-only filesystem where possible
- No privileged mode
- Minimal base images (Alpine Linux)

### Network Security

- Database not exposed to public internet
- Password-protected Redis
- Session cookies: httpOnly, secure, sameSite
- CSRF protection via NextAuth.js

### Data Security

- Bcrypt password hashing (10 rounds)
- Encrypted environment variables via Docker secrets (optional)
- TLS for database connections (optional)

## Resource Limits (Optional)

Add to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Monitoring

### Built-in Monitoring

```bash
# Container stats
docker stats moss_app moss_postgres moss_redis

# Service logs
docker compose logs -f --tail=100

# Health status
docker compose ps
```

### External Monitoring (Optional)

Integrate with:
- Prometheus (metrics exporter)
- Grafana (visualization)
- Loki (log aggregation)
- Uptime Kuma (uptime monitoring)

## Backup Strategy

### Automated Backups

```bash
# Run backup script
./scripts/backup.sh

# Schedule daily backups (cron)
0 2 * * * cd /path/to/moss && ./scripts/backup.sh
```

**Backup includes**:
- Complete database dump (SQL format)
- Compressed with gzip
- Timestamped filename
- 30-day retention (configurable)

### Offsite Backups

Upload to cloud storage:

```bash
# After backup, sync to S3/R2
aws s3 sync backups/ s3://your-bucket/moss-backups/
```

## Disaster Recovery

### Full System Recovery

1. Restore `.env.production` file
2. Restore backups from offsite storage
3. Run `docker compose up -d`
4. Run `./scripts/restore.sh <backup-file>`

**RTO**: 30 minutes
**RPO**: 24 hours (daily backups)

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Verify environment
docker compose config

# Rebuild container
docker compose build --no-cache <service-name>
```

### Database Issues

```bash
# Connect to database
docker compose exec postgres psql -U moss -d moss

# Check connections
SELECT COUNT(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('moss'));
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check slow queries (if logging enabled)
docker compose exec postgres psql -U moss -d moss \
  -c "SELECT query, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

## Advanced Configuration

### Custom PostgreSQL Config

Edit `docker-compose.yml` `command` section:

```yaml
command: >
  postgres
  -c max_connections=500
  -c shared_buffers=1GB
  -c effective_cache_size=4GB
```

### External Database

To use external PostgreSQL:

```yaml
# docker-compose.yml - remove postgres service
services:
  app:
    environment:
      DATABASE_URL: postgresql://user:pass@external-db:5432/moss
```

### Kubernetes Deployment

See `k8s/` directory (future) for Kubernetes manifests.

## File Structure

```
moss/
├── Dockerfile                 # Application container image
├── docker-compose.yml         # Production orchestration
├── docker-compose.dev.yml     # Development overrides
├── .dockerignore             # Build context exclusions
├── .env.production.example   # Environment template
├── scripts/
│   ├── init-db.sh           # Database initialization
│   ├── deploy.sh            # Production deployment
│   ├── backup.sh            # Database backup
│   └── restore.sh           # Database restore
└── migrations/               # Database migrations
    └── *.sql                # Migration files
```

## Environment Variables Reference

See [.env.production.example](.env.production.example) for complete list.

**Categories**:
- Core (database, redis, auth)
- Branding (colors, logo)
- Storage (local, S3, NFS, SMB)
- Email (SMTP configuration)
- General (timezone, formats)
- Backup (schedule, retention)

## Support

- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
- **Full Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub Issues**: Report problems
