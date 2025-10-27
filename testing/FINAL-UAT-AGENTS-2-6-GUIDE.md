# FINAL UAT - Agents 2-6 Testing Guide

**Comprehensive guide for frontend, regression, performance, accessibility, and design testing**

---

## Agent 2: Frontend UI Testing (Playwright)

**Priority**: CRITICAL (blocks launch)
**Duration**: 3 hours
**Tests**: 120
**Tools**: Playwright MCP only

### Objectives

Test all 16 core objects through complete CRUD workflows using Playwright browser automation. This was NEVER fully executed in previous UAT due to webpack errors.

### Test Pattern (Repeat for Each of 16 Objects)

For each object (Companies, Locations, Rooms, People, Devices, Groups, Networks, IOs, IP Addresses, Software, SaaS Services, Installed Applications, Software Licenses, Documents, External Documents, Contracts):

#### Test Suite Structure

```
TS-UI-[OBJECT]-001: List Page
  - Navigate to list page
  - Take screenshot
  - Verify table renders
  - Verify search box present
  - Verify "Add New" button present
  - Test search functionality
  - Test pagination (if >50 records)

TS-UI-[OBJECT]-002: Create Form
  - Click "Add New" button
  - Take screenshot of form
  - Fill all required fields
  - Click Submit
  - Verify success message or redirect
  - Verify new record appears in list

TS-UI-[OBJECT]-003: Detail Page
  - Click on created record
  - Take screenshot
  - Verify all fields display correctly
  - Verify tabs present (Overview, relationships, History)
  - Verify Edit and Delete buttons present

TS-UI-[OBJECT]-004: Edit Form
  - Click Edit button
  - Verify form pre-populated with current data
  - Modify one field
  - Click Submit
  - Verify update successful
  - Verify change reflected in detail page

TS-UI-[OBJECT]-005: Delete Flow
  - From detail page, click Delete
  - Verify confirmation dialog appears
  - Confirm deletion
  - Verify redirect to list page
  - Verify record no longer in list

TS-UI-[OBJECT]-006: Relationship Tabs
  - Create related object (if applicable)
  - Navigate to parent detail page
  - Click relationship tab
  - Verify related item appears

TS-UI-[OBJECT]-007: Empty States
  - Navigate to object with no related items
  - Verify empty state message displays
  - Verify "Add New" button in empty state
```

### Playwright Command Examples

```javascript
// Navigate
await page.goto('http://localhost:3000/companies');

// Take screenshot
await page.screenshot({ path: 'companies-list.png' });

// Fill form
await page.fill('input[name="company_name"]', 'Test Company');
await page.fill('input[name="website"]', 'https://test.com');
await page.click('button[type="submit"]');

// Verify text
const heading = await page.textContent('h1');
expect(heading).toContain('Companies');

// Click element
await page.click('text=Test Company');

// Wait for navigation
await page.waitForURL('**/companies/*');
```

### Success Criteria

- **Pass Rate**: ≥95% (114/120 tests)
- **Zero High/Critical Defects**: All CRUD workflows must function
- **Screenshots**: All major pages captured for visual verification

---

## Agent 3: API Regression Testing

**Priority**: CRITICAL (blocks launch)
**Duration**: 2 hours
**Tests**: 60
**Tools**: Bash (curl), Read

### Objectives

1. Verify all 10 remediated defects from Oct 11 UAT remain fixed
2. Spot-check core API functionality across all 16 objects

### Test Categories

#### Category 1: Defect Regression (10 tests)

Test each remediated defect to ensure it's still fixed:

```bash
# DEF-UAT-API-001: Null values accepted
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test","website":null}' | grep -q '"success":true'

# DEF-UAT-API-002: Invalid JSON returns 400
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{invalid json}' | grep -q '400'

# DEF-UAT-API-003: License assignments work
curl -X POST http://localhost:3000/api/software-licenses/[id]/assign-person \
  -H "Content-Type: application/json" \
  -d '{"person_id":"[uuid]"}' | grep -q '"success":true'

# Continue for all 10 defects...
```

#### Category 2: Core API Functionality (50 tests)

Test pattern for each of 16 objects (3 tests each = 48 tests):

```bash
# GET List
curl -s http://localhost:3000/api/[object] | grep -q '\[\]'

# POST Create
curl -X POST http://localhost:3000/api/[object] \
  -H "Content-Type: application/json" \
  -d '[minimal valid JSON]' | grep -q '"success":true'

# DELETE
curl -X DELETE http://localhost:3000/api/[object]/[id] | grep -q '"success":true'
```

Plus 2 additional tests for security:
```bash
# SQL Injection Prevention
curl -X GET "http://localhost:3000/api/companies?search='; DROP TABLE companies--" \
  | grep -q '"success"'

# XSS Prevention
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name":"<script>alert(1)</script>"}' \
  | grep -v '<script>'
```

### Success Criteria

- **Pass Rate**: 100% on defect regression (all 10 must pass)
- **Pass Rate**: ≥90% on core functionality (45/50)
- **Zero Regressions**: No previously fixed defects can be broken

---

## Agent 4: Database & Performance Testing

**Priority**: CRITICAL (blocks launch)
**Duration**: 2 hours
**Tests**: 50
**Tools**: Bash (psql), Read

### Objectives

1. Verify database can handle production-scale data (1000+ records)
2. Ensure all queries complete in <2 seconds
3. Validate data integrity constraints

### Test Categories

#### Category 1: Load Testing (20 tests)

```bash
# Create 1000 devices
for i in {1..1000}; do
  curl -X POST http://localhost:3000/api/devices \
    -H "Content-Type: application/json" \
    -d "{\"hostname\":\"device-$i\",\"company_id\":\"[uuid]\"}"
done

# Query performance
time curl -s "http://localhost:3000/api/devices?limit=50" > /dev/null
# Expected: <2 seconds

# Complex JOIN query
time curl -s "http://localhost:3000/api/devices/[id]" > /dev/null
# (includes company, location, relationships)
# Expected: <2 seconds

# Search performance
time curl -s "http://localhost:3000/api/devices?search=device-500" > /dev/null
# Expected: <1 second
```

#### Category 2: Data Integrity (15 tests)

```bash
# Foreign key enforcement
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{"hostname":"test","company_id":"00000000-0000-0000-0000-000000000000"}' \
  | grep -q '"success":false'

# UNIQUE constraint
# Create duplicate hostname...
# Expect: Error

# CASCADE delete
# Delete company with devices...
# Verify: Devices also deleted (if CASCADE) or prevented (if RESTRICT)
```

#### Category 3: Database Health (15 tests)

```bash
# Index usage
docker compose exec postgres psql -U moss -d moss -c \
  "EXPLAIN ANALYZE SELECT * FROM devices WHERE hostname='device-500'"
# Verify: Uses idx_devices_hostname

# Connection pool
docker compose exec postgres psql -U moss -d moss -c \
  "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='moss'"
# Verify: <20 connections

# Table sizes
docker compose exec postgres psql -U moss -d moss -c \
  "SELECT pg_size_pretty(pg_table_size('devices'))"
# Verify: Reasonable size for 1000 records
```

### Success Criteria

- **Pass Rate**: ≥95% (48/50 tests)
- **Performance**: 100% of queries <2s with 1000+ records
- **Data Integrity**: All constraints enforced

---

## Agent 5: Accessibility Testing (Non-Blocking)

**Priority**: MEDIUM (quality gate, not launch blocker)
**Duration**: 2 hours
**Tests**: 50
**Tools**: Playwright MCP

### Objectives

Verify WCAG 2.1 AA compliance for users with disabilities.

### Test Categories

#### Keyboard Navigation (15 tests)

```javascript
// Tab through navigation
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
// Verify: Focus indicators visible

// Enter to activate
await page.keyboard.press('Enter');
// Verify: Dropdown opens or link followed

// Escape to close
await page.keyboard.press('Escape');
// Verify: Modal/dropdown closes

// Arrow keys in dropdowns
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowUp');
// Verify: Menu items highlighted
```

#### Screen Reader Support (15 tests)

```javascript
// Check ARIA labels
const button = await page.locator('button[aria-label]');
expect(await button.getAttribute('aria-label')).toBeTruthy();

// Check form labels
const input = await page.locator('input#company_name');
const label = await page.locator('label[for="company_name"]');
expect(await label.textContent()).toBeTruthy();

// Check heading hierarchy
const h1 = await page.locator('h1').count();
const h2 = await page.locator('h2').count();
// Verify: One H1, multiple H2s in logical order
```

#### Color Contrast (10 tests)

```javascript
// Check text contrast
const element = await page.locator('body');
const color = await element.evaluate(el => {
  const style = window.getComputedStyle(el);
  return { fg: style.color, bg: style.backgroundColor };
});
// Verify: Contrast ratio ≥4.5:1 for text

// Check link contrast
// Check button contrast
// etc.
```

#### Alternative Text (10 tests)

```javascript
// Check image alt text
const images = await page.locator('img');
for (const img of await images.all()) {
  const alt = await img.getAttribute('alt');
  expect(alt).not.toBeNull();
}

// Check decorative images have empty alt
const decorative = await page.locator('img[role="presentation"]');
// Verify: alt="" or aria-hidden="true"
```

### Success Criteria

- **Pass Rate**: ≥85% (43/50 tests)
- **Non-Blocking**: Failures create post-launch backlog, not launch blockers

---

## Agent 6: Design Compliance Testing (Non-Blocking)

**Priority**: LOW (quality gate, not launch blocker)
**Duration**: 1.5 hours
**Tests**: 30
**Tools**: Playwright MCP, Read

### Objectives

Verify adherence to `planning/designguides.md` color palette and typography rules.

### Test Categories

#### Color Palette Compliance (10 tests)

```javascript
// Check primary colors dominant
const morningBlue = await page.locator('[style*="#1C7FF2"]').count();
const brewBlack = await page.locator('[style*="#231F20"]').count();
const offWhite = await page.locator('[style*="#FAF9F5"]').count();
// Verify: Primary colors used most

// Check no arbitrary colors
const allColors = await page.evaluate(() => {
  const elements = document.querySelectorAll('*');
  const colors = new Set();
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    colors.add(style.color);
    colors.add(style.backgroundColor);
  });
  return Array.from(colors);
});
// Verify: Only approved colors from design guide
```

#### Typography Compliance (10 tests)

```javascript
// Check Inter font
const h1 = await page.locator('h1');
const fontFamily = await h1.evaluate(el =>
  window.getComputedStyle(el).fontFamily
);
expect(fontFamily).toContain('Inter');

// Check type scale
const h1Size = await h1.evaluate(el =>
  window.getComputedStyle(el).fontSize
);
// Verify: 57.6px (from design guide scale)

// Check base font size
const body = await page.locator('body');
const bodySize = await body.evaluate(el =>
  window.getComputedStyle(el).fontSize
);
// Verify: 18px base
```

#### Layout Compliance (10 tests)

```javascript
// Check grid alignment
const container = await page.locator('.container');
const margin = await container.evaluate(el =>
  window.getComputedStyle(el).marginLeft
);
// Verify: 1/4 column width

// Check responsive breakpoints
await page.setViewportSize({ width: 375, height: 667 }); // Mobile
await page.screenshot({ path: 'mobile.png' });

await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
await page.screenshot({ path: 'tablet.png' });

await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
await page.screenshot({ path: 'desktop.png' });
// Verify: Layout adapts appropriately
```

### Success Criteria

- **Pass Rate**: ≥90% (27/30 tests)
- **Non-Blocking**: Failures inform design polishing, not launch blockers

---

## Results Reporting

All agents must create results file: `testing/FINAL-UAT-RESULTS-AGENT[N].md`

Use this structure:

```markdown
# FINAL UAT Results - Agent [N]: [Name]

**Date**: [Date]
**Tester**: Agent [N]
**Duration**: [X] hours

## Executive Summary

- **Total Tests**: [N]
- **Passed**: [N] ([%])
- **Failed**: [N] ([%])
- **Skipped**: [N] ([%])
- **Pass Rate**: [%]

## Test Results Table

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TS-XXX-001 | ... | PASS | ... |
| TS-XXX-002 | ... | FAIL | See DEF-001 |

## Defects Found

### DEF-FINAL-[AGENT]-001: [Title]
**Severity**: CRITICAL/HIGH/MEDIUM/LOW
[Full defect details...]

## Evidence

[Screenshots, logs, etc.]

## Recommendations

**Launch Decision**: GO / CONDITIONAL GO / NO-GO
**Justification**: [...]
```

---

## Quick Start Commands

### Agent 2 (Playwright)
```bash
claude-code
"Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md Agent 2 section.
Test all 16 objects using Playwright MCP. Take screenshots.
Report results in testing/FINAL-UAT-RESULTS-AGENT2.md"
```

### Agent 3 (API Regression)
```bash
claude-code
"Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md Agent 3 section.
Test all 10 defect regressions plus core API functionality.
Report results in testing/FINAL-UAT-RESULTS-AGENT3.md"
```

### Agent 4 (Performance)
```bash
claude-code
"Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md Agent 4 section.
Create 1000+ test records and measure query performance.
Report results in testing/FINAL-UAT-RESULTS-AGENT4.md"
```

### Agent 5 (Accessibility)
```bash
claude-code
"Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md Agent 5 section.
Test WCAG 2.1 AA compliance using Playwright.
Report results in testing/FINAL-UAT-RESULTS-AGENT5.md"
```

### Agent 6 (Design)
```bash
claude-code
"Read testing/FINAL-UAT-AGENTS-2-6-GUIDE.md Agent 6 section and planning/designguides.md.
Verify color palette and typography compliance.
Report results in testing/FINAL-UAT-RESULTS-AGENT6.md"
```

---

**Next**: Read `FINAL-UAT-MASTER-PLAN.md` for coordination details and launch criteria.
