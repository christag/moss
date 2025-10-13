# M.O.S.S. Production Deployment Guide

Complete guide for deploying M.O.S.S. in production using Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Initial Deployment](#initial-deployment)
- [First-Run Setup Wizard](#first-run-setup-wizard)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Updates and Maintenance](#updates-and-maintenance)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Backup and Restore](#backup-and-restore)

---

## Prerequisites

### Required Software

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later
- **Git** (optional, for updates from repository)

### Server Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space
- Ubuntu 20.04+ / Debian 11+ / RHEL 8+

**Recommended**:
- 4 CPU cores
- 8 GB RAM
- 50 GB disk space (SSD preferred)
- Ubuntu 22.04 LTS / Debian 12

### Network Requirements

- Ports 80/443 (HTTP/HTTPS) - accessible from clients
- Port 3000 (optional, for direct app access)
- Outbound HTTPS access (for integrations, optional)

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/moss.git
cd moss

# 2. Create production environment file
cp .env.production.example .env.production

# 3. Edit .env.production and set required values
nano .env.production
# Set: POSTGRES_PASSWORD, REDIS_PASSWORD, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Start all services
docker compose up -d

# 5. Check logs
docker compose logs -f

# 6. Open browser and complete setup wizard
# Navigate to: http://your-server:3000/setup
```

---

## Initial Deployment

### Step 1: Prepare Environment

```bash
# Create .env.production file
cp .env.production.example .env.production
```

### Step 2: Configure Required Settings

Edit `.env.production` and set the following **required** variables:

```bash
# Database password (generate with: openssl rand -base64 32)
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# Redis password (generate with: openssl rand -base64 32)
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET

# Application URL
NEXT_PUBLIC_APP_URL=https://moss.yourdomain.com
NEXTAUTH_URL=https://moss.yourdomain.com
```

### Step 3: Start Services

```bash
# Start all services in detached mode
docker compose up -d

# Verify all containers are running
docker compose ps

# Expected output:
# NAME            STATUS         PORTS
# moss_app        Up (healthy)   0.0.0.0:3000->3000/tcp
# moss_postgres   Up (healthy)   0.0.0.0:5432->5432/tcp
# moss_redis      Up (healthy)   0.0.0.0:6379->6379/tcp
```

### Step 4: Verify Health

```bash
# Check application health
curl http://localhost:3000/api/health

# Check database health
curl http://localhost:3000/api/health/db

# Check Redis health
curl http://localhost:3000/api/health/redis
```

### Step 5: View Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f redis
```

---

## First-Run Setup Wizard

After deployment, navigate to your M.O.S.S. URL to complete the setup wizard.

### Setup Steps

1. **Welcome Screen**
   - Introduction to M.O.S.S. and setup process

2. **Administrator Account**
   - Full Name: Your name
   - Email: admin@yourdomain.com
   - Password: Choose a strong password (min 8 characters)

3. **Primary Organization**
   - Company Name: Your organization name
   - Website: https://www.yourdomain.com (optional)
   - Address: Physical address (optional)

4. **System Preferences**
   - Timezone: Select your timezone
   - Date Format: Choose preferred format

5. **Completion**
   - Setup completes automatically
   - Redirects to login page

### Post-Setup

After completing the wizard:
1. Log in with your admin credentials
2. Navigate to `/admin` to configure additional settings
3. Start adding your IT assets

---

## Environment Configuration

### Core Settings (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_random_password_here` |
| `REDIS_PASSWORD` | Redis password | `secure_redis_password_here` |
| `NEXTAUTH_SECRET` | NextAuth.js encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL of application | `https://moss.yourdomain.com` |

### Branding Settings (Optional)

Override default branding via environment variables:

```bash
MOSS_SITE_NAME=Your Company CMDB
MOSS_PRIMARY_COLOR=#1C7FF2
MOSS_LOGO_URL=https://cdn.yourdomain.com/logo.png
```

### Storage Configuration (Optional)

**Local Storage** (default):
```bash
MOSS_STORAGE_BACKEND=local
MOSS_STORAGE_LOCAL_PATH=/app/uploads
```

**Cloudflare R2** (recommended for production):
```bash
MOSS_STORAGE_BACKEND=s3
MOSS_S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
MOSS_S3_BUCKET=moss-uploads
MOSS_S3_REGION=auto
MOSS_S3_ACCESS_KEY=your_r2_access_key
MOSS_S3_SECRET_KEY=your_r2_secret_key
```

**AWS S3**:
```bash
MOSS_STORAGE_BACKEND=s3
MOSS_S3_BUCKET=moss-uploads
MOSS_S3_REGION=us-east-1
MOSS_S3_ACCESS_KEY=your_aws_access_key
MOSS_S3_SECRET_KEY=your_aws_secret_key
```

### Email Notifications (Optional)

```bash
MOSS_SMTP_ENABLED=true
MOSS_SMTP_HOST=smtp.gmail.com
MOSS_SMTP_PORT=587
MOSS_SMTP_USERNAME=your-email@gmail.com
MOSS_SMTP_PASSWORD=your-app-password
MOSS_SMTP_FROM_ADDRESS=moss@yourdomain.com
MOSS_SMTP_FROM_NAME=M.O.S.S.
MOSS_SMTP_USE_TLS=true
```

---

## Database Management

### Access PostgreSQL

```bash
# Connect to PostgreSQL container
docker compose exec postgres psql -U moss -d moss

# Run SQL commands
moss=# SELECT COUNT(*) FROM devices;
moss=# \dt  # List tables
moss=# \q   # Exit
```

### Manual Migrations

```bash
# Run all pending migrations
docker compose exec app npm run db:migrate
```

### Database Backups

See [Backup and Restore](#backup-and-restore) section.

---

## Updates and Maintenance

### Zero-Downtime Updates

Use the provided deployment script for production updates:

```bash
# Run deployment script (includes backup, migrations, rolling update)
./scripts/deploy.sh
```

The script performs:
1. Pre-deployment database backup
2. Pull latest code (if using git)
3. Run database migrations
4. Build new Docker image
5. Rolling update (start new → verify health → stop old)
6. Cleanup old images

### Manual Update Process

If you prefer manual control:

```bash
# 1. Backup database
./scripts/backup.sh

# 2. Pull latest code
git pull

# 3. Rebuild and restart
docker compose build app
docker compose up -d

# 4. Verify health
curl http://localhost:3000/api/health
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart postgres
docker compose restart redis
```

---

## Monitoring

### Health Checks

M.O.S.S. includes built-in health check endpoints:

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db

# Redis health
curl http://localhost:3000/api/health/redis
```

### View Logs

```bash
# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs -f app

# Follow with timestamps
docker compose logs -f -t app
```

### Container Status

```bash
# View container status
docker compose ps

# View resource usage
docker stats moss_app moss_postgres moss_redis
```

### PostgreSQL Monitoring

```bash
# Active connections
docker compose exec postgres psql -U moss -d moss -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Database size
docker compose exec postgres psql -U moss -d moss -c "SELECT pg_size_pretty(pg_database_size('moss'));"

# Slow queries (if enabled)
docker compose exec postgres psql -U moss -d moss -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

---

## Troubleshooting

### Application Won't Start

**Check logs**:
```bash
docker compose logs app
```

**Common issues**:
- Database not ready → Wait 30 seconds, check `docker compose logs postgres`
- Missing environment variables → Verify `.env.production` file
- Port already in use → Change `APP_PORT` in `.env.production`

### Database Connection Errors

**Verify PostgreSQL is running**:
```bash
docker compose ps postgres
docker compose logs postgres
```

**Test connection**:
```bash
docker compose exec postgres pg_isready -U moss
```

**Reset database** (⚠️ destroys all data):
```bash
docker compose down -v
docker compose up -d
```

### Health Check Failures

**Check health endpoints**:
```bash
curl -v http://localhost:3000/api/health
curl -v http://localhost:3000/api/health/db
```

**Restart unhealthy service**:
```bash
docker compose restart app
```

### Performance Issues

**Check resource usage**:
```bash
docker stats
```

**Increase PostgreSQL memory** (edit `docker-compose.yml`):
```yaml
command: >
  postgres
  -c shared_buffers=512MB
  -c effective_cache_size=2GB
```

### Can't Access Admin Panel

**Verify user role**:
```bash
docker compose exec postgres psql -U moss -d moss
moss=# SELECT email, role FROM users;
```

**Promote user to super_admin**:
```bash
moss=# UPDATE users SET role='super_admin' WHERE email='your@email.com';
```

---

## Backup and Restore

### Automated Backups

**Create backup**:
```bash
./scripts/backup.sh
```

Backups are stored in `./backups/` with timestamps.

**Configure automatic backups** (cron job):
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/moss && ./scripts/backup.sh
```

### Manual Backup

```bash
# Create backup with custom name
docker compose exec postgres pg_dump -U moss moss > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# List available backups
ls -lh backups/

# Restore from backup (⚠️ overwrites current database)
./scripts/restore.sh backups/moss_backup_20251012_143000.sql.gz
```

### Offsite Backups

**Upload to S3/R2**:
```bash
# After backup, upload to cloud storage
aws s3 cp backups/moss_backup_*.sql.gz s3://your-bucket/moss-backups/
```

**Backup retention policy**:
- Local backups: 30 days (configurable)
- Offsite backups: 90 days recommended

---

## Security Best Practices

1. **Use Strong Passwords**
   - Generate passwords with: `openssl rand -base64 32`
   - Never use default passwords in production

2. **HTTPS Only**
   - Use nginx or Caddy as reverse proxy with SSL/TLS
   - Obtain certificates from Let's Encrypt

3. **Firewall Rules**
   - Only expose ports 80/443 to public
   - Restrict PostgreSQL/Redis to localhost or internal network

4. **Regular Updates**
   - Update M.O.S.S. monthly or when security patches are released
   - Update Docker images regularly

5. **Backup Encryption**
   - Encrypt backups before offsite storage
   - Use GPG or cloud provider encryption

6. **Access Control**
   - Use RBAC to limit user permissions
   - Review user roles quarterly
   - Enable MFA when available

---

## Reverse Proxy Configuration

### Nginx Example

```nginx
server {
    listen 80;
    server_name moss.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name moss.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/moss.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moss.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy Example (Automatic HTTPS)

```
moss.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## Support

- **Documentation**: https://github.com/yourusername/moss/wiki
- **Issues**: https://github.com/yourusername/moss/issues
- **Discord**: https://discord.gg/your-server (if available)

---

## License

M.O.S.S. is open-source software licensed under the MIT License.
