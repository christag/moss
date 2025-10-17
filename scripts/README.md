# Scripts Directory

Utility scripts for database management, security auditing, and development tools.

## Active Scripts

### Database Scripts (`db/`)

#### `rebuild-database.js`
**Command:** `npm run db:rebuild`

Drops and recreates the moss database from scratch, running all migrations and seed data.

**Use when:**
- Starting fresh development environment
- Testing migration system
- Recovering from database corruption

**Warning:** This will DELETE all data in the database!

#### `check-missing-fk-indexes.js`
**Command:** `npm run db:check-indexes`

Scans the database for foreign key columns without indexes and generates SQL to create them.

**Use when:**
- Optimizing database performance
- Adding new relationships to schema
- Periodic database health checks

### Security Scripts (`security/`)

#### `check-legacy-xss.js`
**Command:** `npm run security:check-xss`

Scans text fields in the database for potential XSS attack patterns.

**Use when:**
- After importing data from external sources
- Security audits
- Pre-deployment checks

**Patterns checked:**
- `<script`, `javascript:`, `onerror=`, `onload=`, `onclick=`
- `<iframe`, `<embed`, `<object>`, etc.

## Archived Scripts (`archive/`)

These scripts were used for one-time tasks and are kept for historical reference:

- `check-people-schema.js` - One-time schema debugging (2025-10-09)
- `run-migration-006.js` - Manual migration runner (obsolete - use auto-migrations)
- `run-migration-010.js` - Manual migration runner (obsolete - use auto-migrations)
- `run-migration-011.js` - Manual migration runner (obsolete - use auto-migrations)
- `cleanup-duplicate-hostnames.js` - One-time data cleanup (2025-10-12)

**Note:** Archived scripts may have hardcoded connection strings and should not be run without updating them.

## Adding New Scripts

When adding new utility scripts:

1. Place them in the appropriate subdirectory:
   - `db/` - Database operations
   - `security/` - Security auditing
   - `archive/` - One-time or deprecated scripts

2. Add an npm script in `package.json`:
   ```json
   "category:script-name": "node scripts/category/script-file.js"
   ```

3. Update this README with usage instructions

4. Use environment variables for connection strings (avoid hardcoding)
