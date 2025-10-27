# M.O.S.S. Agents

Autonomous workflow components that handle specific phases of feature development from planning to deployment.

## Overview

Agents are specialized AI assistants that coordinate with each other to implement features systematically. Each agent has a specific role, limited tool access, and clear handoff points to other agents.

## Agent Workflow

```
User Request
    ↓
┌─────────────────────────┐
│  moss-task-planner      │  Creates high-level TODO, breaks into tasks
└─────────────────────────┘
    ↓ (creates active-feature.md)
┌─────────────────────────┐
│  moss-feature-planner   │  Designs implementation approach, tech spec
└─────────────────────────┘
    ↓ (updates active-feature.md)
┌─────────────────────────┐
│  moss-engineer          │  Implements feature following spec
└─────────────────────────┘
    ↓ (writes code)
┌─────────────────────────┐
│  moss-tester            │  Runs UAT tests, reports results
└─────────────────────────┘
    ↓ (if pass)
┌─────────────────────────┐
│  moss-git-controller    │  Commits, creates PR, merges
└─────────────────────────┘
    ↓ (if merged)
┌─────────────────────────┐
│  moss-documentation-    │  Updates docs, archives feature
│  updater                │
└─────────────────────────┘
```

## Available Agents

### moss-task-planner
**Role**: Project manager and task breakdown specialist

**Responsibilities**:
- Maintain `CLAUDE-TODO.md` (high-level roadmap)
- Break user requests into manageable tasks
- Create `.claude/task-lists/active-feature.md`
- Handle scope changes during implementation
- Archive completed features

**Tools**: Read, Write, Edit, Glob, Grep

**Triggers**:
- User provides feature request
- Implementation reveals new requirements
- Blockers are encountered

**Outputs**:
- Updated `CLAUDE-TODO.md`
- New `active-feature.md` with task breakdown
- Time estimates and priority assignments

**Example**:
```
User: "Add dark mode toggle to settings"

Task Planner:
1. Reads CLAUDE-TODO.md for context
2. Creates active-feature.md:
   - Database: user preference column
   - API: PATCH /api/users/preferences
   - UI: Toggle component
   - Form: settings page integration
   - CSS: dark theme variables
   - Testing: UAT cases
   - Docs: update COMPONENTS.md
3. Updates CLAUDE-TODO.md: "Dark mode (3h, P2)"
4. Hands off to moss-feature-planner
```

---

### moss-feature-planner
**Role**: Technical architect and implementation designer

**Responsibilities**:
- Read `active-feature.md` task list
- Design implementation approach
- Identify required skills (moss-form-builder, moss-api-endpoint, etc.)
- Create technical specification
- Document architectural decisions

**Tools**: Read, Glob, Grep

**Triggers**:
- Task planner creates new feature task list
- Engineer requests clarification on approach

**Outputs**:
- Updated `active-feature.md` with technical spec
- List of skills to invoke
- Architectural notes and decisions

**Example**:
```
Feature Planner (reading active-feature.md):

Technical Spec:
- Database: Add `preferences JSONB` column to `users` table
  → Use moss-database-migration skill
  → Migration 025_user_preferences.sql

- API: POST /api/users/[id]/preferences
  → Use moss-api-endpoint skill
  → Zod schema: { theme: 'light' | 'dark' }
  → RBAC: User can edit own preferences

- UI: <Toggle> component (src/components/ui/Toggle.tsx)
  → Use moss-component-builder skill
  → 44px height, follows design system

- Integration: Add to /admin/settings page
  → Use moss-form-builder skill
  → Save on toggle change (no submit button)

Skills needed: moss-database-migration, moss-api-endpoint,
              moss-component-builder, moss-form-builder,
              moss-visual-check, moss-uat-generator
```

---

### moss-engineer
**Role**: Feature implementer following technical specifications

**Responsibilities**:
- Read technical spec from `active-feature.md`
- Invoke skills as specified by planner
- Write code following M.O.S.S. patterns
- Update implementation notes with decisions
- Handle unexpected challenges (consult planner if major)

**Tools**: Read, Write, Edit, Glob, Grep, Bash (build/lint)

**Triggers**:
- Feature planner completes technical spec
- Tester reports failures (retry with fixes)

**Outputs**:
- Implemented feature code
- Updated `active-feature.md` with implementation notes
- Build passing, lint warnings < 20

**Example**:
```
Engineer (reading technical spec):

1. Invoke moss-database-migration
   → Created migrations/025_user_preferences.sql
   ✓ Added preferences JSONB column
   ✓ Created index on preferences

2. Invoke moss-zod-schema
   → Created src/lib/schemas/preferences.ts
   ✓ Zod validation for theme setting

3. Invoke moss-api-endpoint
   → Created src/app/api/users/[id]/preferences/route.ts
   ✓ POST endpoint with RBAC check
   ✓ Validates user can only edit own preferences

4. Invoke moss-component-builder
   → Created src/components/ui/Toggle.tsx
   ✓ 44px height, design system colors
   ✓ WCAG AA compliant

5. Invoke moss-form-builder
   → Updated src/app/admin/settings/page.tsx
   ✓ Integrated Toggle component
   ✓ Auto-save on change

6. Invoke moss-visual-check
   → Verified design compliance
   ✓ All components pass visual check

7. Run build
   → npm run build
   ✓ Build successful, 0 errors, 2 warnings (pre-existing)

Implementation complete. Ready for moss-tester.
```

---

### moss-tester
**Role**: Quality assurance and automated testing

**Responsibilities**:
- Invoke `moss-uat-generator` to create test cases
- Run tests using Playwright MCP tools
- Document results in `active-feature.md`
- Report failures to engineer (with retry count)
- Verify accessibility and design compliance

**Tools**: Playwright MCP tools, Read, Edit

**Triggers**:
- Engineer completes implementation
- Previous test attempt failed (retry up to 3x)

**Outputs**:
- Test results in `active-feature.md`
- Screenshots in `.playwright-mcp/`
- Pass/fail status with retry count

**Example**:
```
Tester (reading active-feature.md):

1. Invoke moss-uat-generator
   → Created 8 test cases:
   - Navigate to settings page
   - Toggle renders correctly
   - Click toggle changes theme
   - Theme persists after page reload
   - API saves preference correctly
   - Keyboard navigation works
   - Focus indicators visible
   - Design system compliance

2. Run tests using Playwright MCP
   Test 1: Navigate to settings ✓ PASS
   Test 2: Toggle renders ✓ PASS
   Test 3: Click toggle ✓ PASS
   Test 4: Persistence ✓ PASS
   Test 5: API save ✓ PASS
   Test 6: Keyboard nav ✓ PASS
   Test 7: Focus indicators ✓ PASS
   Test 8: Design compliance ✓ PASS

   Pass Rate: 100% (8/8 tests)

3. Update active-feature.md
   Status: Testing Complete
   UAT Pass Rate: 100%
   Screenshots: Saved to .playwright-mcp/

Feature ready for moss-git-controller.
```

---

### moss-git-controller
**Role**: Version control and pull request management

**Responsibilities**:
- Review changed files with `git status`
- Create meaningful commit messages
- Commit changes following git protocol
- Create pull requests with proper description
- Link PR to feature task list

**Tools**: Bash (git commands), Read

**Triggers**:
- Tester confirms all tests pass
- Documentation updater finishes docs

**Outputs**:
- Git commit with proper message
- GitHub pull request
- PR number added to `active-feature.md`

**Example**:
```
Git Controller (reading active-feature.md):

1. Check git status
   → Modified: migrations/025_user_preferences.sql
   → New: src/lib/schemas/preferences.ts
   → New: src/app/api/users/[id]/preferences/route.ts
   → New: src/components/ui/Toggle.tsx
   → Modified: src/app/admin/settings/page.tsx

2. Create commit
   → git add .
   → git commit -m "Add dark mode toggle to settings

   Implements user-requested dark mode feature:
   - Database migration for user preferences (JSONB)
   - API endpoint for saving theme preference
   - Toggle component following design system
   - Auto-save integration in settings page
   - Full UAT coverage (8/8 tests pass)

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"

3. Push to remote
   → git push origin feature/dark-mode-toggle

4. Create pull request
   → gh pr create --title "Add dark mode toggle" \
      --body "Implements #123 - Dark mode toggle in settings

      ## Summary
      - User preference stored in database
      - Toggle component with auto-save
      - Full design system compliance

      ## Test Results
      - UAT: 100% (8/8 tests)
      - Build: ✓ Pass
      - Lint: ✓ Pass (2 pre-existing warnings)

      ## Screenshots
      See .playwright-mcp/ for test evidence"

PR created: #45
Ready for moss-documentation-updater.
```

---

### moss-documentation-updater
**Role**: Documentation maintenance and feature archival

**Responsibilities**:
- Update `COMPONENTS.md` for new components
- Update `planning/*.md` for architectural changes
- Update `CLAUDE-UPDATES.md` with session summary
- Mark feature complete in `CLAUDE-TODO.md`
- Archive `active-feature.md` to `completed-features.md`

**Tools**: Read, Write, Edit

**Triggers**:
- PR is merged (or user confirms feature is done)

**Outputs**:
- Updated documentation files
- Session summary in `CLAUDE-UPDATES.md`
- Completed feature marked in `CLAUDE-TODO.md`
- `active-feature.md` archived

**Example**:
```
Documentation Updater (reading active-feature.md):

1. Update COMPONENTS.md
   → Added Toggle component documentation:
   - Props, usage, examples
   - Design system compliance notes

2. Update CLAUDE-UPDATES.md
   → Added session summary:
   ## Session: Dark Mode Toggle - 2025-10-26
   - Implemented toggle component
   - User preferences API
   - 100% UAT pass rate
   - Key decision: Auto-save (no submit button)

3. Update CLAUDE-TODO.md
   → Marked complete: ~~Dark mode (3h, P2)~~ ✓ 2025-10-26

4. Archive feature
   → Appended active-feature.md to completed-features.md
   → Cleared active-feature.md for next feature

Documentation complete. Feature archived.
```

---

## Agent Coordination

### Handoff Protocol

Each agent signals completion by:
1. Updating `active-feature.md` with their output
2. Setting status field (e.g., `Status: Planning Complete` → `Status: Implementation Ready`)
3. Reporting to user which agent should run next

### Retry Logic

If an agent fails:
- **Task Planner**: Ask user for clarification
- **Feature Planner**: Provide 2-3 alternative approaches
- **Engineer**: Document blocker, consult planner
- **Tester**: Report failures to engineer, increment retry count (max 3)
- **Git Controller**: Report merge conflicts, ask user for resolution
- **Documentation Updater**: Skip missing sections, document gaps

### Parallel Execution

Some agents can run in parallel:
- Documentation Updater + Git Controller (after tests pass)
- Multiple Engineers on independent features (different branches)

### Human-in-the-Loop

Agents pause for user input when:
- Requirements are ambiguous (Task Planner)
- Multiple valid approaches exist (Feature Planner)
- Blockers are encountered (Engineer)
- Tests fail 3 times (Tester)
- Merge conflicts occur (Git Controller)

## Agent Configuration

Each agent directory contains:
```
moss-agent-name/
├── agent.json         # Agent metadata (name, description, tools)
└── instructions.md    # Complete agent instructions
```

### agent.json
```json
{
  "name": "moss-agent-name",
  "description": "Brief description used in agent selection",
  "tools": ["Read", "Write", "Edit", "Bash"],
  "instructions": "instructions.md"
}
```

### instructions.md
Contains:
- Role definition
- Responsibilities
- Tool usage guidance
- Integration with other agents
- Error handling
- Success metrics
- Example workflows

## Creating New Agents

If you identify a workflow phase that needs automation:

1. **Define role**: What specific phase of development does this handle?
2. **Identify tools**: What tools does it need (minimize to essentials)?
3. **Map handoffs**: Which agents trigger it? Which does it trigger?
4. **Create directory**: `.claude/agents/moss-new-agent/`
5. **Write agent.json** and **instructions.md**
6. **Test workflow**: Run through complete feature implementation
7. **Update this README**

## Best Practices

### For Agent Development

**Clear Boundaries**:
- Each agent should have ONE clear responsibility
- Minimize tool access to what's strictly needed
- Define explicit handoff points

**Error Handling**:
- Document what to do when things go wrong
- Provide retry logic where appropriate
- Know when to ask for human input

**Documentation**:
- Update `active-feature.md` with progress
- Report status to user clearly
- Document decisions and blockers

### For Users

**Starting a Feature**:
```
User: "I want to add [feature]"
→ Invoke moss-task-planner
→ Wait for task breakdown
→ Invoke moss-feature-planner
→ Wait for technical spec
→ Invoke moss-engineer
→ (agents continue automatically)
```

**Monitoring Progress**:
- Check `active-feature.md` for current status
- Look for agent status messages
- Review retry counts for blockers

**Intervening**:
- Provide clarification when agents ask
- Approve major scope changes
- Resolve merge conflicts
- Make architectural decisions

## Troubleshooting

**Agent stuck in loop?**
- Check `active-feature.md` for retry count
- Review agent's instructions for exit conditions
- Manually advance to next agent if needed

**Agent making poor decisions?**
- Review agent's instructions.md
- Update instructions based on learnings
- Add examples of correct behavior

**Agents skipping steps?**
- Verify handoff status fields are set correctly
- Check agent triggers in instructions.md
- Ensure `active-feature.md` has required information

## Related Documentation

- **Skills**: See `.claude/skills/README.md` for specialized capabilities
- **Task Management**: See `.claude/README.md` for TODO/task lists
- **Project Context**: See `CLAUDE.md` in project root
- **Git Protocol**: See `CLAUDE.md` "Creating pull requests" section

## Version History

- **2025-10-26**: Created comprehensive agent documentation
- **2025-10-12**: Initial agent system implementation
