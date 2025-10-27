# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M.O.S.S. (Material Organization & Storage System) is an open-source IT asset management platform designed as a replacement for IT Glue. It provides comprehensive tracking of hardware, software, networks, SaaS services, and their relationships, with powerful network topology mapping and role-based access control.

**Target Users**: IT departments at mid-size companies with complex infrastructure including traditional IT equipment, broadcast/AV equipment, and cloud services.

## M.O.S.S. Agents & Skills System

**Location**: `.claude/` directory contains agents, skills, and task management files

### Agents (Workflow Automation)
**Location**: `.claude/agents/` - See [.claude/agents/README.md](.claude/agents/README.md) for complete documentation

The project uses 6 specialized agents for workflow automation from planning to deployment:

1. **moss-task-planner** - Maintains TODO lists, breaks down features into tasks
2. **moss-feature-planner** - Designs implementation approach, creates technical specs
3. **moss-engineer** - Implements features following specs from planner
4. **moss-tester** - Runs UAT tests using Playwright MCP, reports failures
5. **moss-git-controller** - Manages commits, PRs, merges
6. **moss-documentation-updater** - Updates docs after feature completion

**When to Use Agents**: For complex multi-step features requiring planning, implementation, testing, and documentation. Agents coordinate with each other to complete features systematically.

### Skills (Specialized Capabilities)
**Location**: `.claude/skills/` - See [.claude/skills/README.md](.claude/skills/README.md) for complete documentation

The project includes 8 specialized skills to ensure consistency and compliance when building M.O.S.S. features:

1. **moss-visual-check** - Verify design system compliance (colors, typography, spacing, component sizing, accessibility)
2. **moss-component-builder** - Build UI components following Figma specs with proper TypeScript, CSS variables, and WCAG AA
3. **moss-form-builder** - Create forms using GenericForm pattern with Zod validation and FieldGroup organization
4. **moss-api-endpoint** - Build REST API routes with NextAuth, RBAC, Zod validation, and standard response format
5. **moss-database-migration** - Create numbered PostgreSQL migrations with UUIDs, timestamps, and proper indexes
6. **moss-uat-generator** - Generate UAT test cases using Playwright MCP for navigation, forms, validation, and accessibility
7. **moss-zod-schema** - Create Zod schemas matching database structure with proper types and validation
8. **moss-relationship-tab** - Add relationship tabs using RelatedItemsList component for object navigation

**When to Use Skills**: Invoke skills proactively when performing specific tasks that require strict adherence to M.O.S.S. patterns and standards. Skills provide step-by-step guidance and ensure consistency.

**Key Differences**:
- **Agents**: Multi-step workflow automation (plan → implement → test → deploy)
- **Skills**: Single-task guidance with strict pattern adherence (build form, check design, create migration)

**How to Use**: Type the agent/skill name (e.g., "moss-visual-check" or "moss-task-planner") or Claude will suggest them automatically.

## M.O.S.S. Agent System

**Location**: `.claude/agents/` (project-level)

The project includes 6 specialized agents that automate the complete feature development lifecycle from planning through deployment. Agents work in a hybrid workflow: core pipeline (Task Planner → Feature Planner → Engineer → Tester loop) runs sequentially, with Git Controller and Documentation Updater running in parallel at completion.

### Agents

1. **moss-task-planner** - Maintains project-wide TODO lists, breaks down user requests into tasks, adapts plans as scope changes
2. **moss-feature-planner** - Reviews project docs, checks for existing patterns, creates detailed implementation plans with UAT test cases
3. **moss-engineer** - Implements features exactly as planned, invokes skills proactively, verifies builds and linting
4. **moss-tester** - Runs UAT tests via Playwright MCP, documents results with screenshots, auto-retries on failure (up to 2 times)
5. **moss-git-controller** - Creates branches, commits with proper messages, pushes to GitHub, verifies workflows, creates PRs
6. **moss-documentation-updater** - Updates /docs, README.md, CLAUDE.md with current state, archives completed task lists

### Agent Workflow

```
User Feature Request
    ↓
1. moss-task-planner
   - Updates CLAUDE-TODO.md
   - Creates .claude/task-lists/active-feature.md
    ↓
2. moss-feature-planner
   - Reviews project documentation
   - Checks for existing patterns
   - Creates implementation plan
   - Generates UAT test cases
    ↓
3. moss-engineer
   - Implements feature as planned
   - Invokes moss-* skills
   - Runs build & lint
    ↓
4. moss-tester
   - Runs UAT tests via Playwright
   - ✅ PASS → Continue to parallel execution
   - ❌ FAIL (attempt 1-2) → Back to step 2
   - ❌ FAIL (attempt 3) → Report to user
    ↓
   [Parallel Execution]
    ↓                              ↓
5. moss-git-controller        6. moss-documentation-updater
   - Create feature branch       - Update docs/COMPONENTS.md
   - Commit changes              - Update README.md roadmap
   - Push to GitHub              - Update planning/*.md
   - Create PR                   - Add CLAUDE-UPDATES.md entry
   - Verify workflows            - Archive task to completed-features.md
```

### Task List Management

**Two-tier system**:
- **CLAUDE-TODO.md** - Manual high-level planning and project roadmap (maintained by user and moss-task-planner)
- **.claude/task-lists/active-feature.md** - Agent-managed feature-specific task list (created by moss-task-planner, used by all agents)
- **.claude/task-lists/completed-features.md** - Archive of completed features (maintained by moss-documentation-updater)

### How to Use Agents

**Option 1: Invoke agents manually**
```
User: "Add a dark mode toggle to settings"
Claude invokes: moss-task-planner
[Agent creates task breakdown]
Claude invokes: moss-feature-planner
[Agent creates implementation plan]
Claude invokes: moss-engineer
[Agent implements feature]
Claude invokes: moss-tester
[Agent runs tests]
Claude invokes in parallel: moss-git-controller, moss-documentation-updater
```

**Option 2: Let Claude orchestrate** (recommended)
```
User: "Add a dark mode toggle to settings"
Claude: "I'll use the M.O.S.S. agent system to implement this feature"
[Claude automatically invokes agents in sequence]
```

### Agent Outputs

Each agent updates `.claude/task-lists/active-feature.md` with its progress:
- **Task Planner**: Adds task breakdown with estimates
- **Feature Planner**: Adds implementation plan and UAT test cases
- **Engineer**: Adds implementation notes and file changes
- **Tester**: Adds test results with pass/fail status and screenshots
- **Git Controller**: Adds branch name, commit hash, and PR URL
- **Documentation Updater**: Archives task to completed-features.md

### When Agents Invoke Skills

Agents automatically invoke M.O.S.S. skills as part of their workflow:
- **moss-feature-planner** → Invokes `moss-uat-generator` to create test cases
- **moss-engineer** → Invokes `moss-database-migration`, `moss-api-endpoint`, `moss-zod-schema`, `moss-form-builder`, `moss-component-builder`, `moss-relationship-tab`, and `moss-visual-check` as needed

### Retry Logic

**moss-tester** automatically handles test failures:
- **Attempt 1 fails** → Triggers moss-feature-planner to re-plan → moss-engineer re-implements → moss-tester re-tests
- **Attempt 2 fails** → Same retry loop
- **Attempt 3 fails** → Halts pipeline, reports to user for manual intervention

### Success Criteria

A feature is complete when:
- ✅ All UAT tests pass
- ✅ Build passes with 0 errors
- ✅ Lint passes with ≤20 warnings
- ✅ PR created and workflows pass
- ✅ Documentation updated
- ✅ Task list archived

## Development Workflow

**CRITICAL**: Follow this workflow for EVERY development task:

### Task Tracking System

**All TODO items are managed in [CLAUDE-TODO.md](CLAUDE-TODO.md)** - This is the single source of truth for all pending work.

- **BEFORE starting ANY task**: Read [CLAUDE-TODO.md](CLAUDE-TODO.md) to understand current state and pending tasks
- **AFTER completing EACH task**:
  - ✅ **Mark completed items with strikethrough** or move to completed section
  - ➕ **Add new tasks discovered during implementation** to the appropriate section
  - 🚨 **Note any blockers or issues encountered**
  - 📝 **Update priority if needed**
  - 🔄 **Keep the file current and accurate** - this is critical for continuity

**Session Documentation in [CLAUDE-UPDATES.md](CLAUDE-UPDATES.md)** - Document completed work here for future LLM context:
- After completing a significant milestone or work session
- Write comprehensive session summaries with what was accomplished
- Include key decisions, patterns established, and lessons learned
- This helps future Claude instances quickly understand project history and context
- Format: Date, milestone description, files changed, key learnings

### Testing Workflow

- **AFTER implementing ANY feature or change**: Use Playwright MCP tools to test
- **Testing Requirements**:
  - Navigate to the affected page(s) using `mcp__playwright__browser_navigate`
  - Take screenshots using `mcp__playwright__browser_take_screenshot` to verify visual correctness
  - Use `mcp__playwright__browser_snapshot` for accessibility verification
  - Interact with new features using click, type, fill_form tools
  - Verify forms submit correctly and validation works
  - Check responsive behavior if applicable
  - Test error states and edge cases
- **Document Test Results**: Update CLAUDE-TODO.md with test outcomes

### Why This Matters

- **CLAUDE-TODO.md** prevents duplicating work and losing track of progress
- **CLAUDE-UPDATES.md** provides rich context for future Claude sessions
- Playwright testing catches issues before the user discovers them
- Systematic testing ensures consistent quality across features
- Documentation of test results helps track what's been verified
- Striking through completed tasks maintains clear progress tracking

### Container Management (MANDATORY)

**CRITICAL**: On macOS, ALWAYS use Apple's container system instead of Docker:

- ✅ **Correct**: `container run postgres`
- ❌ **Wrong**: `docker run postgres` or `docker container run postgres`

**Container Commands**:
- Use `container` command for all container operations
- This applies to running containers, managing images, and all Docker-equivalent operations
- Examples:
  - `container run` instead of `docker run`
  - `container ps` instead of `docker ps`
  - `container stop` instead of `docker stop`
  - `container compose up` instead of `docker compose up`

**Why**: Apple's native container system is optimized for macOS and should be used instead of Docker Desktop.

## Coding Standards (CRITICAL)

**MANDATORY**: Follow these coding standards to prevent lint errors and maintain code quality. The project uses ESLint with strict rules and Husky pre-commit hooks that will block commits with lint errors.

### Next.js Best Practices

1. **Internal Navigation - ALWAYS use `<Link>`**:
   - ✅ **Correct**: `import Link from 'next/link'` then `<Link href="/page">Text</Link>`
   - ❌ **Wrong**: `<a href="/page">Text</a>` (will cause ESLint error: `@next/next/no-html-link-for-pages`)
   - **External links**: Use `<a>` with `target="_blank" rel="noopener noreferrer"`
   - **Why**: Next.js Link provides client-side navigation and prefetching

2. **Image Optimization**:
   - ✅ **Correct**: `import Image from 'next/image'` then `<Image src="..." alt="..." width={} height={} />`
   - ❌ **Wrong**: `<img src="..." />` (will cause ESLint warning)
   - **Why**: Next.js Image component provides automatic optimization

3. **Client Components**:
   - Always add `'use client'` directive at the top of files using React hooks (useState, useEffect, etc.)
   - Server components are the default in Next.js 13+ App Router

### TypeScript Standards

1. **Type Safety**:
   - Avoid `any` types - use proper TypeScript types or `unknown`
   - Define interfaces for all API responses and component props
   - Use Zod schemas from `src/lib/schemas/` for validation

2. **Imports**:
   - Use `@/` path alias for imports (configured in tsconfig.json)
   - Example: `import { Component } from '@/components/Component'`

### React Best Practices

1. **Accessibility**:
   - Always include `alt` attributes on images
   - Use semantic HTML elements
   - Ensure keyboard navigation works
   - Follow WCAG 2.1 AA standards (see [planning/ui-specifications.md](planning/ui-specifications.md))

2. **Hooks**:
   - Follow Rules of Hooks (only at top level, only in function components)
   - Use `useCallback` and `useMemo` for expensive operations
   - Clean up effects with return functions when needed

### Common ESLint Rules

The project enforces these rules (max-warnings=20):

- **No unused variables**: Remove or prefix with underscore `_`
- **No console.log**: Use proper logging in production code
- **Prefer const**: Use `const` over `let` when variables don't change
- **No explicit any**: Define proper types instead of `any`
- **React hooks dependencies**: Include all dependencies in useEffect/useCallback/useMemo arrays

### Before Committing

1. **ESLint will auto-fix** many issues via lint-staged on commit
2. **If commit fails**: Read the error message, fix the issue, and commit again
3. **Common fixes**:
   - Change `<a href="/internal">` to `<Link href="/internal">`
   - Add missing dependencies to hook dependency arrays
   - Remove unused imports/variables
   - Add proper TypeScript types

### Style Guide

- **Formatting**: Prettier handles this automatically on commit
- **Naming**:
  - Components: PascalCase (e.g., `MyComponent.tsx`)
  - Files: kebab-case for utilities (e.g., `my-utility.ts`)
  - Variables/functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Database: snake_case (all tables and columns)

## Database Architecture

The system uses PostgreSQL with UUID primary keys throughout. The database schema is defined in [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql).

**For detailed database documentation, see [planning/database-architecture.md](planning/database-architecture.md).**

### Core Object Hierarchy

**Physical Infrastructure**:
- `companies` → `locations` → `rooms` → `devices`
- Devices support parent-child relationships (e.g., chassis with line cards via `parent_device_id`)
- Each module can have independent warranty, serial number, and install dates

**Network Infrastructure**:
- `networks` define VLANs and subnets
- `ios` (interfaces/ports) are the universal connectivity object supporting:
  - Network: ethernet, fiber, wifi
  - Broadcast: SDI, HDMI, XLR, coax
  - Power: AC/DC input/output, PoE
  - Infrastructure: patch panel ports
- `ios.connected_to_io_id` creates physical topology (IO-to-IO relationships)
- VLAN configuration via `ios.native_network_id` + `io_tagged_networks` junction table

**People & Access**:
- `people` represents all individuals (employees, contractors, vendor contacts)
- `people.manager_id` creates organizational hierarchy
- `groups` supports multiple types: AD, Okta, Jamf smart groups, custom

**Software & Services**:
- `software` → product catalog (vendor-agnostic)
- `saas_services` → specific service instances (prod/staging/dev environments)
- `installed_applications` → deployed software with version tracking
- `software_licenses` → license management with seat tracking

**Documentation**:
- `documents` → internal documentation (policies, runbooks, diagrams)
- `external_documents` → links to external systems (password vaults, tickets, wikis)
- `contracts` → vendor agreements

**RBAC** (Enhanced - Implemented 2025-10-12):
- `roles` → role definitions (system and custom) with hierarchical inheritance via `parent_role_id`
- `permissions` → granular object-type and action permissions (view, edit, delete, manage_permissions)
- `role_assignments` → assign roles to people/groups with scoping (global, location, specific objects)
- `object_permissions` → object-level overrides for specific items

**For complete database patterns, relationships, and query examples, see [planning/database-architecture.md](planning/database-architecture.md).**

### Database Migrations

**For complete migration documentation, see [MIGRATIONS.md](MIGRATIONS.md).**

M.O.S.S. uses an automated migration system that runs on application boot:

**Auto-Migration Features** (Implemented 2025-10-16):
- ✅ **Automatic on boot**: Migrations run when server starts (no manual intervention)
- ✅ **Migration locking**: Prevents concurrent migrations in multi-container deployments
- ✅ **Retry logic**: Database connection retry with exponential backoff
- ✅ **Version tracking**: SHA-256 checksums validate migration file integrity
- ✅ **Execution tracking**: Records execution time, status, and application version
- ✅ **Graceful failure**: Logs errors but doesn't crash app if migrations fail

**Migration Files**: Located in `/migrations` directory, numbered sequentially (000-020)
- `000_migration_system.sql` - Bootstrap migration with locking and tracking
- `001_initial_schema.sql` - Core tables
- `002_add_authentication.sql` - Users and sessions
- ... (see `/migrations` for full list)
- `020_api_tokens.sql` - Bearer token authentication

**Environment Variables**:
```bash
AUTO_MIGRATE=true                    # Enable auto-migration (default: true)
MIGRATION_TIMEOUT_MS=300000          # 5 minutes max for all migrations
MIGRATION_LOCK_TIMEOUT_MS=30000      # 30 seconds to acquire lock
```

**Manual Commands**:
```bash
npm run db:migrate         # Run all pending migrations
npm run db:status          # Check migration status
npm run db:version         # Get current database version
```

**Admin UI**: Migration status displayed in Admin Dashboard (`/admin`)
- Shows current database version
- Indicates if migrations are pending (yellow badge)
- Links to migration logs

**Creating New Migrations**: See [MIGRATIONS.md](MIGRATIONS.md#creating-new-migrations) for templates and best practices.

## Development Context

**Current Phase**: Phase 1 ~90% complete - All 16 core objects have full CRUD, Enhanced RBAC implemented
**Technology Stack**:
- Database: PostgreSQL (local development)
- Backend: Next.js API Routes (REST)
- Frontend: React/Next.js with TypeScript
- Hosting: Vercel (planned) or Cloudflare Pages/Workers (free tier priority)
- Storage: Local filesystem (production: Cloudflare R2 or S3)
- Authentication: Local database (production: SAML 2.0 with SCIM)

**Constraints**:
- Single developer (IT Director with systems architecture background)
- Must be free/near-free for development phase
- Low-maintenance operational requirements
- Cloudflare free tier preferred for production

## Key Design Principles

1. **Universal IO Object**: The `ios` table handles ALL connection types (network, broadcast, power, data). This enables comprehensive topology mapping across heterogeneous infrastructure.

2. **Relationship-First**: The system is designed to map complex relationships:
   - Physical connectivity (IO-to-IO)
   - Logical relationships (device-to-person, service-to-service)
   - Hierarchical structures (parent devices, manager chains)
   - Documentation associations (multi-object linking)

3. **Modular Equipment Support**: Parent-child device relationships allow independent tracking of chassis and modules with separate warranties and lifecycle management.

4. **Flexibility in Scoping**: RBAC supports global, location-based, and object-specific permissions to accommodate distributed teams and sensitive assets.

5. **Network Topology Generation**: The IO connectivity model enables automated generation of L2/L3 network diagrams, power topology, and broadcast signal flow.

## Important Technical Details

**VLAN Configuration**:
- Access ports: Set `native_network_id` only, `trunk_mode='access'`
- Trunk ports: Set `native_network_id` + add entries to `io_tagged_networks`, `trunk_mode='trunk'`
- Hybrid ports: Both native and tagged VLANs, `trunk_mode='hybrid'`

**Modular Equipment**:
- Parent device (e.g., chassis): `parent_device_id` is NULL
- Child devices (e.g., line cards): `parent_device_id` references parent
- Each module has independent `serial_number`, `warranty_expiration`, `install_date`

**Group-Based Deployments**:
- Applications deployed to groups via `group_installed_applications`
- SaaS access granted via `group_saas_services`
- People inherit access through `group_members`
- Also supports direct person-to-service assignments via `person_saas_services`

**Power Topology**:
- UPS/PDU outputs: `interface_type='power_output'`
- Device PSUs: `interface_type='power_input'`
- Connect via `ios.connected_to_io_id` to map power dependencies
- Track voltage, amperage, wattage, connector types

**Document Associations**:
- Documents can link to multiple object types simultaneously
- Use appropriate junction tables: `document_devices`, `document_networks`, `document_saas_services`, etc.
- External documents support the same multi-object associations

## UI Architecture

**For complete UI specifications, see [planning/ui-specifications.md](planning/ui-specifications.md).**

### Page Structure Pattern

All detail views follow a consistent pattern:
- **Tabs**: Overview (always first) + relationship tabs + history tab (always last)
- **Actions**: Top-right button group (primary action most prominent)
- **Relationships Panel**: Right sidebar with quick links to related objects
- **Quick Stats**: Widget-style summary metrics below header
- **Breadcrumbs**: Full navigation path at top

### List View Pattern

All list views follow this structure:
- **Header**: Title + search box + primary actions (Add, Import, Export)
- **Filters**: Left sidebar (collapsible) or top bar filters
- **View Toggle**: Table vs Card view (where appropriate)
- **Bulk Actions**: Checkbox selection + bulk action dropdown
- **Pagination**: Bottom, default 50 per page

### Relationship Navigation

Every object detail view includes relationship tabs using the **RelatedItemsList** component pattern (`src/components/RelatedItemsList.tsx`):
- Generic component: `RelatedItemsList<T extends { id: string }>`
- API-driven data fetching with loading/error states
- Configurable columns with custom render functions
- Click-through navigation via `linkPattern` (e.g., `/devices/:id`)
- "Add New" button support with pre-populated parent IDs

### Core UI Components (Updated 2025-10-16)

**Complete component reference**: [COMPONENTS.md](COMPONENTS.md)

All components follow Figma design specifications from the `figma/` folder with precise spacing, sizing, and colors.

**Form Components**:
- `Button`: 44px height, black primary (was blue), variants: primary/secondary/outline/destructive
- `Input`: 44px height, white background, #6B7885 border, #E02D3C error state
- `Select`: Same styling as Input with dropdown functionality
- `Checkbox`: 19×19px with custom SVG checkmark, black when checked
- `Textarea`: Auto-height with same styling as Input

**Navigation Components**:
- `Breadcrumb`: 14px font, "/" separator, 8px gap, black links with opacity hover
- `Pagination`: 32×32px buttons, 12px gap, ellipsis for large ranges
- `Footer`: Black background, 4-column grid, legal links, responsive

**New Design System Colors** (from Figma):
- `--color-border-default: #6B7885` - Form input borders
- `--color-error-border: #E02D3C` - Error states (replaced orange)
- `--color-disabled: #CFCFCF` - Disabled elements
- `--color-separator: #C4C4C4` - Horizontal rules

**Testing**: View all components at `/test/components` showcase page

### Design System

**IMPORTANT**: Use the official design system colors from [planning/designguides.md](planning/designguides.md), not arbitrary colors.

**Primary Palette** (should be dominant):
- Morning Blue (#1C7FF2): Primary brand color, main actions, primary buttons, headers
- Brew Black (#231F20): Text, dark UI elements, navigation
- Off White (#FAF9F5): Backgrounds, light UI elements, cards

**Secondary Palette** (accents and states):
- Green (#28C077): Success states, active status
- Lime Green (#BCF46E): Accent highlights
- Light Blue (#ACD7FF): Info states, secondary actions, inactive status
- Orange (#FD6A3D): Warnings, errors, critical states
- Tangerine (#FFBB5C): Attention, high priority

**Typography**:
- Font Family: Inter (all headings and body copy)
- Base: 18px, Ratio: 1.25
- Type Scale: Display (72px), H1 (57.6px), H2 (46px), H3 (36.8px), Body (18px), Small (14.4px)

**For complete design system rules, color combinations, grid system, and accessibility standards, see [planning/designguides.md](planning/designguides.md) and [planning/ui-specifications.md](planning/ui-specifications.md).**

## Admin Settings Panel

**For complete admin panel documentation, see [planning/admin-panel-architecture.md](planning/admin-panel-architecture.md).**

The admin settings panel (`/admin`) provides centralized system configuration accessible only to users with `admin` or `super_admin` roles. The panel uses a sidebar navigation pattern with 11 configuration sections:

1. **Overview** - Dashboard with quick action cards
2. **Branding** - Site name, logo, favicon, color customization
3. **Storage** - Backend selection (local, NFS, SMB, S3-compatible)
4. **Authentication** [Super Admin Only] - Backend selection (local, LDAP, SAML/SSO), MFA settings
5. **Integrations** - External system connections (IdP, MDM, RMM, cloud providers, ticketing)
6. **Fields** - Custom field management per object type
7. **RBAC** [Super Admin Only] - Roles, permissions, assignments, testing (see below)
8. **Import/Export** - CSV upload/download with field mapping
9. **Audit Logs** - Filterable admin action history with before/after comparison
10. **Notifications** - SMTP configuration and notification templates
11. **Backup** - Database backup triggers and restore

**Key Files**:
- `src/middleware.ts` - Route protection
- `src/lib/adminAuth.ts` - Helper functions (`requireAdmin()`, `requireSuperAdmin()`, `logAdminAction()`)
- `src/lib/schemas/admin.ts` - Zod validation schemas
- `src/types/index.ts` - TypeScript types for admin entities

## Enhanced RBAC Implementation

**For complete RBAC documentation, see [planning/rbac-implementation.md](planning/rbac-implementation.md).**

The Enhanced RBAC system provides hierarchical roles with permission inheritance, location-based scoping, and object-level permission overrides. Implementation completed 2025-10-12.

### Core Library: src/lib/rbac.ts

**Key Functions**:
- `checkPermission(userId, action, objectType, objectId?)` - Main permission check
  - Returns: `{ granted: boolean, reason: string, path: string[] }`
  - Checks object permissions first, then role permissions, then denies by default
- `getRoleHierarchy(roleId)` - Gets complete role inheritance chain
- `getRolePermissions(roleId, includeInherited)` - Gets permissions with inheritance flag
- `getUserPermissions(userId)` - Aggregates all permissions from all assigned roles

**Cache Management**:
- In-memory cache with 5-minute TTL
- `invalidateUserCache(userId)` - Called when user's role assignments change
- `invalidateRoleCache(roleId)` - Called when role permissions change
- Cache keys: `user:{userId}:permissions`, `role:{roleId}:permissions`

**Circular Hierarchy Prevention**:
- `checkRoleHierarchyCycle(roleId, parentRoleId)` - Database function validates no cycles
- Called before any parent_role_id update in API

### API Routes

**Base Paths**: `/api/permissions`, `/api/roles`, `/api/role-assignments`, `/api/object-permissions`, `/api/rbac`

All routes require `super_admin` role. See [planning/rbac-implementation.md](planning/rbac-implementation.md) for complete endpoint documentation.

### UI Components

**Key Components**:
- `src/components/PermissionGrid.tsx` - Interactive permission checkbox grid (16 object types × 4 actions)
- `src/components/AssignRoleModal.tsx` - 5-step assignment wizard with scope selection
- `src/components/RoleForm.tsx` - Shared form for role creation/editing

**Admin Pages**:
- `/admin/rbac/roles` - Roles list with search and filters
- `/admin/rbac/roles/[id]` - Role detail with PermissionGrid
- `/admin/rbac/assignments` - Assignments list with revoke functionality
- `/admin/rbac/test` - Permission testing tool for debugging

### Usage Example

```typescript
import { checkPermission } from '@/lib/rbac'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { granted } = await checkPermission(session.user.id, 'delete', 'device', params.id)

  if (!granted) {
    return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 })
  }

  // Proceed with deletion
}
```

## Detailed Documentation References

When working on specific features, refer to these detailed planning documents:

- **Database schema, relationships, queries**: [planning/database-architecture.md](planning/database-architecture.md)
- **UI patterns, components, design system**: [planning/ui-specifications.md](planning/ui-specifications.md)
- **Admin panel features and implementation**: [planning/admin-panel-architecture.md](planning/admin-panel-architecture.md)
- **RBAC system details and usage**: [planning/rbac-implementation.md](planning/rbac-implementation.md)
- **Product requirements and use cases**: [planning/prd.md](planning/prd.md)
- **Design system colors and typography**: [planning/designguides.md](planning/designguides.md)
