# UAT Round 2 - Quick Start Card

**Date**: October 12, 2025 | **Version**: 2.1 | **Status**: Ready to Execute

---

## 🚨 CRITICAL: Pre-Flight Checklist

Before starting ANY testing, verify these are ✅ FIXED from Round 1:

- [ ] **XSS Vulnerability** - `<script>` tags must be sanitized
- [ ] **POST Endpoints** - At least 14/16 must work (previously broken)
- [ ] **Rate Limiting** - Must return 429 after threshold
- [ ] **Setup Wizard** - Must not redirect authenticated users to /setup
- [ ] **Test Credentials** - Admin user email/password documented

**If ANY are not fixed, STOP and remediate before testing.**

---

## 📋 Execution Order (Parallel - 5.5 hours)

```
Phase 0: Setup (0.5h) → Phase 1: Agents 2,3,4 parallel (3h) → Phase 3: Agents 5,6 parallel (2h) → Phase 4: Consolidate (1h)
```

---

## 🖥️ Terminal Setup

### Terminal 1: Agent 2 (Frontend UI)
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Prompt to Agent 2"]
- **Tests**: 120 (16 objects × 7 tests)
- **Duration**: 3 hours
- **Must Pass**: ≥95% (114/120)
- **Output**: `testing/FINAL-UAT-RESULTS-AGENT2-ROUND2.md`

---

### Terminal 2: Agent 3 (API Regression)
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Prompt to Agent 3"]
- **Tests**: 60 (10 regression + 50 core)
- **Duration**: 2 hours
- **Must Pass**: 100% regression, ≥90% core
- **Output**: `testing/FINAL-UAT-RESULTS-AGENT3-ROUND2.md`

---

### Terminal 3: Agent 4 (Database/Performance)
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Prompt to Agent 4"]
- **Tests**: 50 (20 load + 15 integrity + 15 health)
- **Duration**: 2 hours
- **Must Pass**: ≥95% (48/50), queries <2s
- **Output**: `testing/FINAL-UAT-RESULTS-AGENT4-ROUND2.md`

---

### Terminal 4: Agent 5 (Accessibility) - Start after Phase 1
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Prompt to Agent 5"]
- **Tests**: 50 (WCAG 2.1 AA)
- **Duration**: 2 hours
- **Target**: ≥85% (non-blocking)
- **Output**: `testing/FINAL-UAT-RESULTS-AGENT5-ROUND2.md`

---

### Terminal 5: Agent 6 (Design) - Start after Phase 1
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Prompt to Agent 6"]
- **Tests**: 30 (color, typography, layout)
- **Duration**: 1.5 hours
- **Target**: ≥90% (non-blocking)
- **Output**: `testing/FINAL-UAT-RESULTS-AGENT6-ROUND2.md`

---

### Terminal 6: Master Results - Start after ALL complete
```bash
cd /Users/admin/Dev/moss && claude-code
```
**Paste**: [See FINAL-UAT-ROUND2-EXECUTION-GUIDE.md "Consolidate Prompt"]
- **Duration**: 1 hour
- **Output**: `testing/FINAL-UAT-MASTER-RESULTS-ROUND2.md`
- **Decision**: GO / CONDITIONAL GO / NO-GO

---

## 📊 Round 1 Baseline (for comparison)

| Agent | Round 1 Result | Round 2 Target |
|-------|---------------|----------------|
| Agent 1 | SKIPPED | Optional |
| Agent 2 | 0% (blocked) | ≥95% |
| Agent 3 | 48% | 100% regression, ≥90% core |
| Agent 4 | 96% | ≥95% |
| Agent 5 | 84% | ≥85% |
| Agent 6 | 83% | ≥90% |

**Round 1 Decision**: NO-GO (3 CRITICAL defects)
**Round 2 Goal**: GO (all critical blockers fixed)

---

## ✅ GO Criteria

**Must have ALL**:
- ✅ Agent 2: ≥95% pass
- ✅ Agent 3: 100% regression + ≥90% core
- ✅ Agent 4: ≥95% pass, queries <2s
- ✅ Zero CRITICAL defects
- ✅ ≤2 HIGH defects

**Result**: Production launch approved ✅

---

## ⚠️ CONDITIONAL GO Criteria

**If**:
- ⚠️ Agents 2-4: 90-94% pass
- ✅ Zero CRITICAL defects
- ⚠️ 3-5 HIGH defects
- ✅ Mitigation plans documented

**Result**: Launch with 30-day remediation plan ⚠️

---

## ❌ NO-GO Triggers

**Any of these = immediate NO-GO**:
- ❌ Any CRITICAL defect
- ❌ Agent 2 or 3: <90% pass
- ❌ Agent 3: Any regression (<100%)
- ❌ Agent 4: Any query >5s
- ❌ XSS not fixed
- ❌ >5 POST endpoints broken

**Result**: Delay launch, create remediation sprint ❌

---

## 🔧 Quick Environment Setup

```bash
# 1. Clean environment
cd /Users/admin/Dev/moss
pkill -f "next dev"
rm -rf .next

# 2. Verify database
PGPASSWORD=postgres psql -h localhost -U postgres -d moss -c "SELECT COUNT(*) FROM users"

# 3. Start dev server
npm run dev
# Wait for "ready on http://localhost:3000"

# 4. Health check
curl http://localhost:3000/api/health
# Expected: {"status":"healthy"}

# 5. Verify no setup redirect
curl -I http://localhost:3000
# Expected: 200 OK (not 307 redirect to /setup)

# 6. Create test company
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name":"UAT Test Company","website":"https://test-uat.com"}'
# Save company ID for Agent tests
```

---

## 🚀 Execution Timeline

**Start Time**: ___:___ (record when you begin)

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 0 (Setup) | 0.5h | | | ⬜ |
| Phase 1 (Agents 2,3,4) | 3h | | | ⬜ |
| Phase 3 (Agents 5,6) | 2h | | | ⬜ |
| Phase 4 (Consolidate) | 1h | | | ⬜ |
| **Total** | **6.5h** | | | |

**Expected Completion**: ___:___

---

## 📝 Progress Tracking

### Phase 1 Progress (update every 30 min)
- [ ] T+0:30 - Agents launched
- [ ] T+1:00 - First results appearing
- [ ] T+1:30 - Mid-point check
- [ ] T+2:00 - Agent 3,4 likely done
- [ ] T+2:30 - Final stretch
- [ ] T+3:00 - Agent 2 complete

### Critical Checkpoint (T+1:30)
**If any agent shows CRITICAL defect**:
1. Document defect immediately
2. Assess impact on other agents
3. Decide: Continue or stop for remediation

---

## 🆘 Emergency Contacts

**Issue**: Setup wizard blocks Agent 2 again
**Action**: STOP, document DEF-ROUND2-AG2-001 CRITICAL

**Issue**: XSS vulnerability still present
**Action**: STOP, document DEF-ROUND2-AG3-001 CRITICAL

**Issue**: >10 POST endpoints failing
**Action**: Continue testing but expect NO-GO

**Issue**: Database performance degraded
**Action**: Check indexes, connection pool

---

## 📦 Deliverables

**By end of testing, must have**:
1. ✅ `FINAL-UAT-RESULTS-AGENT2-ROUND2.md`
2. ✅ `FINAL-UAT-RESULTS-AGENT3-ROUND2.md`
3. ✅ `FINAL-UAT-RESULTS-AGENT4-ROUND2.md`
4. ✅ `FINAL-UAT-RESULTS-AGENT5-ROUND2.md`
5. ✅ `FINAL-UAT-RESULTS-AGENT6-ROUND2.md`
6. ✅ `FINAL-UAT-MASTER-RESULTS-ROUND2.md`
7. ✅ Launch decision: GO / CONDITIONAL GO / NO-GO

---

## 🎯 Success Metrics

**Overall Pass Rate Target**: ≥95%
**Total Tests**: 350 (vs 190 executed in Round 1)
**Defects Allowed**: 0 CRITICAL, ≤2 HIGH
**Performance**: 100% queries <2s

**Previous Round 1**:
- Pass Rate: 54% weighted average
- Tests: 190/350 executed
- Result: NO-GO

**Round 2 Target**:
- Pass Rate: ≥95%
- Tests: 310/350 executed (Agent 1 optional)
- Result: GO or CONDITIONAL GO

---

## 📚 Reference Documents

**Main Guide**: `testing/FINAL-UAT-ROUND2-EXECUTION-GUIDE.md`
**Master Plan**: `testing/FINAL-UAT-MASTER-PLAN.md`
**Agent Specs**: `testing/FINAL-UAT-AGENTS-2-6-GUIDE.md`
**Round 1 Results**: `testing/FINAL-UAT-MASTER-RESULTS.md`
**Template**: `testing/FINAL-UAT-RESULTS-TEMPLATE.md`

---

## ✨ Final Pre-Flight

**Right before launching agents**:

```bash
# Verify environment health
echo "=== ENVIRONMENT HEALTH CHECK ===" && \
curl -s http://localhost:3000/api/health && \
curl -s http://localhost:3000/api/health/db && \
echo "✅ Environment ready for testing"
```

**If all healthy**: Proceed with agent launches
**If any unhealthy**: Fix before starting

---

**Ready to begin UAT Round 2!** 🚀

**Remember**: This is about production launch readiness. Be thorough, be critical, document everything.

**Good luck!** 🍀
