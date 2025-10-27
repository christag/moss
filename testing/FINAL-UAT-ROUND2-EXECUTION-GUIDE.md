# M.O.S.S. Final UAT Round 2 - Execution Guide

**Date Created**: October 12, 2025
**UAT Version**: 2.1 (Second Full Testing Round)
**Previous Round**: October 12, 2025 - NO-GO (0-96% pass rates, critical blockers)
**Purpose**: Re-test after critical blocker remediation

---

## Executive Summary

This guide coordinates the **second complete UAT round** after addressing critical blockers identified in Round 1:

**Round 1 Results (Oct 12, 2025)**:
- Agent 1: SKIPPED (Docker unavailable)
- Agent 2: 0% execution (setup wizard blocked routes)
- Agent 3: 48% pass (XSS vulnerability, POST endpoints broken)
- Agent 4: 96% pass (database excellent)
- Agent 5: 84% pass (accessibility good)
- Agent 6: 83% pass (design good)

**Decision**: NO-GO - Critical blockers present

**Round 2 Focus**:
1. Verify critical blockers resolved (XSS, POST endpoints, setup wizard)
2. Complete Frontend UI testing (120 tests previously blocked)
3. Validate API regressions fully fixed
4. Confirm database/performance maintained
5. Re-assess accessibility and design

---

## Pre-Testing Checklist

### ✅ Critical Blockers Must Be Resolved

Before starting Round 2, verify these fixes are in place:

- [ ] **XSS Vulnerability Fixed** [DEF-FINAL-A3-004]
  - Test: POST company with `<script>alert(1)</script>` - should be sanitized

- [ ] **POST Endpoints Working** [DEF-FINAL-A3-006, A3-007]
  - Test: POST to /api/devices, /api/documents, /api/external-documents
  - Expected: 201 Created, not 400/500

- [ ] **Rate Limiting Implemented** [DEF-FINAL-A3-003]
  - Test: Send 100 requests to /api/companies in 10 seconds
  - Expected: 429 Too Many Requests after threshold

- [ ] **Setup Wizard Bypass Available** [DEF-FINAL-AG2-001]
  - Option A: Setup completed with test credentials documented
  - Option B: Setup wizard can be skipped for testing

- [ ] **Test User Credentials Documented** [DEF-FINAL-AG2-002]
  - Email: _______________________
  - Password: _______________________
  - Role: super_admin or admin

### 🗄️ Environment Preparation

```bash
# 1. Navigate to project root
cd /Users/admin/Dev/moss

# 2. Check running processes
lsof -ti:3000 -ti:5432 -ti:6379

# 3. Stop running services (if needed)
# Kill Next.js dev servers if running
pkill -f "next dev"

# 4. Clean build cache
rm -rf .next

# 5. Start PostgreSQL (if not running)
# Verify with: psql -h localhost -U postgres -d moss -c "SELECT 1"

# 6. Verify database migrations
PGPASSWORD=postgres psql -h localhost -U postgres -d moss -c "\dt"
# Expected: All tables present (companies, devices, users, etc.)

# 7. Seed test data (minimal set for consistency)
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name":"UAT Test Company","website":"https://test-uat.com"}'

# Save the returned company ID for use in other tests
export UAT_COMPANY_ID="<uuid-from-response>"

# 8. Start development server
npm run dev
# Wait for "ready on http://localhost:3000"

# 9. Verify health
curl http://localhost:3000/api/health
# Expected: {"status":"healthy"}

curl http://localhost:3000/api/health/db
# Expected: {"status":"healthy"}
```

---

## Phase 1: Critical Path Testing (Parallel Execution)

**Duration**: 3 hours (all agents run simultaneously)
**Priority**: CRITICAL - Must pass for launch

### Terminal 1: Agent 2 - Frontend UI Testing

**Agent**: Agent 2 (Frontend/Playwright)
**Tests**: 120 (16 objects × 7 tests)
**Duration**: 3 hours
**Success Criteria**: ≥95% pass (114/120 tests), zero critical defects

**Command**:
```bash
# Open new terminal window
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 2**:
```
Execute FINAL UAT Round 2 - Agent 2: Frontend UI Testing

CRITICAL CONTEXT:
- Previous round: 0/120 tests executed (setup wizard blocked all routes)
- This round: Setup wizard issue MUST be resolved
- Focus: Comprehensive CRUD testing via Playwright

INSTRUCTIONS:
1. Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md (Agent 2 section)

2. Environment Verification (5 minutes):
   - Navigate to http://localhost:3000
   - Verify NO redirect to /setup (blocker from Round 1)
   - If redirected: STOP and report DEF-ROUND2-AG2-001 CRITICAL
   - Login with test credentials (documented in environment)
   - Take screenshot of successful login

3. Test All 16 Objects (2.5 hours):
   For each object (Companies, Locations, Rooms, People, Devices, Groups,
   Networks, IOs, IP Addresses, Software, SaaS Services, Installed Apps,
   Licenses, Documents, External Docs, Contracts):

   a. List Page Test:
      - Navigate to list page
      - Take screenshot
      - Verify table renders with columns
      - Verify search box present
      - Test search functionality
      - Verify "Add New" button present

   b. Create Form Test:
      - Click "Add New"
      - Take screenshot of blank form
      - Fill all required fields with test data
      - Submit form
      - Verify success message or redirect
      - Verify new record appears in list

   c. Detail Page Test:
      - Click created record link
      - Take screenshot
      - Verify all fields display correctly
      - Verify tabs present (Overview, relationships, History)
      - Verify Edit and Delete buttons present

   d. Edit Form Test:
      - Click Edit button
      - Verify form pre-populated
      - Modify one field
      - Submit
      - Verify update successful

   e. Delete Flow Test:
      - Click Delete button
      - Verify confirmation dialog
      - Confirm deletion
      - Verify redirect to list
      - Verify record no longer in list

   f. Relationship Tab Test:
      - Create/navigate to object with relationships
      - Click relationship tab
      - Verify related items display

   g. Empty State Test:
      - Navigate to object with no related items
      - Verify empty state message
      - Verify "Add New" button in empty state

4. Use Playwright MCP Tools:
   - mcp__playwright__browser_navigate for navigation
   - mcp__playwright__browser_take_screenshot for evidence
   - mcp__playwright__browser_snapshot for accessibility snapshot
   - mcp__playwright__browser_click for interactions
   - mcp__playwright__browser_type for form filling
   - mcp__playwright__browser_fill_form for multi-field forms

5. Document Results (30 minutes):
   - Create testing/FINAL-UAT-RESULTS-AGENT2-ROUND2.md
   - Use template from FINAL-UAT-RESULTS-TEMPLATE.md
   - Include all screenshots
   - Document all defects found
   - Calculate pass rate
   - Provide GO/NO-GO recommendation

SUCCESS CRITERIA:
- ≥95% pass rate (114/120 tests)
- Zero CRITICAL defects
- ≤2 HIGH defects
- All CRUD workflows functional

CRITICAL: If setup wizard blocks testing again, STOP immediately and report.
```

---

### Terminal 2: Agent 3 - API Regression Testing

**Agent**: Agent 3 (API/Backend)
**Tests**: 60 (10 regressions + 50 core API)
**Duration**: 2 hours
**Success Criteria**: 100% regression pass, ≥90% core API pass

**Command**:
```bash
# Open new terminal window
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 3**:
```
Execute FINAL UAT Round 2 - Agent 3: API Regression Testing

CRITICAL CONTEXT:
- Previous round: 48% pass (29/60 tests)
- Critical issues: XSS vulnerability, 14/16 POST endpoints broken, no rate limiting
- This round: ALL critical issues MUST be fixed

INSTRUCTIONS:
1. Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md (Agent 3 section)

2. Category 1: Defect Regression Testing (10 tests) - MUST PASS 100%
   Test each of the 10 remediated defects from Oct 11 UAT:

   a. DEF-UAT-API-001: Null values accepted
      curl -X POST http://localhost:3000/api/companies \
        -H "Content-Type: application/json" \
        -d '{"company_name":"Test","website":null}'
      Expected: 200/201 success

   b. DEF-UAT-API-002: Invalid JSON returns 400
      curl -X POST http://localhost:3000/api/companies \
        -H "Content-Type: application/json" \
        -d '{invalid json}'
      Expected: 400 Bad Request

   c. **DEF-FINAL-A3-004: XSS Vulnerability (NEW - CRITICAL)**
      curl -X POST http://localhost:3000/api/companies \
        -H "Content-Type: application/json" \
        -d '{"company_name":"<script>alert(1)</script>"}'
      Expected: Script tags sanitized/escaped, NOT stored raw
      Then GET the company and verify no <script> in response

   d. **DEF-FINAL-A3-003: Rate Limiting (NEW - CRITICAL)**
      for i in {1..100}; do
        curl -s http://localhost:3000/api/companies > /dev/null
      done
      Expected: 429 Too Many Requests after threshold

   e-j. Continue for remaining defects...

3. Category 2: Core API Functionality (50 tests)
   Focus on POST endpoints (14/16 were broken in Round 1):

   For each of 16 objects:
   a. GET /api/[object] (list)
      Expected: 200 OK, JSON array

   b. **POST /api/[object] (create) - CRITICAL**
      Use minimal valid schema:
      - Companies: {"company_name":"Test","website":"https://test.com"}
      - Devices: {"hostname":"test-device","company_id":"<uuid>"}
      - Documents: {"title":"Test Doc","doc_type":"policy"}
      - External Documents: {"title":"Test","url":"https://test.com","source":"other"}
      - Continue for all 16...
      Expected: 201 Created, NOT 400/500

   c. GET /api/[object]/[id] (single)
      Expected: 200 OK, JSON object

   d. DELETE /api/[object]/[id]
      Expected: 200 OK (only test if POST succeeded)

4. Security Testing (2 tests):
   a. SQL Injection Prevention:
      curl "http://localhost:3000/api/companies?search='; DROP TABLE companies--"
      Expected: No error, query sanitized

   b. XSS Prevention (already tested above)

5. Use Bash Tool (curl) for all API calls
   - Capture full responses
   - Check HTTP status codes
   - Verify response bodies
   - Time responses (should be <2s)

6. Document Results:
   - Create testing/FINAL-UAT-RESULTS-AGENT3-ROUND2.md
   - Category 1: MUST show 10/10 pass
   - Category 2: MUST show ≥45/50 pass
   - Document any new defects found
   - Compare to Round 1 results

SUCCESS CRITERIA:
- Category 1 (Regression): 100% pass (10/10)
- Category 2 (Core API): ≥90% pass (45/50)
- XSS vulnerability FIXED
- POST endpoints WORKING
- Rate limiting IMPLEMENTED

CRITICAL: Any regression from Round 1 is a NO-GO blocker.
```

---

### Terminal 3: Agent 4 - Database & Performance Testing

**Agent**: Agent 4 (Database/Performance)
**Tests**: 50 (20 load + 15 integrity + 15 health)
**Duration**: 2 hours
**Success Criteria**: ≥95% pass (48/50), all queries <2s

**Command**:
```bash
# Open new terminal window
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 4**:
```
Execute FINAL UAT Round 2 - Agent 4: Database & Performance Testing

CONTEXT:
- Previous round: 96% pass (48/50 tests) - EXCELLENT
- This round: Maintain or improve performance

INSTRUCTIONS:
1. Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md (Agent 4 section)

2. Category 1: Load Testing (20 tests)
   a. Create 1000 devices:
      for i in {1..1000}; do
        curl -X POST http://localhost:3000/api/devices \
          -H "Content-Type: application/json" \
          -d "{\"hostname\":\"uat-device-$i\",\"company_id\":\"$UAT_COMPANY_ID\"}"
      done

   b. Query performance with 1000 records:
      time curl -s "http://localhost:3000/api/devices?limit=50"
      Expected: <2 seconds

   c. Search performance:
      time curl -s "http://localhost:3000/api/devices?search=device-500"
      Expected: <1 second

   d. Complex JOIN performance:
      time curl -s "http://localhost:3000/api/devices/[id]"
      Expected: <2 seconds (includes company, location, IOs, etc.)

   e. Repeat for other objects:
      - 500 people
      - 100 networks
      - 200 software licenses

3. Category 2: Data Integrity (15 tests)
   a. Foreign key enforcement:
      curl -X POST http://localhost:3000/api/devices \
        -H "Content-Type: application/json" \
        -d '{"hostname":"test","company_id":"00000000-0000-0000-0000-000000000000"}'
      Expected: 400/500 error (invalid FK)

   b. UNIQUE constraint:
      Create device with hostname "test-unique"
      Try to create another with same hostname
      Expected: Error (duplicate)

   c. CASCADE delete:
      Delete company with devices
      Verify: Devices also deleted (if CASCADE) or error (if RESTRICT)

4. Category 3: Database Health (15 tests)
   a. Index usage:
      PGPASSWORD=postgres psql -h localhost -U postgres -d moss -c \
        "EXPLAIN ANALYZE SELECT * FROM devices WHERE hostname='device-500'"
      Expected: Uses idx_devices_hostname

   b. Connection pool:
      PGPASSWORD=postgres psql -h localhost -U postgres -d moss -c \
        "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='moss'"
      Expected: <20 active connections

   c. Table sizes:
      PGPASSWORD=postgres psql -h localhost -U postgres -d moss -c \
        "SELECT pg_size_pretty(pg_total_relation_size('devices'))"
      Expected: Reasonable size for 1000 records

   d. Query plan optimization:
      Test complex queries with EXPLAIN ANALYZE
      Verify: No sequential scans on large tables

5. Use Bash Tool for all commands:
   - psql for database queries
   - curl for API load testing
   - time command for performance measurement

6. Document Results:
   - Create testing/FINAL-UAT-RESULTS-AGENT4-ROUND2.md
   - Include performance metrics table
   - Compare to Round 1 (should maintain 96% pass)
   - Document any performance regressions

SUCCESS CRITERIA:
- ≥95% pass (48/50 tests)
- 100% of queries <2s with 1000+ records
- All constraints enforced
- No connection pool exhaustion

TARGET: Match or exceed Round 1 performance (96% pass).
```

---

## Phase 2: Deployment Testing (Optional)

**Duration**: 2 hours
**Priority**: MEDIUM (only if Docker available)

### Terminal 4: Agent 1 - Docker Deployment

**Agent**: Agent 1 (Deployment)
**Tests**: 40 (Docker + setup wizard)
**Duration**: 2 hours
**Success Criteria**: ≥95% pass, setup wizard functional

**Note**: Skip if Docker not available on macOS (use `container` command instead).

**Command**:
```bash
# Open new terminal window
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 1**:
```
Execute FINAL UAT Round 2 - Agent 1: Docker Deployment Testing

CONTEXT:
- Previous round: SKIPPED (Docker not available on macOS)
- This round: Test if available, otherwise skip again

INSTRUCTIONS:
1. Check Docker availability:
   docker --version || container --version
   If neither available: SKIP and document

2. If available, read testing/FINAL-UAT-AGENT1-DEPLOYMENT.md

3. Test all 40 scenarios:
   - Docker configuration files
   - Environment setup
   - PostgreSQL container
   - Redis container
   - Application container
   - Setup wizard (critical from Round 1)
   - Backup/restore scripts
   - Container restart resilience
   - Logs & monitoring

4. Document results in testing/FINAL-UAT-RESULTS-AGENT1-ROUND2.md

If SKIPPED: Create minimal report explaining Docker unavailable.
```

---

## Phase 3: Quality Gates (Parallel Execution)

**Duration**: 2 hours (both agents run simultaneously)
**Priority**: MEDIUM (non-blocking, quality metrics)

### Terminal 5: Agent 5 - Accessibility Testing

**Agent**: Agent 5 (Accessibility)
**Tests**: 50 (WCAG 2.1 AA compliance)
**Duration**: 2 hours
**Success Criteria**: ≥85% pass

**Command**:
```bash
# Open new terminal window (after Phase 1 completes)
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 5**:
```
Execute FINAL UAT Round 2 - Agent 5: Accessibility Testing

CONTEXT:
- Previous round: 84% pass (42/50 tests) - Good foundation
- This round: Maintain or improve

INSTRUCTIONS:
1. Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md (Agent 5 section)

2. Test WCAG 2.1 AA Compliance (50 tests):

   a. Keyboard Navigation (15 tests):
      - Tab through all interactive elements
      - Verify focus indicators visible
      - Enter to activate buttons/links
      - Escape to close modals
      - Arrow keys in dropdowns

   b. Screen Reader Support (15 tests):
      - ARIA labels on buttons
      - Form label associations
      - Heading hierarchy (H1-H6)
      - Alt text on images
      - Role attributes correct

   c. Color Contrast (10 tests):
      - Text: ≥4.5:1 contrast ratio
      - UI elements: ≥3:1 contrast ratio
      - Links distinguishable
      - Form field borders visible

   d. Alternative Text (10 tests):
      - Images have alt text
      - Decorative images have empty alt
      - Icons have ARIA labels
      - Complex images have long descriptions

3. Use Playwright MCP for testing:
   - browser_snapshot for accessibility tree
   - browser_evaluate for color contrast calculations
   - keyboard navigation via press_key

4. Document results in testing/FINAL-UAT-RESULTS-AGENT5-ROUND2.md

SUCCESS CRITERIA:
- ≥85% pass (43/50 tests)
- Non-blocking: Failures inform backlog

TARGET: Maintain or exceed Round 1 (84% pass).
```

---

### Terminal 6: Agent 6 - Design Compliance Testing

**Agent**: Agent 6 (Design System)
**Tests**: 30 (color, typography, layout)
**Duration**: 1.5 hours
**Success Criteria**: ≥90% pass

**Command**:
```bash
# Open new terminal window (after Phase 1 completes)
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt to Agent 6**:
```
Execute FINAL UAT Round 2 - Agent 6: Design Compliance Testing

CONTEXT:
- Previous round: 83% pass (25/30 tests) - Good adherence
- This round: Maintain or improve

INSTRUCTIONS:
1. Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md (Agent 6 section)
2. Read planning/designguides.md for official design system

3. Test Design System Compliance (30 tests):

   a. Color Palette (10 tests):
      Primary colors dominant:
      - Morning Blue (#1C7FF2)
      - Brew Black (#231F20)
      - Off White (#FAF9F5)

      Secondary colors accents only:
      - Green (#28C077), Lime (#BCF46E)
      - Light Blue (#ACD7FF)
      - Orange (#FD6A3D), Tangerine (#FFBB5C)

      No arbitrary colors

   b. Typography (10 tests):
      - Font family: Inter (all text)
      - Base font size: 18px
      - Type scale: 1.25 ratio
      - Heading sizes: H1 (57.6px), H2 (46px), H3 (36.8px)
      - Consistent line heights

   c. Layout (10 tests):
      - Grid alignment
      - Margin: 1/4 column width
      - Gutter: 1/2 margin
      - Responsive breakpoints work
      - Mobile, tablet, desktop layouts

4. Use Playwright MCP:
   - browser_evaluate for computed styles
   - browser_resize for responsive testing
   - browser_take_screenshot for visual evidence

5. Document results in testing/FINAL-UAT-RESULTS-AGENT6-ROUND2.md

SUCCESS CRITERIA:
- ≥90% pass (27/30 tests)
- Non-blocking: Failures inform polish backlog

TARGET: Improve on Round 1 (83% → 90% pass).
```

---

## Phase 4: Results Consolidation

**Duration**: 1 hour
**Priority**: CRITICAL

### Final Terminal: Master Results Compilation

**Command**:
```bash
# Open new terminal window (after all agents complete)
cd /Users/admin/Dev/moss

# Launch Claude Code
claude-code
```

**Prompt**:
```
Consolidate FINAL UAT Round 2 Results

INSTRUCTIONS:
1. Read all Round 2 result files:
   - testing/FINAL-UAT-RESULTS-AGENT1-ROUND2.md (if exists)
   - testing/FINAL-UAT-RESULTS-AGENT2-ROUND2.md
   - testing/FINAL-UAT-RESULTS-AGENT3-ROUND2.md
   - testing/FINAL-UAT-RESULTS-AGENT4-ROUND2.md
   - testing/FINAL-UAT-RESULTS-AGENT5-ROUND2.md
   - testing/FINAL-UAT-RESULTS-AGENT6-ROUND2.md

2. Read Round 1 master results for comparison:
   - testing/FINAL-UAT-MASTER-RESULTS.md

3. Create testing/FINAL-UAT-MASTER-RESULTS-ROUND2.md with:

   a. Executive Summary:
      - Overall pass rate (weighted by priority)
      - Total tests executed
      - Defects by severity
      - Launch recommendation (GO/CONDITIONAL GO/NO-GO)

   b. Results by Agent (Comparison Table):
      | Agent | Round 1 Pass Rate | Round 2 Pass Rate | Change | Status |
      |-------|-------------------|-------------------|--------|--------|
      | Agent 1 | SKIPPED | X% | - | ✅/❌ |
      | Agent 2 | 0% | X% | +X pts | ✅/❌ |
      | Agent 3 | 48% | X% | +X pts | ✅/❌ |
      | Agent 4 | 96% | X% | +X pts | ✅/❌ |
      | Agent 5 | 84% | X% | +X pts | ✅/❌ |
      | Agent 6 | 83% | X% | +X pts | ✅/❌ |

   c. Defects Consolidated:
      - All CRITICAL defects (grouped)
      - All HIGH defects (grouped)
      - Medium/Low summary
      - Defects resolved from Round 1
      - New defects introduced in Round 2

   d. Production Readiness Score (0-100%):
      Formula: (Critical Path Pass Rate × 0.7) + (Quality Gates × 0.3)
      - Agents 2-4: 70% weight
      - Agents 5-6: 30% weight

   e. Launch Decision:
      ✅ GO if:
         - Agents 2-4: ≥95% pass each
         - Zero CRITICAL defects
         - ≤2 HIGH defects with mitigation
         - Agent 3: 100% regression pass

      ⚠️ CONDITIONAL GO if:
         - Agents 2-4: 90-94% pass
         - Zero CRITICAL defects
         - ≤5 HIGH defects with mitigation plans

      ❌ NO-GO if:
         - Any CRITICAL defect present
         - Any agent <90% pass
         - Agent 3: Any regression (<100%)
         - Agent 4: Queries >5s

   f. Key Improvements from Round 1:
      - List all fixed blockers
      - Performance improvements
      - New features tested

   g. Remaining Issues:
      - Defects requiring remediation
      - Post-launch backlog items

   h. Action Items:
      - Before Launch (if CONDITIONAL GO)
      - Post-Launch improvements
      - Monitoring recommendations

4. Format report professionally with:
   - Clear executive summary at top
   - Visual indicators (✅❌⚠️)
   - Data tables
   - Evidence references
   - Actionable recommendations

SUCCESS CRITERIA:
This report will drive the final GO/NO-GO launch decision.
```

---

## Launch Decision Framework

### ✅ GO (Approve Production Launch)

**Requirements**:
1. Agent 2 (Frontend): ≥95% pass (114/120 tests)
2. Agent 3 (API Regression): 100% pass on Category 1 (10/10), ≥90% on Category 2 (45/50)
3. Agent 4 (Performance): ≥95% pass (48/50), all queries <2s
4. Zero CRITICAL defects
5. ≤2 HIGH defects with documented mitigation plans
6. All critical blockers from Round 1 resolved

**Actions**:
- Tag release: `git tag -a v1.0.0 -m "Production launch - UAT Round 2 passed"`
- Update documentation: Mark Phase 1 complete in CLAUDE-TODO.md
- Deploy to production: Follow DEPLOYMENT.md
- Monitor for 24 hours: Health endpoints, error logs, user feedback

---

### ⚠️ CONDITIONAL GO (Launch with Caveats)

**Requirements**:
1. Agents 2-4: 90-94% pass (not ideal but acceptable)
2. Zero CRITICAL defects
3. ≤5 HIGH defects with mitigation plans
4. 30-day remediation timeline documented
5. Stakeholder approval obtained
6. Known issues documented and communicated

**Actions**:
- Create KNOWN-ISSUES.md with all defects
- Set 30-day sprint for remediation
- Deploy with monitoring
- Weekly status updates on fix progress

---

### ❌ NO-GO (Delay Launch)

**Triggers**:
1. Any CRITICAL defect present
2. Agent 2 or 3: <90% pass
3. Agent 3: Any regression from Oct 11 UAT (<100% on Category 1)
4. Agent 4: Any query >5s with 1000 records
5. >5 HIGH defects
6. XSS vulnerability not fixed
7. POST endpoints still broken (>5 failures)

**Actions**:
1. Create remediation sprint (prioritize critical/high defects)
2. Assign to development with target completion dates
3. Schedule UAT Round 3 after fixes (re-run failed agent tests only)
4. Update stakeholders with revised timeline
5. Document delay reason and recovery plan

---

## Expected Timeline

### Sequential Execution
- Phase 0 (Setup): 0.5 hours
- Agent 2: 3 hours
- Agent 3: 2 hours
- Agent 4: 2 hours
- Agent 1: 2 hours (if applicable)
- Agent 5: 2 hours
- Agent 6: 1.5 hours
- Phase 4 (Consolidation): 1 hour
- **Total**: 14 hours

### Parallel Execution (Recommended)
- Phase 0 (Setup): 0.5 hours
- **Phase 1 (Agents 2-4 parallel)**: 3 hours (longest agent)
- Phase 2 (Agent 1): 2 hours (optional, serial)
- **Phase 3 (Agents 5-6 parallel)**: 2 hours
- Phase 4 (Consolidation): 1 hour
- **Total**: 5.5-7.5 hours

---

## Critical Success Factors

### Must Resolve from Round 1
1. ✅ XSS vulnerability fixed (sanitize input, escape output)
2. ✅ POST endpoints working (schema validation fixed)
3. ✅ Rate limiting implemented (prevent API abuse)
4. ✅ Setup wizard bypass available (for testing)
5. ✅ Test credentials documented (admin user)

### Quality Metrics to Maintain
1. ✅ Database performance (96% pass)
2. ✅ Query speed (<2s with 1000+ records)
3. ✅ Accessibility foundation (84% pass)
4. ✅ Design compliance (83% pass)

### New Coverage in Round 2
1. ✅ Complete frontend UI testing (120 tests, previously 0%)
2. ✅ All 16 objects CRUD workflows validated
3. ✅ Relationship tabs tested
4. ✅ Empty states verified

---

## Troubleshooting Guide

### Issue: Agent 2 blocked by setup wizard again
**Solution**:
1. Check if setup completed: `curl http://localhost:3000/api/setup`
2. If not completed: Complete setup via UI or API
3. If completed but still redirecting: Check middleware.ts for redirect logic
4. Document as DEF-ROUND2-AG2-001 CRITICAL

### Issue: Agent 3 POST endpoints still failing
**Solution**:
1. Check schema validation in src/lib/schemas/*.ts
2. Compare request body to schema requirements
3. Check API route handlers in src/app/api/*/route.ts
4. Verify zod parsing not rejecting valid data
5. Document specific failing endpoints

### Issue: Agent 4 query performance degraded
**Solution**:
1. Check database indexes: `EXPLAIN ANALYZE SELECT ...`
2. Verify connection pool not exhausted
3. Check for N+1 query problems
4. Verify PostgreSQL vacuum running

### Issue: Test data conflicts between agents
**Solution**:
1. Use unique prefixes for test data (agent1-*, agent2-*, etc.)
2. Clean up test data between runs
3. Use transactions for isolated testing (if possible)

---

## Post-Testing Actions

### After Each Agent Completes
1. Review agent result file
2. Note any blocking defects immediately
3. If CRITICAL found, decide whether to continue or stop
4. Share preliminary results with team

### After Phase 1 Completes (Critical Path)
1. Quick assessment: Can we proceed with launch?
2. If NO-GO clear: Stop testing, begin remediation
3. If promising: Continue with Phases 2-3

### After All Testing Complete
1. Generate master results report
2. Review with stakeholders
3. Make launch decision (GO/CONDITIONAL GO/NO-GO)
4. Document decision rationale
5. Begin next steps (launch or remediation)

---

## Success Indicators

### Positive Signals
- ✅ All agents exceed 90% pass rate
- ✅ Agent 2 completes all 120 tests (vs 0 in Round 1)
- ✅ Agent 3 shows 100% regression pass
- ✅ No CRITICAL defects found
- ✅ Defect count decreased from Round 1
- ✅ Performance maintained or improved

### Warning Signals
- ⚠️ Any agent below 90% pass
- ⚠️ Agent 2 blocked again (setup wizard)
- ⚠️ Agent 3 shows any regression
- ⚠️ New CRITICAL defects introduced
- ⚠️ Performance degradation from Round 1
- ⚠️ XSS still present

### Red Flags (Immediate NO-GO)
- ❌ Setup wizard still blocks UI testing
- ❌ XSS vulnerability not fixed
- ❌ >10 POST endpoints still broken
- ❌ Database queries >5s
- ❌ Any security vulnerability present
- ❌ Critical data loss or corruption

---

## Notes for Future UAT Rounds

### Lessons from Round 1
1. Environment setup is critical - test credentials must be documented
2. Setup wizard needs test mode or bypass mechanism
3. Schema validation must be thoroughly tested before UAT
4. Security scanning should be automated (XSS, SQL injection)
5. POST endpoints need dedicated regression tests

### Improvements for Round 3 (if needed)
1. Automated environment setup script
2. Pre-UAT smoke tests to catch blockers early
3. Parallel agent execution from start
4. Real-time results dashboard
5. Automated defect categorization

---

## Contact & Coordination

**UAT Coordinator**: [Your Name]
**Round 2 Start Date**: [Date]
**Expected Completion**: [Start + 1 day for parallel, 2-3 days for serial]
**Status Updates**: Every 2 hours during execution

**Questions or Issues?**
- Review agent-specific test documents
- Check troubleshooting guide above
- Consult FINAL-UAT-MASTER-PLAN.md
- Review Round 1 results for context

---

## Ready to Begin Round 2

✅ **Checklist before starting**:
- [ ] All critical blockers from Round 1 verified as fixed
- [ ] Clean environment prepared
- [ ] Test credentials documented
- [ ] Development server running and healthy
- [ ] Test data seeded
- [ ] All 6 agent prompts ready to copy/paste
- [ ] 6 terminal windows prepared (or schedule serial execution)
- [ ] Results template files created
- [ ] Estimated completion time communicated to team

**Next Step**: Begin Phase 0 - Environment Setup

**Good luck with UAT Round 2!** 🚀

---

**Document Version**: 1.0
**Last Updated**: October 12, 2025
**Status**: Ready for Execution
