# N+1 Query Pattern Review

## Overview

This document reviews all API routes for N+1 query patterns and provides optimization recommendations. N+1 queries occur when code executes one query to fetch a collection, then N additional queries to fetch related data for each item in the collection.

**Review Date**: 2025-10-11
**Database**: PostgreSQL
**ORM**: Raw SQL queries via `pg` library

## Summary

### Overall Assessment
✅ **Good News**: The codebase is generally well-architected with minimal N+1 issues.

- Most list routes use simple SELECT statements without additional queries
- Junction table routes use proper JOIN statements
- Dashboard stats route uses `Promise.all()` for parallel queries
- No obvious N+1 loops found in code review

### Areas for Optimization

1. **Global Search Route**: 8 sequential queries (can be parallelized)
2. **Potential Future Issues**: When adding related data to list views

---

## Detailed Route Analysis

### ✅ Devices API (`src/app/api/devices/route.ts`)

**Pattern**: Single query with filtering and pagination

```typescript
GET /api/devices
└── SELECT * FROM devices WHERE ... ORDER BY ... LIMIT ... OFFSET ...
```

**Assessment**: ✅ **Optimal**
- No related data fetching
- Single query per request
- Uses indexes for filtering (status, device_type, location_id, etc.)

**Recommendation**: None - already optimal

---

### ✅ Group Members API (`src/app/api/groups/[id]/members/route.ts`)

**Pattern**: Single JOIN query

```typescript
GET /api/groups/:id/members
└── SELECT p.* FROM people p INNER JOIN group_members gm ON p.id = gm.person_id WHERE gm.group_id = $1
```

**Assessment**: ✅ **Optimal**
- Uses INNER JOIN to fetch people with group membership in one query
- No N+1 pattern
- Properly indexed foreign keys

**Recommendation**: None - already optimal

---

### ✅ Dashboard Stats API (`src/app/api/dashboard/stats/route.ts`)

**Pattern**: Parallel queries using `Promise.all()`

```typescript
GET /api/dashboard/stats
├── Promise.all([
│   ├── SELECT COUNT(*) FROM devices
│   ├── SELECT COUNT(*) FROM people
│   ├── SELECT COUNT(*) FROM locations
│   ├── SELECT COUNT(*) FROM networks
│   ├── SELECT COUNT(*) FROM software
│   ├── SELECT COUNT(*) FROM saas_services
│   ├── SELECT COUNT(*) FROM documents
│   └── SELECT COUNT(*) FROM contracts
└── ])
```

**Assessment**: ✅ **Excellent**
- Multiple queries executed in parallel
- Uses `Promise.all()` for concurrent execution
- Significantly faster than sequential queries
- Good pattern to follow for similar use cases

**Recommendation**: None - excellent pattern, use as template for other multi-query routes

---

### ⚠️ Global Search API (`src/app/api/search/route.ts`)

**Current Pattern**: Sequential queries (potential bottleneck)

```typescript
GET /api/search?q=term
├── await query(devices...)      // Query 1
├── await query(people...)       // Query 2
├── await query(locations...)    // Query 3
├── await query(networks...)     // Query 4
├── await query(software...)     // Query 5
├── await query(saas_services...)// Query 6
├── await query(documents...)    // Query 7
└── await query(contracts...)    // Query 8
```

**Assessment**: ⚠️ **Needs Optimization**
- 8 sequential queries executed one after another
- Each query waits for previous to complete
- Total latency = sum of all query times
- Could be 5-8x faster with parallel execution

**Recommended Optimization**:

```typescript
// OPTIMIZED VERSION - Use Promise.all()
const [
  devicesResult,
  peopleResult,
  locationsResult,
  networksResult,
  softwareResult,
  saasResult,
  documentsResult,
  contractsResult
] = await Promise.all([
  pool.query(/* devices query */),
  pool.query(/* people query */),
  pool.query(/* locations query */),
  pool.query(/* networks query */),
  pool.query(/* software query */),
  pool.query(/* saas_services query */),
  pool.query(/* documents query */),
  pool.query(/* contracts query */)
])
```

**Expected Performance Improvement**:
- Current: 8 queries × ~50ms = 400ms total
- Optimized: max(8 queries) = ~50-75ms total
- **Improvement**: 5-8x faster (400ms → 50-75ms)

**Priority**: **Medium**
- Global search is user-facing but not on critical path
- Users expect some latency for search functionality
- Optimization would significantly improve UX

**Implementation Effort**: **Low**
- Simple refactor to use `Promise.all()`
- No schema changes required
- Minimal risk

---

### ✅ Rooms API (`src/app/api/rooms/route.ts`)

**Pattern**: Single query with filtering

```typescript
GET /api/rooms?location_id=...
└── SELECT * FROM rooms WHERE location_id = ... ORDER BY ... LIMIT ... OFFSET ...
```

**Assessment**: ✅ **Optimal**
- Single query per request
- Uses foreign key index on location_id
- No related data fetching

**Recommendation**: None - already optimal

---

## Potential Future N+1 Patterns

### Risk Area: List Views with Related Data

**Scenario**: If we add related data to list views (e.g., showing device location name in device list)

**Anti-Pattern to Avoid**:
```typescript
// ❌ BAD - N+1 Query Pattern
const devices = await query('SELECT * FROM devices')
for (const device of devices.rows) {
  const location = await query('SELECT location_name FROM locations WHERE id = $1', [device.location_id])
  device.location_name = location.rows[0]?.location_name
}
```

**Recommended Pattern**:
```typescript
// ✅ GOOD - JOIN Query
const devices = await query(`
  SELECT
    d.*,
    l.location_name,
    r.room_name,
    p.full_name as assigned_to_name
  FROM devices d
  LEFT JOIN locations l ON d.location_id = l.id
  LEFT JOIN rooms r ON d.room_id = r.id
  LEFT JOIN people p ON d.assigned_to_id = p.id
`)
```

**Guidelines**:
1. Always use JOINs for related data in list views
2. Use LEFT JOIN when relationship is optional (nullable foreign key)
3. Use INNER JOIN when relationship is required
4. Test query performance with EXPLAIN ANALYZE
5. Add composite indexes for JOIN columns if needed

---

## Future Optimization Opportunities

### 1. Implement Query Result Caching

**Cache Candidates**:
- Dashboard stats (cache for 5-15 minutes)
- Dropdown data (device types, statuses, etc.) - cache for 1 hour
- Company/location lists - cache for 30 minutes
- Software catalog - cache for 1 hour

**Recommended Implementation**:
- Use Redis for distributed caching (production)
- Use in-memory cache for development (Map or LRU cache)
- Implement cache invalidation on write operations
- Add cache warming for frequently accessed data

**Example Redis Caching Pattern**:
```typescript
async function getDashboardStats() {
  const cacheKey = 'dashboard:stats'

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Cache miss - query database
  const stats = await fetchDashboardStats()

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(stats))

  return stats
}
```

### 2. Database Read Replicas

**Use Case**: Separate read and write operations

**Benefits**:
- Offload read queries to replica
- Improve write performance on primary
- Better horizontal scaling
- Reduced load on primary database

**Implementation**:
```typescript
// Write operations → Primary DB
await primaryPool.query('INSERT INTO devices ...')

// Read operations → Replica DB
const devices = await replicaPool.query('SELECT * FROM devices')
```

### 3. Connection Pooling Optimization

**Current**: Using `pg` Pool with default settings

**Recommendations**:
- Monitor pool usage: `pool.totalCount`, `pool.idleCount`, `pool.waitingCount`
- Adjust pool size based on actual usage:
  - Development: 5-10 connections
  - Production: 20-50 connections (depends on server specs)
- Set connection timeout: `connectionTimeoutMillis: 5000`
- Enable statement timeout: `statement_timeout: 30000`

**Example Configuration**:
```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                          // Max connections
  idleTimeoutMillis: 30000,        // Close idle connections after 30s
  connectionTimeoutMillis: 5000,   // Timeout if can't get connection
  statement_timeout: 30000,        // Kill queries after 30s
})
```

### 4. Implement Database Query Monitoring

**Recommended Tools**:
- Enable `pg_stat_statements` extension
- Use pgBadger for log analysis
- Set up slow query logging:
  ```sql
  ALTER DATABASE moss SET log_min_duration_statement = 1000; -- Log queries > 1s
  ```

**Monitoring Query**:
```sql
-- Find slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Implement GraphQL DataLoader Pattern (Future)

**Use Case**: If migrating to GraphQL API

**Benefits**:
- Automatic batching of queries
- Built-in caching per request
- Eliminates N+1 queries automatically

**Example**:
```typescript
const locationLoader = new DataLoader(async (ids) => {
  const locations = await query(
    'SELECT * FROM locations WHERE id = ANY($1)',
    [ids]
  )
  return ids.map(id => locations.find(l => l.id === id))
})

// Multiple calls are batched into single query
const location1 = await locationLoader.load(id1)
const location2 = await locationLoader.load(id2)
```

---

## Query Performance Best Practices

### 1. Always Use Prepared Statements
✅ **Good**: `query('SELECT * FROM devices WHERE id = $1', [id])`
❌ **Bad**: `query(\`SELECT * FROM devices WHERE id = '${id}'\`)`

**Benefits**:
- Prevents SQL injection
- Query plan caching
- Better performance

### 2. Use EXPLAIN ANALYZE for Complex Queries

```sql
EXPLAIN ANALYZE
SELECT d.*, l.location_name
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
WHERE d.status = 'active'
ORDER BY d.created_at DESC
LIMIT 50;
```

**Look for**:
- `Seq Scan` (bad - table scan)
- `Index Scan` (good - using index)
- `Nested Loop` (check if JOIN is efficient)
- High `cost` values (indicates expensive query)

### 3. Add Indexes for Common Queries

**Already Indexed** (from migration 004):
- Foreign keys (location_id, room_id, etc.)
- Timestamp fields (created_at, updated_at)
- Name fields (hostname, full_name, etc.)
- Status fields
- Composite indexes for common filters

**Monitor Index Usage**:
```sql
SELECT
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY idx_scan;
```

**Remove Unused Indexes**:
- Indexes with 0 scans waste disk space and slow writes
- Review quarterly and remove unused indexes

### 4. Use Pagination for Large Result Sets

✅ **All list routes already implement pagination**:
```typescript
LIMIT $1 OFFSET $2
```

**Best Practices**:
- Default limit: 50 items
- Max limit: 1000 items
- Use cursor-based pagination for very large datasets (future)

### 5. Avoid SELECT *

**Current State**: Many routes use `SELECT *`

**Recommendation**: ⚠️ **Future Optimization**
- Select only needed columns
- Reduces network transfer
- Improves query performance
- Especially important for tables with large text fields

**Example**:
```typescript
// ✅ GOOD - Select only needed columns
SELECT id, hostname, device_type, status FROM devices

// ❌ LESS OPTIMAL - Fetches all columns including large notes field
SELECT * FROM devices
```

**Priority**: **Low**
- Current impact is minimal with current data volumes
- Consider when optimizing specific slow queries
- More important for tables with JSONB or large TEXT columns

---

## Testing for N+1 Queries

### Manual Testing

1. **Enable PostgreSQL Query Logging**:
   ```sql
   ALTER DATABASE moss SET log_statement = 'all';
   ```

2. **Make API Request**:
   ```bash
   curl http://localhost:3001/api/devices?limit=50
   ```

3. **Check Logs** for multiple queries:
   - ✅ Expected: 2 queries (COUNT + SELECT)
   - ❌ Problem: 51+ queries (1 for list + 50 for related data)

4. **Disable Logging**:
   ```sql
   ALTER DATABASE moss RESET log_statement;
   ```

### Automated Testing

**Tool Recommendation**: `pg-query-stream` with query counter

```typescript
// Test helper
class QueryCounter {
  count = 0

  async query(sql: string, params: any[]) {
    this.count++
    return await pool.query(sql, params)
  }

  reset() {
    this.count = 0
  }
}

// Test
test('Device list should execute 2 queries max', async () => {
  const counter = new QueryCounter()
  await getDevices({ limit: 50 }, counter)
  expect(counter.count).toBeLessThanOrEqual(2)
})
```

---

## Migration Path

### Phase 1: Quick Wins (Low Effort, High Impact)
- [ ] Optimize global search with `Promise.all()` ✅ **Recommended**
- [ ] Add query logging for development
- [ ] Document query patterns for team

### Phase 2: Infrastructure (Medium Effort, High Impact)
- [ ] Implement Redis caching for dashboard stats
- [ ] Set up connection pooling optimization
- [ ] Enable `pg_stat_statements` for monitoring

### Phase 3: Advanced Optimization (High Effort, Medium Impact)
- [ ] Implement query result caching (Redis)
- [ ] Add read replicas for production
- [ ] Migrate SELECT * to explicit column lists
- [ ] Implement cursor-based pagination for large tables

---

## Conclusion

**Current State**: ✅ Well-architected with minimal N+1 issues

**Key Findings**:
1. Most routes are already optimized
2. Dashboard stats uses excellent parallel query pattern
3. Search route has optimization opportunity (8x faster possible)
4. No critical N+1 issues found in code review
5. Performance indexes (migration 004) will significantly improve existing queries

**Immediate Action Items**:
1. ✅ **Apply Performance Index Migration** (migration 004) - Expected 50-95% query improvement
2. ⚠️ **Optimize Global Search** (src/app/api/search/route.ts) - 5-8x faster
3. 📋 **Implement Query Monitoring** - Track slow queries in production

**Long-Term Strategy**:
- Implement Redis caching for frequently accessed data
- Monitor query performance with pg_stat_statements
- Add database read replicas for production scaling
- Consider GraphQL DataLoader pattern if migrating to GraphQL

## Resources

- PostgreSQL Performance Tips: https://www.postgresql.org/docs/current/performance-tips.html
- N+1 Query Pattern: https://www.sitepoint.com/silver-bullet-n1-problem/
- pg_stat_statements: https://www.postgresql.org/docs/current/pgstatstatements.html
- Connection Pooling: https://node-postgres.com/features/pooling
- Redis Caching Strategies: https://redis.io/docs/manual/patterns/
