# Docker Quick Start Guide

## 🚀 Deploy M.O.S.S. in 3 Steps

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/moss.git
cd moss
cp .env.production.example .env.production
```

Edit `.env.production` and set:
- `GITHUB_REPOSITORY=your-username/moss`
- `POSTGRES_PASSWORD=your-secure-password`
- `REDIS_PASSWORD=your-secure-password`
- `NEXTAUTH_SECRET=your-secure-secret`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- `NEXTAUTH_URL=https://your-domain.com`

**Generate secrets:**
```bash
# Generate passwords
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

### 2. Pull & Start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3. Access & Setup

Visit `http://localhost:3000` (or your domain) and complete the setup wizard.

---

## 📋 Common Commands

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Stop Services
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart Application
```bash
docker compose -f docker-compose.prod.yml restart app
```

### Upgrade to Latest
```bash
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d app
```

### Upgrade to Specific Version
```bash
# Edit .env.production and set IMAGE_TAG=v1.0.0
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d app
```

### Backup Database
```bash
docker exec moss_postgres pg_dump -U moss moss > backup-$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker exec -i moss_postgres psql -U moss moss < backup-20250113.sql
```

---

## 🔐 GitHub Container Registry Access

### For Public Repositories
No authentication needed!

### For Private Repositories
```bash
# Create a Personal Access Token with 'read:packages' scope at:
# https://github.com/settings/tokens

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR-USERNAME --password-stdin
```

---

## 🏷️ Available Image Tags

- `latest` - Latest stable build from main branch
- `v1.0.0` - Specific version
- `v1.0` - Latest patch of minor version
- `v1` - Latest minor of major version
- `main-abc1234` - Specific commit SHA

---

## 🔧 Troubleshooting

### Check Container Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Check Health
```bash
docker inspect moss_app | grep Health -A 5
```

### Access Container Shell
```bash
docker compose -f docker-compose.prod.yml exec app sh
```

### Database Connection Test
```bash
docker compose -f docker-compose.prod.yml exec app sh
psql postgresql://moss:$POSTGRES_PASSWORD@postgres:5432/moss
```

---

## 📚 Full Documentation

For complete deployment instructions, see:
- [Full Docker Deployment Guide](docs/docker-deployment.md)
- [Main README](README.md)

## 🆘 Getting Help

- File an issue: https://github.com/your-username/moss/issues
- Discussions: https://github.com/your-username/moss/discussions
