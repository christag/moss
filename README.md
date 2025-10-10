# M.O.S.S.

**Material Organization & Storage System**

An open-source IT asset management and documentation platform for comprehensive hardware, software, and network infrastructure tracking.

---

## Overview

M.O.S.S. is a modern alternative to other IT inventory products, built specifically for IT departments managing complex infrastructure including traditional IT equipment, broadcast/AV systems, and cloud services. It provides a single source of truth for all IT assets, their relationships, and documentation.

### Key Features

- **Comprehensive Asset Tracking**: Manage devices, software, SaaS services, licenses, and contracts
- **Network Topology Mapping**: Visualize network infrastructure from physical interface relationships
- **Universal Interface Model**: Track all connection types (network, broadcast, power, data) in a single unified system
- **Relationship-First Design**: Maintain complex relationships between devices, people, software, networks, and locations
- **Role-Based Access Control**: Granular permissions with global, location-based, and object-specific scoping
- **Modular Equipment Support**: Parent-child relationships for chassis-based systems with independent warranty tracking

---

## Quick Start

### Prerequisites

- PostgreSQL 14+
- Node.js 18+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/moss.git
cd moss

# Set up the database
psql -U postgres -f dbsetup.sql

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Core Concepts

### Universal IO Object

All interfaces, ports, and connectors are tracked through a single `ios` table that handles:
- **Network**: Ethernet, fiber, WiFi with VLAN tagging support
- **Broadcast**: SDI, HDMI, XLR, Coax for AV equipment
- **Power**: AC/DC inputs and outputs for power topology
- **Data**: USB, Thunderbolt, DisplayPort connections

This unified approach enables comprehensive topology mapping across different connection types.

### Template-Driven UI

Rather than unique screens for each object type, M.O.S.S. uses three reusable templates:
- **Generic List View**: Browse and filter any standard object type
- **Generic Detail View**: View/edit complete information with relationship tabs
- **Generic Form**: Create or edit any standard object

Specialized views are only created for unique workflows (network topology, IP management, RBAC configuration).

### Modular Equipment

Devices can have parent-child relationships to represent:
- Chassis-based systems (switches with line cards, blade servers)
- Rack-mounted equipment with independent modules
- Each child module maintains its own warranty, serial number, and lifecycle data

---

## Data Model

### Core Objects

| Object | Purpose |
|--------|---------|
| **Company** | Organizations (your company, vendors, manufacturers) |
| **Person** | All people (employees, contractors, vendor contacts) |
| **Location** | Physical sites and facilities |
| **Room** | Spaces within locations (offices, server rooms, studios) |
| **Device** | All hardware assets with parent-child support |
| **IO** | Universal interface/port/connector object |
| **Network** | Network segments with VLAN configuration |
| **IPAddress** | IP address assignments and allocation |

### Software & Services

| Object | Purpose |
|--------|---------|
| **Software** | Product catalog (independent of deployments) |
| **SaaSService** | Cloud service instances with SSO/SCIM tracking |
| **InstalledApplication** | Deployed software via MDM/GPO |
| **SoftwareLicense** | License tracking with seat counts |

### Access Control

| Object | Purpose |
|--------|---------|
| **Group** | All group types (AD, Okta, Jamf, custom) |
| **Role** | RBAC role definitions |
| **Permission** | Granular permission definitions |
| **RoleAssignment** | User/group-to-role mappings with scoping |
| **ObjectPermission** | Object-level permission overrides |

### Documentation

| Object | Purpose |
|--------|---------|
| **Document** | Internal documentation (policies, runbooks, SOPs) |
| **ExternalDocument** | Links to external systems (password vaults, wikis) |
| **Contract** | Vendor agreements with renewal tracking |

---

## Architecture

### Technology Stack

- **Database**: PostgreSQL with UUID primary keys
- **Backend**: Next.js API Routes with REST conventions
- **Frontend**: React 19 + Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Custom design system CSS
- **Validation**: Zod schemas
- **Testing**: Jest + React Testing Library
- **Hosting**: Cloudflare Pages/Workers (planned)
- **Storage**: Cloudflare R2 for file uploads (planned)

### Design System

- **Font**: Inter family
- **Base Size**: 18px with 1.25 scale ratio
- **Primary Colors**: Morning Blue (#1C7FF2), Brew Black (#231F20), Off White (#FAF9F5)
- **Secondary Colors**: Green (#28C077), Lime Green (#BCF46E), Light Blue (#ACD7FF), Orange (#FD6A3D), Tangerine (#FFBB5C)
- **Grid**: Symmetrical columns with margin = 1/4 column width, gutter = 1/2 margin width

See [styles/design-system.css](styles/design-system.css) for complete implementation.

---

## Roadmap

### Phase 0: Foundation (Completed ✓)

- [x] Database schema design
- [x] Design system implementation
- [x] Next.js 15 + TypeScript setup
- [x] ESLint + Prettier configuration
- [x] Git hooks with Husky
- [x] Jest testing framework
- [x] Core UI component library
- [x] Database connection utilities
- [x] API response utilities
- [x] Request validation with Zod

### Phase 1: Core Features (MVP)
*Target: 3-6 months*

- [x] Basic CRUD operations for Companies, Locations, Rooms, People, Devices
- [x] Relationship management (companies → locations → rooms → devices → people)
- [x] Basic search and filtering on all list pages
- [ ] Groups and group membership
- [ ] Networks and network topology
- [ ] IOs (interfaces/ports) with connectivity tracking
- [ ] IP address management
- [ ] Software catalog and SaaS services
- [ ] License management
- [ ] Documents and contracts
- [ ] Dashboard with widgets
- [ ] Global search across all objects
- [ ] Simple authentication (email/password)
- [ ] Role management (admin, read-only)

### Phase 2: Advanced Features

- [ ] Network topology visualization
- [ ] IP address management with subnet visualization
- [ ] Advanced search and filtering
- [ ] Custom reports and dashboards
- [ ] Granular RBAC with object-level permissions
- [ ] Bulk import/export (CSV)
- [ ] File attachments

### Phase 3: Automation & Integration

**Authentication & Authorization**
- [ ] SAML 2.0 authentication with SCIM integration (Okta, Azure AD, etc.)
- [ ] User and admin provisioning via SCIM
- [ ] Role synchronization from identity provider
- [ ] Group membership sync
- [ ] Automated user lifecycle management

**API & LLM Integration**
- [ ] OpenAPI-compatible REST endpoints for ChatGPT integration
- [ ] MCP (Model Context Protocol) SSE/HTTP server with OAuth2
- [ ] Support for Claude and other LLM clients
- [ ] Structured data access for AI assistants
- [ ] Context-aware API documentation

**External Integrations**
- [ ] Active Directory sync
- [ ] MDM integration (Jamf, Intune)
- [ ] Cloud provider APIs (AWS, Azure, GCP)
- [ ] SNMP/SSH polling for network devices
- [ ] Automated warranty/license expiration alerts
- [ ] Webhook support for external systems

---

## Use Cases

### Network Troubleshooting
1. Search for user → view assigned device
2. View device network interfaces with IP addresses
3. Click interface → view connected switch port
4. View VLAN configuration and trunk mode
5. Trace to upstream router interface
6. Generate visual topology to identify misconfiguration

### License Audit
1. Search for software (e.g., "Adobe Creative Cloud")
2. View SaaS service showing total licensed seats
3. Review assigned users and group memberships
4. Identify unused licenses
5. Right-size contract or reclaim licenses

### Power Redundancy Planning
1. View all UPS devices in data center location
2. For each UPS, view powered devices via power IOs
3. Calculate total wattage per UPS
4. Identify single-PSU devices (risk)
5. Plan redundant power paths
6. Generate power topology diagram

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Code Style

- Follow the established design system for all UI components
- Use TypeScript for type safety
- Write tests for new features
- Update documentation for API changes

---

## License

**GNU Affero General Public License v3.0 (AGPL-3.0)**

M.O.S.S. is free and open-source software licensed under AGPL-3.0. You are free to use, modify, and distribute this software under the following conditions:

- ✅ **Free for internal business use** - IT departments can deploy and use M.O.S.S. within their organizations
- ✅ **Free for personal use** - Individuals can use M.O.S.S. for personal projects
- ✅ **Modifications must be shared** - If you modify the code and run it as a service, you must share your changes
- ❌ **No commercial SaaS reselling** - You cannot sell M.O.S.S. as a hosted service to others

The AGPL-3.0 ensures that M.O.S.S. remains free and open-source, while preventing commercial exploitation through SaaS offerings.

See [LICENSE](LICENSE) for full legal terms

---

## Acknowledgments

- Named for Maurice Moss from *The IT Crowd*
- Design themes based on Morning Brew

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/moss/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/moss/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/moss/wiki)

---

## Status

**Current Version**: Pre-alpha (Phase 0 Complete, Phase 1 in progress)

### Recent Updates (2025-10-09)

✅ **Five Core Objects Complete (Backend + UI + Testing)**
- **Companies**: Full CRUD with 16 fields, complete UI with list/detail/edit pages, Playwright tested ✓
- **Locations**: Full CRUD with 12 fields, complete UI with location types and timezone support, Playwright tested ✓
- **Rooms**: Full CRUD with room_name/room_number/notes, complete UI with location hierarchy, Playwright tested ✓
- **People**: Full CRUD with full_name/username/mobile, complete UI with org hierarchy, Playwright tested ✓
- **Devices**: Full CRUD with 24 fields, complete UI with 17 device types, Playwright tested ✓

✅ **Navigation & Design System**
- Top navigation bar with user menu and active page highlighting
- Blue page headers (Morning Blue #1C7FF2) with off-white content sections
- Consistent list/detail/edit page patterns across all objects
- Status badges with proper design system colors
- Responsive layouts with mobile-first approach

✅ **Database Schema Alignment Complete**
- Rebuilt database from dbsetup.sql as single source of truth
- All backend code (Types, Schemas, API routes) matches database exactly
- Comprehensive seed data for development and testing
- Database rebuild script for quick resets

✅ **Foundation Complete**
- Next.js 15 + React 19 with App Router
- PostgreSQL database with full schema and foreign key constraints
- Design system implementation with custom CSS
- Core UI component library
- API infrastructure with Zod validation
- Playwright MCP integration for automated testing
- Database rebuild script for quick resets

⚠️ **Not production-ready** - Active development in progress

**Completed Modules (Full Stack + Testing):**
1. **Companies** - 16 fields, 7 company types, search/filter, full CRUD tested
2. **Locations** - 12 fields, 5 location types, timezone support, full CRUD tested
3. **Rooms** - Room hierarchy, floor/capacity tracking, full CRUD tested
4. **People** - Manager hierarchy, contact info, org structure, full CRUD tested
5. **Devices** - 17 device types, 4 status types, parent-child relationships, assignment tracking, full CRUD tested

**Key Features Working:**
- Search and filtering on all list pages
- Relationship dropdowns (companies → locations → rooms → devices → people)
- Detail pages with multiple tabs (Overview, Hardware, Assignment, Dates, etc.)
- Create/edit forms with full validation
- Status badges with design system colors
- Delete with confirmation dialogs and dependency checking

**Next Steps:**
1. Continue with Groups (section 1.7)
2. Build Networks and IOs for topology mapping
3. Implement Software, SaaS Services, and License management
4. Build Dashboard and Global Search
5. Implement authentication and RBAC

See [CLAUDE-TODO.md](CLAUDE-TODO.md) for detailed task tracking and session summaries.
