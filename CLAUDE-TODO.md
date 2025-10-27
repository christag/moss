# M.O.S.S. TODO List

**Single source of truth for all pending work.**

---

## Current Phase: Phase 2 Advanced Features (20% Complete)

### Active Work

#### Network Topology - Layout Selector Fix
**Status**: Optional polish (P3)
- [ ] Fix layout selector crash (import Cytoscape layout extensions)
- [ ] Add export options modal

#### IP Address Management
**Status**: Next priority (P1)
- [ ] Subnet calculator and IP allocation tracker
- [ ] Visual IP address heatmap
- [ ] DHCP range management
- [ ] IP conflict detection

---

## Phase 2 Remaining Features

### High Priority (P1)
- IP Address Management with Subnet Visualization (10-14h)

### Medium Priority (P2)
- Bulk Import/Export (CSV) (8-12h)
- File Attachments (6-8h)
- Custom Reports and Dashboards (10-14h)
- Advanced Search with Saved Filters (6-8h)
- Frontend Testing Coverage - 15 objects remaining (20-30h)
- Database Optimization - Missing indexes (4-6h)
- Dashboard Widget Fixes - 500 errors (2-3h)

### Low Priority (P3)
- Validation & Error Handling improvements (2-3h)

---

## Phase 3 Future (Not Started)

### Production Requirements
- SAML 2.0 Authentication with SCIM (16-24h)
- OpenAPI & MCP Integration (12-18h)
- External Integrations (24-40h)
  - Active Directory sync
  - MDM (Jamf, Intune, Google Workspace)
  - Cloud providers (AWS, Azure, GCP)
  - SNMP/SSH polling
  - Ticketing (Jira, ServiceNow)
  - Password vaults (1Password, Bitwarden)

---

## Deferred Items

- Equipment Check-Out Phases 2-5 (blocked by DB connection pool issues)
- Power Topology Visualization
- Broadcast Signal Flow Mapping
- Custom Fields UI
- Notification Templates

---

## Production Launch Status

**Phase 1**: ✅ 100% Complete
**Phase 2**: 🔄 20% Complete (3/13 features)
**Phase 3**: 📅 Not Started

**Production Ready**: ✅ Yes (95/100 score)
**UAT Pass Rate**: 88.7% (Phase 1) + 82.5% (Network Topology)

### Pre-Launch Checklist
- [x] All 16 core objects production-ready
- [x] Enhanced RBAC implemented
- [x] Admin settings panel operational
- [x] Security hardening complete
- [x] UAT testing complete (88.7% pass rate)
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] UI polish and animations complete

### Launch (Pending User Decision)
- [ ] Deploy to production (Vercel or Cloudflare Pages)
- [ ] Configure production database
- [ ] Configure production storage backend
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up domain and SSL
- [ ] Configure SMTP
- [ ] Create initial admin account

---

## Latest Milestones

- **2025-10-26**: Network Topology Visualization Complete
- **2025-10-25**: UI Polish & Animations Complete (PR #2)
- **2025-10-25**: Equipment Check-Out Phase 1 Complete (PR #3)
- **2025-10-12**: Phase 1 Complete, Enhanced RBAC Implemented

---

## Notes for Claude

**Before starting work**:
1. Check dependencies (don't start blocked tasks)
2. Verify estimated time is reasonable
3. Update status to "IN PROGRESS"

**When completing tasks**:
1. Mark complete with date
2. Note any blockers or issues
3. Update CLAUDE-UPDATES.md with session summary
4. Run UAT testing before marking complete

**Testing Requirements**:
- Use Playwright MCP tools for automated testing
- Document results with screenshots
- Aim for 90%+ pass rate
