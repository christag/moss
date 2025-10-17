# M.O.S.S. Quick Start Guide

Get M.O.S.S. running in production in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- A server with 4GB RAM minimum
- Domain name (optional but recommended)

## Installation Steps

### 1. Get M.O.S.S.

```bash
git clone https://github.com/yourusername/moss.git
cd moss
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit the file (use nano, vim, or your preferred editor)
nano .env.production
```

**Set these required values:**

```bash
# Generate secure passwords with: openssl rand -base64 32

POSTGRES_PASSWORD=your_secure_database_password_here
REDIS_PASSWORD=your_secure_redis_password_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# Your domain or IP
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000
NEXTAUTH_URL=http://your-server-ip:3000
```

### 3. Start M.O.S.S.

```bash
# Start all services
docker compose up -d

# Wait 30 seconds for initialization
sleep 30

# Check status
docker compose ps
```

You should see three services running (all "healthy"):
- moss_app
- moss_postgres
- moss_redis

### 4. Complete Setup Wizard

Open your browser and navigate to:
```
http://your-server-ip:3000/setup
```

Follow the 5-step wizard:
1. Welcome
2. Create admin account (email + password)
3. Enter company information
4. Set preferences (timezone, date format)
5. Done!

### 5. Start Using M.O.S.S.

After setup completes, you'll be redirected to the login page.

Log in with the admin credentials you just created!

---

## What's Next?

### Add Your First Assets

1. Navigate to **Companies** and verify your organization
2. Go to **Locations** → Add your office locations
3. Go to **Devices** → Start adding equipment
4. Go to **People** → Add your team

### Configure Settings

Visit `/admin` to customize:
- Branding (logo, colors)
- Storage backend (S3, Cloudflare R2)
- Email notifications (SMTP)
- Integrations (Okta, Jamf, etc.)

### Enable HTTPS

**For production, use a reverse proxy:**

**Option 1: Caddy (automatic HTTPS)**
```bash
# Install Caddy
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile

# Add this content:
moss.yourdomain.com {
    reverse_proxy localhost:3000
}

# Restart Caddy
sudo systemctl restart caddy
```

**Option 2: Nginx + Let's Encrypt**
```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d moss.yourdomain.com

# Configure reverse proxy (see DEPLOYMENT.md)
```

---

## Common Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop M.O.S.S.
docker compose down

# Start M.O.S.S.
docker compose up -d

# Backup database
./scripts/backup.sh

# Update M.O.S.S.
git pull
./scripts/deploy.sh
```

---

## Troubleshooting

**Can't access M.O.S.S.?**
```bash
# Check if services are running
docker compose ps

# Check logs for errors
docker compose logs app

# Verify health
curl http://localhost:3000/api/health
```

**Forgot admin password?**
```bash
# Reset password via database
docker compose exec postgres psql -U moss -d moss
# Then run: UPDATE users SET password_hash='...' WHERE email='admin@example.com';
```

**Database errors?**
```bash
# Restart PostgreSQL
docker compose restart postgres

# Check PostgreSQL logs
docker compose logs postgres
```

---

## Getting Help

- **Full Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub Issues**: Report bugs and request features
- **Environment Reference**: See [.env.production.example](.env.production.example)

---

## Production Checklist

Before going live, ensure:

- [ ] Strong passwords set (use `openssl rand -base64 32`)
- [ ] HTTPS enabled (via reverse proxy)
- [ ] Firewall configured (only 80/443 exposed)
- [ ] Backups configured (cron job for `./scripts/backup.sh`)
- [ ] Domain DNS configured
- [ ] Email notifications configured (optional)
- [ ] Cloud storage configured (S3/R2, optional)
- [ ] Admin panel settings reviewed (`/admin`)

---

**Welcome to M.O.S.S.!** 🎉

Your IT asset management system is ready to use.
