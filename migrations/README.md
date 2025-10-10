# Database Migrations

This directory contains SQL migration files for the M.O.S.S. database schema.

## Running Migrations

### Prerequisites

1. PostgreSQL 14+ installed and running
2. Database created: `createdb moss`
3. Environment variable `DATABASE_URL` set in `.env.local`

### Run All Migrations

```bash
npm run db:migrate
```

### Run Migrations Manually

```bash
psql -U postgres moss < migrations/001_initial_schema.sql
```

## Migration Files

- `001_initial_schema.sql` - Initial database schema with all tables, indexes, and triggers

## Creating New Migrations

1. Create a new file with format: `XXX_description.sql` (e.g., `002_add_audit_table.sql`)
2. Use incrementing numbers to ensure order
3. Include both UP and DOWN migrations if possible
4. Test migrations on a development database before committing

## Migration Tracking

The migration system creates a `schema_migrations` table to track which migrations have been applied.

## Seed Data

See `seeds/` directory for sample data to populate development databases.
