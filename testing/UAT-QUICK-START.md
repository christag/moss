# UAT Testing Quick Start Guide

**Purpose**: Step-by-step instructions to execute the comprehensive UAT testing plan for M.O.S.S. MVP.

---

## Prerequisites Checklist

Before starting UAT testing, verify:

- [ ] Development environment running (macOS with container support)
- [ ] PostgreSQL container accessible (moss-postgres)
- [ ] Node.js v18+ installed
- [ ] npm packages installed (`npm install`)
- [ ] Database rebuild script available (`scripts/rebuild-database.js`)
- [ ] Migrations files present (`migrations/002_*.sql`, `migrations/003_*.sql`)
- [ ] All 6 UAT scenario documents reviewed
- [ ] Sufficient disk space for test data and screenshots (~1GB)

---

## Step 1: Environment Setup (15 minutes)

### 1.1 Database Reset

```bash
# Navigate to project directory
cd /Users/admin/Dev/moss

# Stop any running dev server
# (Press Ctrl+C if running)

# Rebuild database from scratch
node scripts/rebuild-database.js
```

**Expected Output**:
```
Connecting to database...
Dropping existing database...
Creating fresh database...
Loading schema from dbsetup.sql...
Loading seed data...
✓ Database rebuilt successfully
```

### 1.2 Run Migrations

```bash
# Migration 002: Authentication
cat migrations/002_add_authentication.sql | container exec -i moss-postgres psql -U moss -d moss

# Migration 003: Admin Settings
cat migrations/003_add_admin_settings.sql | container exec -i moss-postgres psql -U moss -d moss
```

**Expected Output**:
```
CREATE TABLE
INSERT 0 46  # (for system_settings)
CREATE INDEX
...
```

### 1.3 Create Test Users

```bash
# Connect to database
psql -h 192.168.64.2 -U moss -d moss
```

```sql
-- In psql session, create 3 test users with different roles

-- User role (basic access)
INSERT INTO users (id, person_id, username, email, password_hash, role, is_active)
VALUES (
  uuid_generate_v4(),
  NULL,
  'testuser',
  'testuser@moss.local',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: 'password'
  'user',
  true
);

-- Admin role (elevated access)
INSERT INTO users (id, person_id, username, email, password_hash, role, is_active)
VALUES (
  uuid_generate_v4(),
  NULL,
  'testadmin',
  'testadmin@moss.local',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: 'password'
  'admin',
  true
);

-- Super Admin role (full access)
INSERT INTO users (id, person_id, username, email, password_hash, role, is_active)
VALUES (
  uuid_generate_v4(),
  NULL,
  'testsuperadmin',
  'testsuperadmin@moss.local',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: 'password'
  'super_admin',
  true
);

-- Verify users created
SELECT username, email, role FROM users;

-- Exit psql
\q
```

### 1.4 Start Development Server

```bash
# Start Next.js dev server
npm run dev
```

**Expected Output**:
```
> moss@1.0.0 dev
> next dev -p 3001

▲ Next.js 15.0.0
- Local:        http://localhost:3001
- Environments: .env.local

✓ Ready in 2.3s
```

### 1.5 Verify Environment

```bash
# In new terminal window, test health endpoint
curl http://localhost:3001/api/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-11T..."
}
```

```bash
# Verify database connection
psql -h 192.168.64.2 -U moss -d moss -c "SELECT COUNT(*) FROM companies;"
```

**Expected Output**:
```
 count
-------
     7
(1 row)
```

```bash
# Verify container running
container ps | grep moss-postgres
```

**Expected Output**:
```
[container-id]  postgres:15  moss-postgres  Running
```

---

## Step 2: Execute Tests

### Option A: Parallel Execution (Recommended)

**Day 1**: Run Agents 2-6 simultaneously (10 hours wall-clock time)

```bash
# Open 5 terminal windows (one per agent)

# Terminal 1: Agent 2 (API Testing)
claude code # Start new Claude Code session
# Provide Agent 2 instructions and scenario document

# Terminal 2: Agent 3 (Database Testing)
claude code # Start new Claude Code session
# Provide Agent 3 instructions and scenario document

# Terminal 3: Agent 4 (Security Testing)
claude code # Start new Claude Code session
# Provide Agent 4 instructions and scenario document

# Terminal 4: Agent 5 (Integration Testing)
claude code # Start new Claude Code session
# Provide Agent 5 instructions and scenario document

# Terminal 5: Agent 6 (Admin Testing)
claude code # Start new Claude Code session
# Provide Agent 6 instructions and scenario document
```

**Day 2-4**: Run Agent 1 solo (30 hours, can run unattended)

```bash
# Terminal 1: Agent 1 (Playwright UI Testing)
claude code # Start new Claude Code session
# Provide Agent 1 instructions and scenario document
# Can run overnight/weekend with automation
```

### Option B: Sequential Execution

```bash
# Run agents one at a time
# Day 1: Agent 2 (10 hours)
# Day 2: Agent 3 (8 hours)
# Day 3: Agent 4 (6 hours)
# Day 4: Agent 5 (8 hours)
# Day 5: Agent 6 (8 hours)
# Day 6-8: Agent 1 (30 hours)
```

---

## Step 3: Agent Instructions

### For Each Agent

**Provide this context**:

1. **Agent Identity**:
   - "You are [Agent Name]"
   - "Your focus is [focus area]"
   - "Your tools are [tool list]"

2. **Scenario Document**:
   - Agent 1: `UAT-SCENARIOS-AGENT1-PLAYWRIGHT.md`
   - Agent 2: `UAT-SCENARIOS-AGENT2-API.md`
   - Agents 3-6: `UAT-SCENARIOS-AGENTS3-6-SUMMARY.md` (relevant section)

3. **Output Instructions**:
   - "Create output file: `UAT-RESULTS-[AGENT-NAME].md`"
   - "Use the test result template"
   - "Document every test with status, evidence, and notes"
   - "Create defect entries for all failures"

4. **Execution Instructions**:
   - "Execute tests in order"
   - "Capture evidence (screenshots, curl output, SQL results)"
   - "Mark tests as PASS/FAIL/BLOCKED/SKIP"
   - "Document blockers immediately"
   - "Update progress in output file incrementally"

### Agent 1 (Playwright UI) Specific Instructions

```
You are Agent 1: Playwright UI/UX Testing Agent.

Your mission: Test all 16 core object list pages, create forms, detail pages, edit forms,
and delete flows using Playwright MCP tools. Also test navigation, design system compliance,
responsive design, and accessibility.

Tools: Playwright MCP tools ONLY (browser_navigate, browser_snapshot, browser_take_screenshot,
browser_click, browser_type, browser_fill_form, browser_evaluate, browser_resize)

Output file: UAT-RESULTS-PLAYWRIGHT-UI.md

Scenario document: Read UAT-SCENARIOS-AGENT1-PLAYWRIGHT.md for complete test cases.

Execution order:
1. Test Suite 1: List Pages (16 objects × 9 checks)
2. Test Suite 2: Create Forms (16 objects × 8 checks)
3. Test Suite 3: Detail Pages (16 objects × 7 checks)
4. Test Suite 4: Edit Forms (16 objects × 4 checks)
5. Test Suite 5: Delete Flows (16 objects × 4 checks)
6. Test Suite 6: Navigation (10 tests)
7. Test Suite 7: Design System Compliance (25 tests)
8. Test Suite 8: Responsive Design (15 tests)
9. Test Suite 9: Accessibility (20 tests)

For each test:
- Take screenshot as evidence
- Document PASS/FAIL status
- Note any visual issues
- Check design system colors (Morning Blue, Brew Black, Off White)
- Verify responsive breakpoints (320px, 375px, 768px, 1024px, 1280px, 1920px)
- Test accessibility (WCAG AA contrast, keyboard navigation, screen reader)

Begin with Test Suite 1, object 1 (Companies list page).
```

### Agent 2 (API) Specific Instructions

```
You are Agent 2: API/Backend Testing Agent.

Your mission: Test all REST API endpoints for 16 core objects, special endpoints,
admin APIs, junction table APIs, and validation/security.

Tools: Bash (curl), Read (for code inspection)

Output file: UAT-RESULTS-API-BACKEND.md

Scenario document: Read UAT-SCENARIOS-AGENT2-API.md for complete test cases.

Execution order:
1. Test Suite 1: Core Object APIs (16 objects × 21 operations each)
2. Test Suite 2: Special Endpoints (Health, Search, Auth)
3. Test Suite 3: Admin APIs (Settings, Integrations, Audit Logs)
4. Test Suite 4: Junction Table APIs (15 endpoints × 3 operations each)
5. Test Suite 5: Validation & Security (50 tests)

For each test:
- Execute curl command
- Document HTTP status code
- Capture response body (truncate if long)
- Verify response matches expected format
- Test error handling (400, 404, 409, 500)
- Verify Zod validation working
- Test SQL injection prevention
- Measure response time (note if >100ms)

Begin with Test Suite 1, object 1 (Companies API).
```

### Agent 3 (Database) Specific Instructions

```
You are Agent 3: Database Testing Agent.

Your mission: Test database schema, constraints, triggers, cascade behavior,
data integrity, junction tables, and query performance.

Tools: Bash (psql), Read (for schema inspection)

Output file: UAT-RESULTS-DATABASE.md

Scenario document: Read UAT-SCENARIOS-AGENTS3-6-SUMMARY.md (Agent 3 section).

Execution order:
1. Test Suite 1: Schema Validation (40 tables × 3 checks)
2. Test Suite 2: Constraints (50 tests)
3. Test Suite 3: Triggers (10 tests)
4. Test Suite 4: Cascade Behavior (20 tests)
5. Test Suite 5: Data Integrity (30 tests)
6. Test Suite 6: Junction Tables (15 tables × 3 checks)
7. Test Suite 7: Query Performance (20 tests)

For each test:
- Execute SQL query via psql
- Capture query output
- Verify results match expected
- Test constraint enforcement (PRIMARY KEY, FOREIGN KEY, CHECK, NOT NULL, UNIQUE)
- Test cascade deletes and SET NULL behavior
- Measure query performance with \timing
- Use EXPLAIN ANALYZE for performance tests

Connection string: psql -h 192.168.64.2 -U moss -d moss

Begin with Test Suite 1 (Schema Validation).
```

### Agent 4 (Security) Specific Instructions

```
You are Agent 4: Security & Authentication Testing Agent.

Your mission: Test authentication, authorization, role-based access,
admin audit logging, and security best practices.

Tools: Bash (curl), Playwright (for login flows)

Output file: UAT-RESULTS-SECURITY-AUTH.md

Scenario document: Read UAT-SCENARIOS-AGENTS3-6-SUMMARY.md (Agent 4 section).

Test users:
- testuser / password (role: user)
- testadmin / password (role: admin)
- testsuperadmin / password (role: super_admin)

Execution order:
1. Test Suite 1: Authentication System (15 tests)
2. Test Suite 2: Role-Based Access Control (20 tests)
3. Test Suite 3: Middleware Protection (10 tests)
4. Test Suite 4: Admin Audit Logging (10 tests)
5. Test Suite 5: Security Best Practices (25 tests)

For each test:
- Test login/logout flows
- Verify session management
- Test role-based restrictions
- Attempt SQL injection (verify prevention)
- Attempt XSS (verify escaping)
- Verify password hashing (bcrypt)
- Check environment variable security
- Verify CSRF protection
- Test admin action logging

Begin with Test Suite 1 (Authentication System).
```

### Agent 5 (Integration) Specific Instructions

```
You are Agent 5: Integration & Relationships Testing Agent.

Your mission: Test cross-object workflows, data relationships, junction tables,
cascade behavior, and navigation flows.

Tools: Bash (curl), Read (for code inspection)

Output file: UAT-RESULTS-INTEGRATION-RELATIONSHIPS.md

Scenario document: Read UAT-SCENARIOS-AGENTS3-6-SUMMARY.md (Agent 5 section).

Execution order:
1. Test Suite 1: Object Hierarchies (15 tests)
2. Test Suite 2: Junction Table Workflows (40 tests)
3. Test Suite 3: Cross-Object Navigation (20 tests)
4. Test Suite 4: Cascade Behavior (15 tests)
5. Test Suite 5: Orphan Prevention (10 tests)

For each test:
- Create complete relationship chains (Company → Location → Room → Device → Person)
- Test manager hierarchy
- Test parent-child devices
- Test VLAN tagging workflow
- Test software license seat management
- Test document multi-object associations
- Verify cascade deletes
- Verify SET NULL behavior
- Test navigation between related objects

Begin with Test Suite 1 (Object Hierarchies).
```

### Agent 6 (Admin Panel) Specific Instructions

```
You are Agent 6: Admin Panel Testing Agent.

Your mission: Test admin authentication, branding settings, storage configuration,
integrations management, audit logs viewer, and database validation.

Tools: Bash (curl), Playwright (for UI verification)

Output file: UAT-RESULTS-ADMIN-PANEL.md

Scenario document: Read UAT-SCENARIOS-AGENTS3-6-SUMMARY.md (Agent 6 section).

Test users:
- testadmin / password (role: admin) - can access most admin routes
- testsuperadmin / password (role: super_admin) - full access

Execution order:
1. Test Suite 1: Admin Authentication (8 tests)
2. Test Suite 2: Admin Navigation (6 tests)
3. Test Suite 3: Branding Settings (12 tests)
4. Test Suite 4: Storage Configuration (15 tests)
5. Test Suite 5: Integrations Management (20 tests)
6. Test Suite 6: Audit Logs Viewer (12 tests)
7. Test Suite 7: Placeholder Sections (6 tests)
8. Test Suite 8: Database Validation (10 tests)

For each test:
- Test role-based access control
- Test branding settings CRUD (site_name, colors, logo)
- Test storage backend config (Local, S3, NFS, SMB)
- Test integrations CRUD (8 integration types)
- Test audit log viewing and filtering
- Verify placeholder pages accessible
- Verify system_settings table updated
- Verify admin_audit_log entries created

Begin with Test Suite 1 (Admin Authentication).
```

---

## Step 4: Monitoring Progress

### Check Agent Progress

Each agent should update their output file incrementally:

```bash
# Check Agent 1 progress
cat UAT-RESULTS-PLAYWRIGHT-UI.md | grep "Status:"

# Check Agent 2 progress
cat UAT-RESULTS-API-BACKEND.md | grep "Status:"

# Check all agents
for file in UAT-RESULTS-*.md; do
  echo "=== $file ==="
  grep -A 2 "## Test Summary" $file 2>/dev/null || echo "Not started"
done
```

### Monitor Test Execution

```bash
# Watch test files being created
watch -n 10 'ls -lh UAT-RESULTS-*.md'

# Watch for new defects
watch -n 10 'grep -h "^### DEF-UAT-" UAT-RESULTS-*.md | sort -u | wc -l'

# Watch pass rates
for file in UAT-RESULTS-*.md; do
  echo "=== $file ==="
  grep "Pass Rate:" $file 2>/dev/null || echo "In progress"
done
```

---

## Step 5: Compilation & Reporting

### After All Agents Complete

**Collect all result files**:
```bash
ls -lh UAT-RESULTS-*.md
```

Should see 6 files:
- UAT-RESULTS-PLAYWRIGHT-UI.md
- UAT-RESULTS-API-BACKEND.md
- UAT-RESULTS-DATABASE.md
- UAT-RESULTS-SECURITY-AUTH.md
- UAT-RESULTS-INTEGRATION-RELATIONSHIPS.md
- UAT-RESULTS-ADMIN-PANEL.md

### Create Master UAT Report

```bash
# Create master report file
touch UAT-MASTER-REPORT.md
```

**Master Report Structure**:
```markdown
# M.O.S.S. MVP - Master UAT Report

**Date**: 2025-10-11
**Testing Period**: [Start] to [End]
**Total Test Duration**: [Hours]

---

## Executive Summary

### Overall Results
- **Total Tests Executed**: [N]
- **Passed**: [N] ([%])
- **Failed**: [N] ([%])
- **Blocked**: [N] ([%])
- **Skipped**: [N] ([%])

**Pass Rate**: [%] (Target: ≥85%)

### Defects Summary
- **Critical (P0)**: [N] (Target: 0)
- **High (P1)**: [N] (Target: ≤5)
- **Medium (P2)**: [N]
- **Low (P3)**: [N]

**Total Defects**: [N]

---

## Agent Results

### Agent 1: Playwright UI/UX Testing
- **Tests Executed**: [N]
- **Pass Rate**: [%]
- **Defects Found**: [N]
- **Status**: [Complete/In Progress]

[Summary of key findings]

### Agent 2: API/Backend Testing
- **Tests Executed**: [N]
- **Pass Rate**: [%]
- **Defects Found**: [N]
- **Status**: [Complete/In Progress]

[Summary of key findings]

### [Repeat for Agents 3-6]

---

## Defects by Severity

### Critical Defects (P0)
[List all DEF-UAT-XXX with severity=Critical]

### High Defects (P1)
[List all DEF-UAT-XXX with severity=High]

### [Repeat for Medium and Low]

---

## Defects by Feature Area

### Core Objects (Companies, Locations, etc.)
[Group defects by affected object type]

### Authentication & Security
[Group security-related defects]

### Admin Panel
[Group admin-related defects]

### [Other feature areas]

---

## Common Themes

[Identify patterns in defects, e.g.:]
- Null handling issues
- Validation inconsistencies
- Design system color mismatches
- Performance issues on large datasets

---

## Performance Observations

[Summarize any performance issues]
- Slow queries (>100ms)
- Long page load times
- High memory usage

---

## Recommendations

### Immediate Actions (Pre-Release)
1. Fix all Critical (P0) defects
2. Fix High (P1) defects
3. [Other critical items]

### Short-Term Actions (Next Sprint)
1. Fix Medium (P2) defects
2. Address performance issues
3. [Other items]

### Long-Term Actions (Future Releases)
1. Fix Low (P3) defects
2. Implement suggested enhancements
3. [Other items]

---

## Remediation Plan

[List of defects to fix, prioritized]

| Defect ID | Severity | Effort | Priority | Sprint |
|-----------|----------|--------|----------|--------|
| DEF-UAT-001 | Critical | 4h | 1 | Current |
| DEF-UAT-002 | High | 2h | 2 | Current |
| [etc.] | | | | |

---

## Regression Testing Plan

After remediation:
1. Re-run all failed tests
2. Smoke test related features
3. Verify no new regressions introduced
4. Update documentation

---

## Sign-Off

- [ ] All tests executed
- [ ] All defects documented
- [ ] Remediation plan created
- [ ] Stakeholders notified

**QA Lead**: _________________________
**Date**: _________________________

**Product Owner**: _________________________
**Date**: _________________________

---

**END OF MASTER UAT REPORT**
```

---

## Step 6: Defect Management

### Create GitHub Issues

For each defect discovered:

```bash
# Create GitHub issue (via gh CLI or web interface)
gh issue create \
  --title "DEF-UAT-001: [Defect Title]" \
  --body "**Severity**: Critical
**Affected Feature**: [Feature]
**Test Case**: TC-XXX-XXX

**Steps to Reproduce**:
1. Step 1
2. Step 2

**Expected**: [Expected behavior]
**Actual**: [Actual behavior]

**Evidence**: [Link to screenshot or log]

**Suggested Fix**: [If known]" \
  --label "bug,uat,P0"
```

### Defect Labels

Use consistent labels:
- `bug` = Defect found during testing
- `uat` = Found during UAT phase
- `P0` = Critical severity
- `P1` = High severity
- `P2` = Medium severity
- `P3` = Low severity
- `[feature-area]` = e.g., `api`, `ui`, `database`, `security`, `admin`

---

## Step 7: Cleanup

### After Testing Complete

```bash
# Optional: Clean up test data
psql -h 192.168.64.2 -U moss -d moss -c "DELETE FROM companies WHERE company_name LIKE 'UAT%' OR company_name LIKE 'TEST%';"
psql -h 192.168.64.2 -U moss -d moss -c "DELETE FROM people WHERE full_name LIKE 'UAT%' OR full_name LIKE 'Test%';"
# Repeat for other test objects

# OR: Full database rebuild for clean state
node scripts/rebuild-database.js
```

### Archive Test Results

```bash
# Create archive directory
mkdir -p uat-results-2025-10-11

# Move result files to archive
mv UAT-RESULTS-*.md uat-results-2025-10-11/
mv UAT-MASTER-REPORT.md uat-results-2025-10-11/

# Create tarball
tar -czf uat-results-2025-10-11.tar.gz uat-results-2025-10-11/

# Optional: Upload to cloud storage or commit to repo
```

---

## Troubleshooting

### Issue: Database connection fails

```bash
# Check container status
container ps | grep moss-postgres

# Restart container if needed
container restart moss-postgres

# Wait 10 seconds
sleep 10

# Test connection
psql -h 192.168.64.2 -U moss -d moss -c "SELECT 1;"
```

### Issue: Dev server not starting

```bash
# Check port 3001 not in use
lsof -i :3001

# Kill process if needed
kill -9 [PID]

# Start server again
npm run dev
```

### Issue: Playwright not working

```bash
# Install Playwright browsers (if needed)
npx playwright install chromium

# Verify Playwright MCP connection
# (This is handled by Claude Code automatically)
```

### Issue: Agent stuck or blocked

1. Check agent output file for blockers
2. Review error messages
3. Address blocker (e.g., fix database, restart server)
4. Resume agent from last completed test

---

## Quick Reference Card

### Key Commands

| Action | Command |
|--------|---------|
| Rebuild DB | `node scripts/rebuild-database.js` |
| Run migration | `cat migrations/XXX.sql \| container exec -i moss-postgres psql -U moss -d moss` |
| Start server | `npm run dev` |
| DB connection | `psql -h 192.168.64.2 -U moss -d moss` |
| Health check | `curl http://localhost:3001/api/health` |
| Check containers | `container ps` |

### Key Files

| File | Purpose |
|------|---------|
| `UAT-TEST-PLAN.md` | Master test plan |
| `UAT-SCENARIOS-AGENT1-PLAYWRIGHT.md` | Agent 1 scenarios |
| `UAT-SCENARIOS-AGENT2-API.md` | Agent 2 scenarios |
| `UAT-SCENARIOS-AGENTS3-6-SUMMARY.md` | Agents 3-6 scenarios |
| `UAT-EXECUTION-SUMMARY.md` | Execution overview |
| `UAT-QUICK-START.md` | This file |

### Test Users

| Username | Password | Role | Access |
|----------|----------|------|--------|
| testuser | password | user | Basic access |
| testadmin | password | admin | Admin panel (most sections) |
| testsuperadmin | password | super_admin | Full admin access |

### Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3001 | Application home |
| http://localhost:3001/api/health | Health check |
| http://localhost:3001/admin | Admin panel |
| http://localhost:3001/login | Login page |

---

## Success Checklist

- [ ] Environment setup complete (Step 1)
- [ ] Test users created
- [ ] Dev server running
- [ ] Health check passing
- [ ] Agent 1 (Playwright) executed
- [ ] Agent 2 (API) executed
- [ ] Agent 3 (Database) executed
- [ ] Agent 4 (Security) executed
- [ ] Agent 5 (Integration) executed
- [ ] Agent 6 (Admin) executed
- [ ] 6 result files created
- [ ] Master UAT report compiled
- [ ] Defects documented
- [ ] GitHub issues created
- [ ] Remediation plan created
- [ ] Stakeholders notified

---

**Ready to begin UAT testing!**

Start with Step 1 (Environment Setup) and proceed sequentially through the steps.

**Questions or Issues**: Refer to Troubleshooting section or UAT-EXECUTION-SUMMARY.md

---

**Last Updated**: 2025-10-11
**Version**: 1.0
