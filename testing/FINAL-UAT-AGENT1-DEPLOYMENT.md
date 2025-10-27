# FINAL UAT - Agent 1: Docker Deployment Testing

**Agent**: Agent 1 (Deployment Infrastructure)
**Focus**: Docker Compose orchestration, setup wizard, production features
**Tools**: Bash, Read
**Duration**: 2 hours
**Tests**: 40
**Priority**: CRITICAL (blocks launch)

---

## Objectives

Verify that M.O.S.S. can be deployed to production using Docker Compose and that the first-run setup wizard successfully initializes the system.

**Success Criteria**:
- ≥95% pass rate (38/40 tests)
- Zero critical or high-severity defects
- Setup wizard completes without errors
- All containers start and remain healthy

---

## Prerequisites

Before starting, ensure:
1. Docker & Docker Compose installed (`docker --version`, `docker compose version`)
2. Clean environment (no running M.O.S.S. containers)
3. Port 3000, 5432, 6379 available
4. Minimum 4GB RAM available

**Clean Start**:
```bash
cd /Users/admin/Dev/moss
docker compose down -v  # Remove containers and volumes
docker system prune -f  # Clean up
rm -rf .next  # Clean build cache
```

---

## Test Scenarios

### TS-D001: Docker Configuration Files

**Objective**: Verify all Docker-related files exist and are valid

#### TS-D001-01: Dockerfile Exists
```bash
test -f Dockerfile && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D001-02: Docker Compose File Exists
```bash
test -f docker-compose.yml && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D001-03: Docker Compose Validates
```bash
docker compose config > /dev/null 2>&1 && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (no syntax errors)
**Result**: _____

#### TS-D001-04: Dockerignore Exists
```bash
test -f .dockerignore && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D001-05: Environment Example Exists
```bash
test -f .env.production.example && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

---

### TS-D002: Environment Configuration

**Objective**: Verify environment variable system works

#### TS-D002-01: Create Production Environment File
```bash
cp .env.production.example .env.production
# Edit required values
sed -i '' 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=test_password_123/' .env.production
sed -i '' 's/REDIS_PASSWORD=.*/REDIS_PASSWORD=test_redis_456/' .env.production
sed -i '' 's/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=test_secret_789/' .env.production

test -f .env.production && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D002-02: Verify Required Variables Set
```bash
grep -q "POSTGRES_PASSWORD=test_password_123" .env.production && \
grep -q "REDIS_PASSWORD=test_redis_456" .env.production && \
grep -q "NEXTAUTH_SECRET=test_secret_789" .env.production && \
echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

---

### TS-D003: PostgreSQL Container

**Objective**: Verify PostgreSQL starts and initializes correctly

#### TS-D003-01: Start PostgreSQL Container
```bash
docker compose up -d postgres
sleep 15  # Wait for initialization
docker compose ps postgres | grep -q "healthy" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (container healthy)
**Result**: _____

#### TS-D003-02: PostgreSQL Accepts Connections
```bash
docker compose exec postgres pg_isready -U moss && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D003-03: Database Created
```bash
docker compose exec postgres psql -U moss -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='moss'" | grep -q 1 && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D003-04: UUID Extension Enabled
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT 1 FROM pg_extension WHERE extname='uuid-ossp'" | grep -q 1 && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D003-05: Migrations Ran Successfully
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT COUNT(*) FROM system_settings" | grep -q "[0-9]" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (system_settings table exists with data)
**Result**: _____

---

### TS-D004: Redis Container

**Objective**: Verify Redis starts and is accessible

#### TS-D004-01: Start Redis Container
```bash
docker compose up -d redis
sleep 5
docker compose ps redis | grep -q "healthy" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D004-02: Redis Accepts Commands
```bash
docker compose exec redis redis-cli -a test_redis_456 PING | grep -q "PONG" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D004-03: Redis Password Protected
```bash
docker compose exec redis redis-cli PING 2>&1 | grep -q "NOAUTH" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (requires password)
**Result**: _____

---

### TS-D005: Application Container

**Objective**: Verify Next.js application builds and starts

#### TS-D005-01: Build Application Image
```bash
docker compose build app && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (build succeeds)
**Result**: _____

#### TS-D005-02: Start Application Container
```bash
docker compose up -d app
sleep 30  # Wait for Next.js to start
docker compose ps app | grep -q "healthy" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (container healthy)
**Result**: _____

#### TS-D005-03: Application Responds
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (200 OK)
**Result**: _____

#### TS-D005-04: Database Health Check
```bash
curl -s http://localhost:3000/api/health/db | grep -q '"status":"healthy"' && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D005-05: Redis Health Check
```bash
curl -s http://localhost:3000/api/health/redis | grep -q '"status":"healthy"' && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (or "not_configured" which is also acceptable)
**Result**: _____

---

### TS-D006: First-Run Setup Wizard

**Objective**: Verify setup wizard completes successfully

#### TS-D006-01: Setup Page Loads
```bash
curl -s http://localhost:3000/setup | grep -q "Welcome to M.O.S.S." && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D006-02: Check Setup Status (Not Completed)
```bash
curl -s http://localhost:3000/api/setup | grep -q '"setupCompleted":false' && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (setup not yet completed)
**Result**: _____

#### TS-D006-03: Complete Setup Wizard
```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "admin@test.com",
    "adminPassword": "TestPassword123",
    "adminPasswordConfirm": "TestPassword123",
    "adminFullName": "Test Administrator",
    "companyName": "Test Company",
    "companyWebsite": "https://test.com",
    "companyAddress": "123 Test St",
    "companyCity": "Test City",
    "companyState": "TS",
    "companyZip": "12345",
    "companyCountry": "Test Country",
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD"
  }' | grep -q '"success":true' && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (setup completes)
**Result**: _____

#### TS-D006-04: Verify Admin User Created
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT COUNT(*) FROM users WHERE email='admin@test.com'" | grep -q "1" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (1 user)
**Result**: _____

#### TS-D006-05: Verify Admin Has Super Admin Role
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT role FROM users WHERE email='admin@test.com'" | grep -q "super_admin" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D006-06: Verify Company Created
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT COUNT(*) FROM companies WHERE company_name='Test Company'" | grep -q "1" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D006-07: Setup Marked Complete
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT value FROM system_settings WHERE key='setup.completed'" | grep -q "true" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

---

### TS-D007: Deployment Scripts

**Objective**: Verify deployment automation scripts exist and are executable

#### TS-D007-01: Init DB Script Exists
```bash
test -x scripts/init-db.sh && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D007-02: Deploy Script Exists
```bash
test -x scripts/deploy.sh && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D007-03: Backup Script Exists
```bash
test -x scripts/backup.sh && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

#### TS-D007-04: Restore Script Exists
```bash
test -x scripts/restore.sh && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

---

### TS-D008: Backup & Restore

**Objective**: Verify database backup and restore functionality

#### TS-D008-01: Create Backup
```bash
./scripts/backup.sh && test -f backups/moss_backup_*.sql.gz && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (backup file created)
**Result**: _____

#### TS-D008-02: Backup File Not Empty
```bash
BACKUP_FILE=$(ls -t backups/moss_backup_*.sql.gz | head -1)
test -s "$BACKUP_FILE" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (file has content)
**Result**: _____

---

### TS-D009: Container Restart Resilience

**Objective**: Verify system survives container restarts

#### TS-D009-01: Restart PostgreSQL
```bash
docker compose restart postgres
sleep 10
docker compose ps postgres | grep -q "healthy" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (comes back healthy)
**Result**: _____

#### TS-D009-02: Data Persists After Postgres Restart
```bash
docker compose exec postgres psql -U moss -d moss -tAc "SELECT COUNT(*) FROM companies WHERE company_name='Test Company'" | grep -q "1" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (data still there)
**Result**: _____

#### TS-D009-03: Restart Application
```bash
docker compose restart app
sleep 30
curl -s http://localhost:3000/api/health | grep -q '"status":"healthy"' && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (app healthy after restart)
**Result**: _____

---

### TS-D010: Logs & Monitoring

**Objective**: Verify logging and monitoring capabilities

#### TS-D010-01: View Application Logs
```bash
docker compose logs app --tail=10 | grep -q "ready" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS (logs accessible)
**Result**: _____

#### TS-D010-02: View PostgreSQL Logs
```bash
docker compose logs postgres --tail=10 | grep -q "database system is ready" && echo "PASS" || echo "FAIL"
```
**Expected**: PASS
**Result**: _____

---

## Summary

**Total Tests**: 40
**Passed**: _____ / 40
**Failed**: _____ / 40
**Pass Rate**: _____ %

**Critical Defects**: _____
**High Defects**: _____
**Medium Defects**: _____
**Low Defects**: _____

---

## Defects Found

[Document defects using format from FINAL-UAT-MASTER-PLAN.md]

---

## Recommendations

**Launch Decision**: GO / CONDITIONAL GO / NO-GO

**Justification**:
[Explain decision based on test results]

**Action Items**:
1. [Item 1]
2. [Item 2]

---

## Evidence

[Attach logs, screenshots, or relevant output here]

---

**Report Date**: _____
**Tested By**: Agent 1
**Environment**: Docker Compose (Production Mode)
**Database**: PostgreSQL 16
**Redis**: Redis 7
