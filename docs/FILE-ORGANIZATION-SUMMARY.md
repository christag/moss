# File Organization Summary

This document tracks the reorganization of root directory files for better project structure.

## Changes Made (2025-10-16)

### JavaScript Utilities → `scripts/`

Created organized directory structure:
```
scripts/
├── db/
│   ├── rebuild-database.js      (ACTIVE - npm run db:rebuild)
│   └── check-missing-fk-indexes.js   (ACTIVE - npm run db:check-indexes)
├── security/
│   └── check-legacy-xss.js      (ACTIVE - npm run security:check-xss)
├── archive/
│   ├── check-people-schema.js
│   ├── run-migration-006.js
│   ├── run-migration-010.js
│   ├── run-migration-011.js
│   ├── cleanup-duplicate-hostnames.js
│   ├── dbsetup.sql              (replaced by migrations/)
│   └── rebuild-database.sh      (replaced by .js version)
└── README.md                     (documentation)
```

### Documentation → `docs/`

- `DEPLOYMENT.md` → `docs/DEPLOYMENT.md`
- `DEVELOPMENT.md` → `docs/DEVELOPMENT.md`

### Removed

- `npm-dev.log` - Temporary log file
- `tsconfig.tsbuildinfo` - TypeScript build artifact
- `.DS_Store` - macOS metadata
- `compose.yml` - Old simple version, replaced by docker-compose.yml
- `docker-compose.prod.yml` - Duplicate of docker-compose.yml (unnecessary redundancy)

### Updated `package.json`

Added npm scripts for active utilities:
```json
{
  "scripts": {
    "db:rebuild": "node scripts/db/rebuild-database.js",
    "db:check-indexes": "node scripts/db/check-missing-fk-indexes.js",
    "security:check-xss": "node scripts/security/check-legacy-xss.js"
  }
}
```

## Current Root Directory Structure

```
/
├── .github/              # GitHub Actions, PR templates
├── .husky/               # Git hooks
├── migrations/           # Database migrations (numbered)
├── planning/             # Architecture docs, design guides
├── public/               # Static assets
├── scripts/              # Utility scripts (organized)
├── seeds/                # Database seed data
├── src/                  # Application source code
├── testing/              # UAT test results
├── docs/                 # Deployment and development docs
├── .env.example          # Environment template
├── .env.local            # Local environment (gitignored)
├── .gitignore
├── .prettierrc
├── CLAUDE-TODO.md        # Current tasks
├── CLAUDE-UPDATES.md     # Session summaries
├── CLAUDE.md             # Project instructions for LLM
├── README.md             # Project readme
├── instrumentation.ts    # Next.js boot hook (auto-migrations)
├── jest.config.js        # Jest configuration
├── jest.setup.js         # Jest setup
├── next.config.ts        # Next.js configuration
├── package.json
├── tsconfig.json
├── docker-compose.yml         # Base configuration (production)
├── docker-compose.dev.yml     # Development overrides
└── Dockerfile, .dockerignore
```

## Benefits

1. **Cleaner Root**: Only essential config files remain
2. **Organized Scripts**: Easy to find and maintain utilities
3. **Clear Separation**: Active vs archived scripts
4. **Documented**: README explains each script's purpose
5. **npm Scripts**: Convenient access to useful tools
6. **Better Gitignore**: Prevents build artifacts from being committed

## Docker Compose Cleanup

Consolidated from 4 files to 2:
- **Kept**: `docker-compose.yml` (base/production config)
- **Kept**: `docker-compose.dev.yml` (development overrides)
- **Removed**: `compose.yml` (obsolete simple version)
- **Removed**: `docker-compose.prod.yml` (duplicate of docker-compose.yml)

**Usage:**
```bash
# Production
docker compose up

# Development (with hot reload, different ports)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Future Maintenance

- Keep one-time scripts in `scripts/archive/`
- Add new utilities to appropriate `scripts/` subdirectory
- Update `scripts/README.md` when adding new tools
- Create npm scripts for frequently-used utilities
- Use single docker-compose.yml as base, dev overrides in docker-compose.dev.yml
