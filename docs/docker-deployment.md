# Docker Deployment Guide

This guide covers deploying M.O.S.S. using Docker containers with pre-built images from GitHub Container Registry (GHCR).

## Overview

M.O.S.S. provides Docker images automatically built and published to GitHub Container Registry. These images are:

- **Multi-platform**: Available for `linux/amd64` and `linux/arm64`
- **Optimized**: Multi-stage builds for minimal image size
- **Secure**: Non-root user, health checks, and security best practices
- **Versioned**: Tagged with semantic versions, git SHAs, and `latest` for main branch

## Available Images

Images are published to: `ghcr.io/YOUR-USERNAME/moss`

### Tags

- `latest` - Latest stable build from main branch
- `v1.2.3` - Specific semantic version
- `v1.2` - Latest patch version of a minor release
- `v1` - Latest minor version of a major release
- `main-abc1234` - Specific commit from main branch

## Quick Start

### 1. Clone the Repository (for compose files and migrations)

```bash
git clone https://github.com/YOUR-USERNAME/moss.git
cd moss
```

### 2. Create Environment File

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production settings:

```bash
# Required Settings
POSTGRES_PASSWORD=your-secure-postgres-password
REDIS_PASSWORD=your-secure-redis-password
NEXTAUTH_SECRET=your-secure-nextauth-secret

# Application URL (set to your domain)
NEXT_PUBLIC_APP_URL=https://moss.example.com
NEXTAUTH_URL=https://moss.example.com

# GitHub Container Registry Settings
GITHUB_REPOSITORY=your-username/moss
IMAGE_TAG=latest  # or specific version like v1.0.0

# Optional: Override other settings as needed
# See .env.example for all available options
```

### 3. Deploy with Docker Compose

```bash
# Pull the latest image and start services
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop services
docker compose -f docker-compose.prod.yml down
```

## Production Deployment Options

### Option 1: Pre-built Images (Recommended)

Use `docker-compose.prod.yml` which pulls images from GHCR:

```yaml
app:
  image: ghcr.io/your-username/moss:latest
```

**Advantages:**
- Fast deployment (no build time)
- Consistent builds across environments
- Automatic updates with `docker compose pull`
- Multi-platform support

### Option 2: Local Build

Use `docker-compose.yml` which builds locally:

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
```

**Use when:**
- Testing local changes
- No internet connection to GHCR
- Custom modifications to the image

## Pulling Images

### Authenticate to GitHub Container Registry

For public repositories, authentication is optional. For private repositories:

```bash
# Create a GitHub Personal Access Token with 'read:packages' scope
# https://github.com/settings/tokens

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR-USERNAME --password-stdin
```

### Pull Specific Versions

```bash
# Latest from main branch
docker pull ghcr.io/your-username/moss:latest

# Specific version
docker pull ghcr.io/your-username/moss:v1.0.0

# Specific commit
docker pull ghcr.io/your-username/moss:main-abc1234

# Specific platform (if needed)
docker pull --platform linux/arm64 ghcr.io/your-username/moss:latest
```

## Environment Variables

### Required Variables

```bash
POSTGRES_PASSWORD=     # PostgreSQL password
REDIS_PASSWORD=        # Redis password
NEXTAUTH_SECRET=       # NextAuth.js secret (generate with: openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=   # Your application URL (e.g., https://moss.example.com)
NEXTAUTH_URL=          # Same as NEXT_PUBLIC_APP_URL
```

### Image Selection Variables

```bash
GITHUB_REPOSITORY=your-username/moss  # Your GitHub repository
IMAGE_TAG=latest                      # Image tag to use
```

### Optional Variables

See `.env.example` for the complete list of configuration options including:
- Storage backends (S3, NFS, SMB)
- SMTP/Email notifications
- SAML/SSO authentication
- Custom branding
- System preferences

## Health Checks

All services include health checks:

### Application Health

```bash
# Check application health
curl http://localhost:3000/api/health

# Check with Docker
docker inspect --format='{{.State.Health.Status}}' moss_app
```

### Database Health

```bash
docker inspect --format='{{.State.Health.Status}}' moss_postgres
```

### Redis Health

```bash
docker inspect --format='{{.State.Health.Status}}' moss_redis
```

## Upgrading

### Using Pre-built Images

```bash
# Pull the latest image
docker compose -f docker-compose.prod.yml pull app

# Stop and recreate the app container
docker compose -f docker-compose.prod.yml up -d app

# Verify the upgrade
docker compose -f docker-compose.prod.yml logs -f app
```

### Upgrading to a Specific Version

```bash
# Set the version in your .env file
echo "IMAGE_TAG=v1.1.0" >> .env.production

# Pull and upgrade
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d app
```

## Data Persistence

All data is stored in named Docker volumes:

- `postgres_data` - Database data
- `redis_data` - Cache data
- `uploads_data` - Uploaded files (if using local storage)

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm \
  -v moss_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data

# Backup uploads
docker run --rm \
  -v moss_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz /data
```

### Restore Volumes

```bash
# Restore PostgreSQL data
docker run --rm \
  -v moss_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres-20250113.tar.gz --strip 1"
```

## Networking

### Port Mappings

- `3000` - Application (customizable with `APP_PORT`)
- `5432` - PostgreSQL (internal, not exposed by default)
- `6379` - Redis (internal, not exposed by default)

### External Access

To expose the database or Redis externally, modify the `ports` section in your compose file:

```yaml
postgres:
  ports:
    - "5432:5432"  # Expose PostgreSQL

redis:
  ports:
    - "6379:6379"  # Expose Redis
```

**Security Note:** Only expose these services if absolutely necessary and use strong passwords.

## Reverse Proxy Setup

### Nginx Example

```nginx
server {
    listen 80;
    server_name moss.example.com;

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

### Traefik Example

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.moss.rule=Host(`moss.example.com`)"
  - "traefik.http.routers.moss.entrypoints=websecure"
  - "traefik.http.routers.moss.tls.certresolver=letsencrypt"
  - "traefik.http.services.moss.loadbalancer.server.port=3000"
```

## Troubleshooting

### Check Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis
```

### Access Container Shell

```bash
# Application container
docker compose -f docker-compose.prod.yml exec app sh

# PostgreSQL container
docker compose -f docker-compose.prod.yml exec postgres psql -U moss
```

### Common Issues

#### Image Pull Failures

```bash
# Verify you're authenticated to GHCR
docker login ghcr.io

# Check if the image exists
docker manifest inspect ghcr.io/your-username/moss:latest

# Try pulling with verbose output
docker pull --debug ghcr.io/your-username/moss:latest
```

#### Container Won't Start

```bash
# Check health status
docker inspect moss_app | grep -A 10 Health

# Check environment variables
docker compose -f docker-compose.prod.yml config

# Verify required secrets are set
grep -E "POSTGRES_PASSWORD|REDIS_PASSWORD|NEXTAUTH_SECRET" .env.production
```

#### Database Connection Errors

```bash
# Verify PostgreSQL is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection from app container
docker compose -f docker-compose.prod.yml exec app sh
psql postgresql://moss:$POSTGRES_PASSWORD@postgres:5432/moss
```

## CI/CD Integration

The GitHub Actions workflow automatically builds and publishes images on:

- **Push to main** - Tagged as `latest`
- **Version tags** - Tagged with semantic versions (e.g., `v1.0.0`, `v1.0`, `v1`)
- **Pull requests** - Built but not published (for testing)

### Creating a Release

```bash
# Tag a new version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically build and publish:
# - ghcr.io/your-username/moss:v1.0.0
# - ghcr.io/your-username/moss:v1.0
# - ghcr.io/your-username/moss:v1
# - ghcr.io/your-username/moss:latest (if on main)
```

## Security Considerations

1. **Use Strong Secrets**: Generate secure passwords for `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `NEXTAUTH_SECRET`
2. **Non-root User**: The application runs as user `nextjs` (UID 1001)
3. **Private Networks**: Services communicate via private Docker network
4. **Volume Permissions**: Ensure proper permissions on mounted volumes
5. **HTTPS**: Always use HTTPS in production with a reverse proxy
6. **Regular Updates**: Keep images updated with `docker compose pull`

## Resource Limits

For production deployments, consider adding resource limits:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        cpus: '1'
        memory: 2G
```

## Monitoring

Consider integrating monitoring tools:

- **Prometheus**: Expose metrics endpoint
- **Grafana**: Visualize metrics and logs
- **Uptime Monitoring**: External health check monitoring
- **Log Aggregation**: Send logs to ELK, Loki, or cloud logging

## Support

For issues related to:
- **Docker images**: Check GitHub Actions logs
- **Application bugs**: File an issue on GitHub
- **Deployment help**: Consult this documentation or open a discussion

## Next Steps

- [Configure Reverse Proxy](./reverse-proxy-setup.md)
- [Set up Backups](./backup-restore.md)
- [Configure SAML/SSO](./saml-configuration.md)
- [Monitor Production](./monitoring.md)
