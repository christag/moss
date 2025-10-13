# M.O.S.S. Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Cloudflare D1)
- Git

### Initial Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env.local` and update with your database credentials:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/moss
   ```

3. **Set up the database:**

   ```bash
   psql -U postgres -f dbsetup.sql
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
moss/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   └── health/        # Health check endpoint
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/                # UI component library
│   │   ├── forms/             # Form components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Utility functions
│   │   ├── db.ts              # Database connection
│   │   ├── api.ts             # API utilities
│   │   └── validation.ts      # Request validation
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # Core types
│   └── styles/                # Global styles
│       ├── design-system.css  # Design system
│       └── globals.css        # Global CSS imports
├── dbsetup.sql                # Database schema
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── .eslintrc.json             # ESLint configuration
└── .prettierrc                # Prettier configuration
```

## Design System

M.O.S.S. uses a custom design system with:

- **Font:** Inter (loaded via Next.js font optimization)
- **Base font size:** 18px with 1.25 modular scale
- **Color palette:** Morning Blue, Brew Black, Off White (primary), plus Green, Lime Green, Light Blue, Orange, Tangerine (secondary)
- **Grid system:** 8px base unit, responsive 2/3/4/6/12 column grids
- **Components:** Button, Input, Select, Textarea, Badge, Card, Checkbox

See `src/styles/design-system.css` for the complete system.

## UI Components

All components are located in `src/components/ui/` and exported from the index:

```typescript
import { Button, Input, Select, Badge, Card } from '@/components/ui'
```

### Examples

```tsx
// Button
<Button variant="primary" size="md">Click me</Button>

// Input
<Input label="Email" type="email" placeholder="Enter email..." />

// Select
<Select
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>

// Badge
<Badge variant="success">Active</Badge>

// Card
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Database

### Connection

The database connection is managed through a singleton pool in `src/lib/db.ts`:

```typescript
import { query, transaction, getClient } from '@/lib/db'

// Simple query
const result = await query('SELECT * FROM devices WHERE id = $1', [deviceId])

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO ...')
  await client.query('UPDATE ...')
})
```

### Schema

The complete database schema is in `dbsetup.sql`. Key tables:

- **Core:** companies, locations, rooms, people, devices
- **Network:** networks, ios (interfaces), ip_addresses
- **Software:** software, saas_services, installed_applications, software_licenses
- **Groups:** groups, group_members
- **Docs:** documents, external_documents, contracts
- **RBAC:** roles, permissions, role_assignments, object_permissions

## API Structure

API routes follow REST conventions and use standardized response utilities:

```typescript
import { successResponse, errorResponse, validationError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return successResponse(data)
  } catch (error) {
    return errorResponse('Failed to fetch data')
  }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Validation

Request validation uses Zod schemas:

```typescript
import { z } from 'zod'
import { validateRequest, safeValidate } from '@/lib/validation'

const createDeviceSchema = z.object({
  hostname: z.string().min(1),
  device_type: z.enum(['computer', 'server', 'switch']),
  serial_number: z.string().optional(),
})

// In API route
const body = await request.json()
const data = validateRequest(createDeviceSchema, body)
```

## Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier with 100-char line width, single quotes
- **Linting:** ESLint with TypeScript rules
- **Git hooks:** Pre-commit linting and formatting via Husky

## Testing

Jest and React Testing Library are configured:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

Test files should be colocated with components:

```
components/
  ui/
    Button.tsx
    Button.test.tsx
```

## Next Steps (Phase 1)

See `CLAUDE-TODO.md` for the complete development roadmap. Immediate next steps:

1. **Database Setup:**
   - Run dbsetup.sql locally
   - Create seed data
   - Test database migrations

2. **API Development:**
   - Build Companies API endpoints
   - Build Locations API endpoints
   - Build Devices API endpoints

3. **UI Development:**
   - Create generic List View component
   - Create generic Detail View component
   - Create generic Form component

4. **Authentication:**
   - Choose auth provider (NextAuth.js recommended)
   - Implement login/logout
   - Protect API routes

## Contributing

1. Create a feature branch
2. Make changes
3. Ensure tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Format code: `npm run format`
6. Commit changes (pre-commit hooks will run automatically)
7. Push and create pull request

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL in `.env.local`
- Ensure PostgreSQL is running
- Test connection: `curl http://localhost:3000/api/health`

### Build Errors

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript: `npm run type-check`

### Port Already in Use

If port 3000 is in use:

```bash
lsof -ti:3000 | xargs kill -9
```

Or specify a different port:

```bash
PORT=3001 npm run dev
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

---

For project requirements and architecture, see:

- `CLAUDE.md` - Project guidance for Claude Code
- `planning/prd.md` - Product Requirements Document
- `planning/designguides.md` - Design guidelines
- `CLAUDE-TODO.md` - Complete development task list
