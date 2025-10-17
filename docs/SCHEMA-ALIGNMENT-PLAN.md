# Schema Alignment Plan

## Current Status

The database has been successfully recreated from `dbsetup.sql`. Now all code needs to be updated to match the documented schema.

## Changes Made So Far

✅ **Types Updated** (`src/types/index.ts`):
- Room interface: now uses `room_name`, `room_number`, `notes`
- Person interface: now uses `full_name`, `username`, `mobile`, `preferred_contact_method`, `notes`
- RoomType: added `'closet'` and `'edit_bay'`

## Remaining Work

### 1. Update Room Schemas (`src/lib/schemas/room.ts`)
Change all references from:
- `name` → `room_name`
- Add `room_number` and `notes` fields
- Update RoomType enum to include `'closet'` and `'edit_bay'`

### 2. Update Room API Routes
**File: `src/app/api/rooms/route.ts`**
- Line ~80: Change `name ILIKE` → `room_name ILIKE`
- Line ~42-58: Add `room_number` and `notes` to INSERT
- Update destructuring to include new fields

**File: `src/app/api/rooms/[id]/route.ts`**
- Update fieldMapping to include `room_number` and `notes`
- All references to `name` → `room_name`

### 3. Update Person Schemas (`src/lib/schemas/person.ts`)
Change all references from:
- `first_name`, `last_name` → `full_name`
- Add back: `username`, `mobile`, `preferred_contact_method`, `notes`
- Remove: `room_id`, `end_date` (not in dbsetup.sql)
- Update ListPeopleQuerySchema sort_by to use `full_name`

### 4. Update Person API Routes
**File: `src/app/api/people/route.ts`**
- Line ~78-80: Change search to use `full_name` instead of `first_name`/`last_name`
- Line ~144-159: Update destructuring for new fields
- Line ~207-212: Update INSERT statement columns and values
- Remove `room_id` and `end_date` references

**File: `src/app/api/people/[id]/route.ts`**
- Update fieldMapping (line ~153-169) to use correct fields
- Remove `room_id` validation
- Update search/filter logic

### 5. Update Room Seed Data (`seeds/002_rooms.sql`)
Change all:
- `name` → `room_name`
- Add `room_number` where applicable
- Add `notes` where applicable

Example:
```sql
INSERT INTO rooms (location_id, room_name, room_number, room_type, floor, capacity, access_requirements, notes)
VALUES ('00000000-0000-0000-0001-000000000001', 'Server Room Alpha', '101', 'server_room', '1', NULL, 'Badge access required', 'Primary data center');
```

### 6. Create People Seed Data (`seeds/003_people.sql`)
Rewrite to use:
- `full_name` instead of first_name/last_name
- Include: `username`, `mobile`, `preferred_contact_method`, `notes`
- Remove: `room_id`, `end_date`

### 7. Update UI Components (Lower Priority - Can be done after API works)
All UI components in:
- `src/app/rooms/page.tsx`
- `src/app/rooms/[id]/page.tsx`
- `src/components/RoomForm.tsx`
- `src/app/people/page.tsx`
- `src/app/people/[id]/page.tsx`
- `src/components/PersonForm.tsx`

Need to be updated to use the correct field names.

## Recommended Approach

1. **Phase 1 - Backend (Priority)**
   - Update Room schemas ✓
   - Update Room API routes
   - Update Person schemas
   - Update Person API routes
   - Fix seed data files
   - Run `node rebuild-database.js` again
   - Test APIs with curl

2. **Phase 2 - UI**
   - Update all form components
   - Update all list/detail pages
   - Test with Playwright

## Quick Test Commands

After backend updates:
```bash
# Test rooms API
curl http://localhost:3000/api/rooms | jq '.data.rooms | length'

# Test people API
curl http://localhost:3000/api/people | jq '.data.people | length'

# Check a specific room
curl http://localhost:3000/api/rooms/ROOM_ID | jq '.data'
```

## Files to Modify

- [ ] src/lib/schemas/room.ts
- [ ] src/app/api/rooms/route.ts
- [ ] src/app/api/rooms/[id]/route.ts
- [ ] src/lib/schemas/person.ts
- [ ] src/app/api/people/route.ts
- [ ] src/app/api/people/[id]/route.ts
- [ ] seeds/002_rooms.sql
- [ ] seeds/003_people.sql (create new)
- [ ] src/components/RoomForm.tsx
- [ ] src/app/rooms/page.tsx
- [ ] src/app/rooms/[id]/page.tsx
- [ ] src/components/PersonForm.tsx
- [ ] src/app/people/page.tsx
- [ ] src/app/people/[id]/page.tsx

## Expected Outcome

Once complete:
- ✅ Database schema matches `dbsetup.sql` exactly
- ✅ All TypeScript types match database
- ✅ All API endpoints work with correct column names
- ✅ Seed data loads successfully
- ✅ UI displays and submits correct data
