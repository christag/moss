# Seed Data

This directory contains SQL files for populating development databases with sample data.

## Running Seed Data

### Prerequisites

1. PostgreSQL database created and migrations applied
2. Run migrations first: `npm run db:migrate`

### Load Seed Data

```bash
psql -U postgres moss < seeds/001_sample_data.sql
```

## Sample Data Included

### Companies (6 total)
- TechCorp Industries (own organization)
- Dell Technologies, HP Inc., Cisco Systems, Microsoft (vendors/manufacturers)
- Acme Consulting (partner)

### Locations (3 total)
- Headquarters (San Francisco)
- East Coast Office (New York)
- Remote Data Center (Austin)

### Rooms (5 total)
- Server rooms, offices, conference rooms, network closets

### People (5 total)
- Alice Johnson (IT Director) - Admin role
- Bob Smith (Network Administrator) - Editor role
- Carol Williams (Systems Engineer)
- David Brown (Help Desk Specialist)
- Eve Davis (Security Consultant - contractor)

### Networks (4 VLANs)
- Management VLAN (10.0.10.0/24)
- Production VLAN (10.0.20.0/24)
- Guest WiFi (10.0.30.0/24)
- Server VLAN (10.0.100.0/24)

### Devices (9 total)
- 3 network devices (switches, firewall)
- 3 servers (web, database, file)
- 3 workstations (laptops and desktops)

### Network Topology
- Core switch with trunk configuration
- Access switch connected to core
- Servers connected to core switch
- Workstations connected to access switch
- VLAN tagging configured on trunk ports
- IP addresses assigned to all interfaces

### Groups (3 total)
- IT Department
- Network Admins
- Help Desk

### RBAC
- 3 predefined roles (Admin, Editor, Viewer)
- Complete permission set for all object types
- Alice assigned Admin role (global scope)
- Bob assigned Editor role (global scope)

## Using Seed Data

This seed data creates a realistic IT environment for testing:

1. **Test Network Topology**: Follow physical connections between devices via IOs
2. **Test VLAN Configuration**: Trunk ports with multiple VLANs tagged
3. **Test Device Assignment**: Devices assigned to people
4. **Test Organizational Hierarchy**: Manager relationships configured
5. **Test RBAC**: Different permission levels for different users

## Resetting Development Database

To start fresh:

```bash
# Drop and recreate database
dropdb moss
createdb moss

# Run migrations
npm run db:migrate

# Load seed data
psql -U postgres moss < seeds/001_sample_data.sql
```
