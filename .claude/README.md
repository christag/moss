# .claude Directory

This directory contains Claude Code workspace configuration, custom agents, skills, and task management files for the M.O.S.S. project.

## Directory Structure

```
.claude/
├── README.md              # This file
├── settings.local.json    # Claude Code local settings
├── agents/                # Custom workflow agents
│   ├── README.md
│   ├── moss-task-planner/
│   ├── moss-feature-planner/
│   ├── moss-engineer/
│   ├── moss-tester/
│   ├── moss-git-controller/
│   └── moss-documentation-updater/
├── skills/                # Specialized M.O.S.S. skills
│   ├── README.md
│   ├── moss-visual-check/
│   ├── moss-component-builder/
│   ├── moss-form-builder/
│   ├── moss-api-endpoint/
│   ├── moss-database-migration/
│   ├── moss-uat-generator/
│   ├── moss-zod-schema/
│   └── moss-relationship-tab/
└── task-lists/            # Active and completed feature task lists
    ├── active-feature.md
    └── completed-features.md
```

## Files in Project Root

- **CLAUDE-TODO.md** - High-level project TODO list (single source of truth)
- **CLAUDE-UPDATES.md** - Session summaries documenting completed work
- **CLAUDE.md** - Project context and coding standards for Claude

## Agents vs Skills

### Agents (Workflow Automation)
**Location**: `.claude/agents/`

Agents are autonomous workflow components that handle specific phases of feature development. They coordinate with each other to implement features from planning to deployment.

**Available Agents**:
- `moss-task-planner` - Maintains TODO lists, breaks down features into tasks
- `moss-feature-planner` - Designs implementation approach, creates technical specs
- `moss-engineer` - Implements features following specs from planner
- `moss-tester` - Runs UAT tests using Playwright MCP, reports failures
- `moss-git-controller` - Manages commits, PRs, merges
- `moss-documentation-updater` - Updates docs after feature completion

**When to Use**: Invoke agents for multi-step features requiring planning, implementation, testing, and documentation.

### Skills (Specialized Capabilities)
**Location**: `.claude/skills/`

Skills are specialized knowledge modules that ensure consistency and compliance when building M.O.S.S. features. They provide step-by-step guidance for specific tasks.

**Available Skills**:
- `moss-visual-check` - Verify design system compliance (colors, typography, spacing, accessibility)
- `moss-component-builder` - Build UI components following Figma specs
- `moss-form-builder` - Create forms using GenericForm pattern with Zod validation
- `moss-api-endpoint` - Build REST API routes with NextAuth, RBAC, Zod validation
- `moss-database-migration` - Create numbered PostgreSQL migrations
- `moss-uat-generator` - Generate UAT test cases using Playwright MCP
- `moss-zod-schema` - Create Zod schemas matching database structure
- `moss-relationship-tab` - Add relationship tabs using RelatedItemsList component

**When to Use**: Invoke skills when performing specific tasks that require strict adherence to M.O.S.S. patterns and standards.

## Task Management

### High-Level TODO (CLAUDE-TODO.md)
Located in project root. Contains:
- Current phase status (Phase 1: Complete, Phase 2: 20%, Phase 3: Planned)
- Active work items with priorities (P0-P3)
- Deferred items with reasons
- Production launch checklist
- Latest milestones

**Updated by**: `moss-task-planner` agent, manual edits

### Active Feature Task List (.claude/task-lists/active-feature.md)
Detailed breakdown of currently in-progress feature:
- Specific tasks with checkboxes
- Implementation notes
- Dependencies
- Test results
- Retry count (max 3 attempts)

**Created by**: `moss-task-planner` agent
**Used by**: All agents during feature implementation

### Completed Features (.claude/task-lists/completed-features.md)
Archive of finished features with timestamps and outcomes.

**Updated by**: `moss-task-planner` agent when feature is 100% complete

## Session Documentation

### CLAUDE-UPDATES.md (Project Root)
Session summaries for future Claude instances:
- What was accomplished
- Status and UAT results
- Bugs fixed
- Key decisions made
- Dependencies added
- Lessons learned

**Updated by**: Manual edits after significant milestones

## Workflow Example

### User Request: "Add dark mode toggle"

1. **Task Planner** (`moss-task-planner`)
   - Reads CLAUDE-TODO.md
   - Creates `.claude/task-lists/active-feature.md`
   - Updates CLAUDE-TODO.md with feature entry

2. **Feature Planner** (`moss-feature-planner`)
   - Reads active-feature.md
   - Designs implementation approach
   - Identifies required skills (e.g., `moss-form-builder`, `moss-api-endpoint`)
   - Updates active-feature.md with technical spec

3. **Engineer** (`moss-engineer`)
   - Reads technical spec
   - Invokes skills as needed:
     - `moss-database-migration` for user preference column
     - `moss-api-endpoint` for PATCH /api/users/preferences
     - `moss-component-builder` for Toggle component
     - `moss-form-builder` for settings page integration
   - Implements feature following M.O.S.S. patterns
   - Updates active-feature.md with implementation notes

4. **Tester** (`moss-tester`)
   - Invokes `moss-uat-generator` to create test cases
   - Runs tests using Playwright MCP
   - Reports results in active-feature.md
   - If failures: Engineer fixes and re-tests (max 3 attempts)

5. **Visual Check** (Manual or `moss-visual-check` skill)
   - Verifies design system compliance
   - Checks colors, typography, spacing, accessibility
   - Reports violations if any

6. **Git Controller** (`moss-git-controller`)
   - Commits changes with proper message
   - Creates pull request
   - Links PR to feature task list

7. **Documentation Updater** (`moss-documentation-updater`)
   - Updates COMPONENTS.md, planning/*.md files
   - Updates CLAUDE-UPDATES.md with session summary
   - Marks feature complete in CLAUDE-TODO.md
   - Archives active-feature.md to completed-features.md

## Best Practices

### For Claude Instances

**Starting Work**:
1. Read `CLAUDE-TODO.md` to understand current state
2. Check `.claude/task-lists/active-feature.md` for active work
3. Read `CLAUDE-UPDATES.md` for recent context

**During Work**:
- Use skills proactively when their purpose matches your task
- Update `active-feature.md` as you progress
- Invoke `moss-visual-check` AFTER creating/modifying UI components
- Invoke `moss-uat-generator` AFTER implementing any feature

**Completing Work**:
- Mark tasks complete in `active-feature.md`
- Update `CLAUDE-UPDATES.md` with session summary
- Update `CLAUDE-TODO.md` to reflect progress

### For Developers

**Configuration**:
- Customize `settings.local.json` for personal preferences
- Don't commit `settings.local.json` (gitignored)

**Task Lists**:
- Review `.claude/task-lists/active-feature.md` before starting work
- Update status as you progress
- Archive completed features

## Configuration

### settings.local.json

Example configuration:
```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "autoSave": true
}
```

## Maintenance

### Keeping Task Lists Clean

**When CLAUDE-TODO.md gets too long**:
- Archive completed phases to `planning/completed-phases.md`
- Focus on current and next phase only

**When active-feature.md is abandoned**:
- Move to `.claude/task-lists/abandoned-features.md`
- Document why it was abandoned

**When completed-features.md gets large**:
- Keep last 10 features only
- Archive older ones to `docs/feature-history.md`

## Getting Help

- **Claude Code docs**: https://docs.claude.com/en/docs/claude-code
- **M.O.S.S. project context**: Read `CLAUDE.md` in project root
- **Design system**: See `planning/designguides.md`
- **Database architecture**: See `planning/database-architecture.md`
- **UI specifications**: See `planning/ui-specifications.md`

## Version History

- **2025-10-26**: Created comprehensive README system, streamlined TODO/UPDATES files
- **2025-10-18**: Added 8 M.O.S.S. skills for consistency and quality
- **2025-10-12**: Initial agent system for workflow automation
