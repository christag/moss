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
- **Admin Settings Panel**: Comprehensive system configuration dashboard for branding, authentication, storage, integrations, and more

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

### Admin Settings

| Object | Purpose |
|--------|---------|
| **SystemSetting** | Key-value configuration store (branding, auth, storage, etc.) |
| **Integration** | External system connections (IdP, MDM, RMM, cloud providers) |
| **IntegrationSyncLog** | Audit trail of synchronization operations |
| **CustomField** | User-defined fields for extensibility |
| **AdminAuditLog** | Complete audit trail of administrative actions |

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
- [x] Groups and group membership
- [x] Networks and network topology
- [x] IOs (interfaces/ports) with connectivity tracking
- [x] IP address management
- [x] Software catalog and SaaS services
- [x] License management
- [x] Documents and contracts
- [x] External documents (links to external systems)
- [x] Authentication (NextAuth.js v5 with credentials provider)
- [x] Enhanced table views with column management and filtering
- [x] Admin panel foundation (layout, routing, auth, database schema)
- [ ] Admin settings implementation (branding, storage, integrations, fields, RBAC)
- [ ] Dashboard with widgets
- [ ] Global search across all objects

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

**Current Version**: Pre-alpha (Phase 0 Complete, Phase 1 ~90% Complete)

### Recent Updates (2025-10-10)

🎉 **Major Milestone: All Core Data Objects Complete!**

✅ **All 16 Core Objects Implemented (Backend + UI + Testing)**
1. **Companies** - 16 fields, 7 company types, enhanced table with column management ✓
2. **Locations** - 12 fields, 5 location types, timezone support ✓
3. **Rooms** - Room hierarchy, floor/capacity tracking ✓
4. **People** - Manager hierarchy, contact info, org structure ✓
5. **Devices** - 17 device types, parent-child relationships, assignment tracking ✓
6. **Groups** - 8 group types (AD, Okta, Jamf, etc.), member management ✓
7. **Networks** - VLAN configuration, subnet tracking ✓
8. **IOs (Interfaces/Ports)** - Universal connectivity tracking (network/broadcast/power) ✓
9. **IP Addresses** - IPv4/IPv6 support, network assignment ✓
10. **Software** - Product catalog, vendor tracking ✓
11. **SaaS Services** - Cloud services, SSO/SCIM configuration ✓
12. **Installed Applications** - Deployment tracking, version management ✓
13. **Software Licenses** - License tracking, seat management ✓
14. **Documents** - Internal documentation, Markdown editor ✓
15. **External Documents** - Links to external systems (vaults, wikis, tickets) ✓
16. **Contracts** - Vendor agreements, renewal tracking ✓

✅ **Authentication System Complete**
- NextAuth.js v5 integration with credentials provider
- Bcrypt password hashing
- Session management with 30-day expiration
- Login/logout functionality
- Protected routes with middleware
- User-to-person relationship (1:1 mapping)
- Role-based access (user, admin, super_admin)

✅ **Admin Panel Foundation Complete**
- Admin panel layout with sidebar navigation (11 sections)
- Admin authentication helpers (requireAdmin, requireSuperAdmin)
- Database schema for system settings, integrations, custom fields
- Admin audit logging system
- TypeScript types and Zod validation schemas
- Route protection for admin panel
- Admin dashboard overview page

✅ **Enhanced UI/UX Features**
- **Enhanced Tables**: All 14 core list pages with column management, sorting, and per-column filtering
- **Dropdown Navigation**: Organized menu structure (Places, Assets, IT Services, Docs & Contracts)
- **Active State Highlighting**: Visual indication of current page in navigation
- **Relationship Panels**: Quick links to related objects on detail pages
- **Status Badges**: Consistent design system colors across all status indicators
- **Mobile-First Design**: Responsive layouts optimized for all devices

✅ **Foundation Complete**
- Next.js 15 + React 19 with App Router
- PostgreSQL database with full schema and foreign key constraints
- Design system implementation with custom CSS (Morning Blue, Brew Black, Off White)
- Core UI component library
- API infrastructure with Zod validation
- Playwright MCP integration for automated testing
- Database rebuild script for quick resets
- Database migrations system

⚠️ **Not production-ready** - Active development in progress

**Key Features Working:**
- All CRUD operations for 16 core object types
- Search and filtering on all list pages
- Enhanced table views with column management
- Relationship dropdowns (companies → locations → rooms → devices → people)
- Detail pages with multiple tabs (Overview, Relationships, History, etc.)
- Create/edit forms with full validation
- Delete with confirmation dialogs and dependency checking
- Parent-child device relationships (chassis/line cards)
- Network topology tracking (IO-to-IO connectivity)
- Software license seat management
- SSO/SCIM configuration for SaaS services

**Phase 1 Remaining Tasks:**
1. Dashboard with widgets (asset summaries, expiring warranties/licenses)
2. Global search across all objects
3. Advanced RBAC implementation (role assignments, object permissions)

**Phase 2 Next Steps:**
1. Network topology visualization (interactive graph)
2. IP address management with subnet visualization
3. Custom reports and dashboards
4. Bulk import/export (CSV)
5. File attachments

See [CLAUDE-TODO.md](CLAUDE-TODO.md) for detailed task tracking and session summaries.
