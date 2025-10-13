# Caching Guide for M.O.S.S. API

## Overview

M.O.S.S. uses an in-memory LRU cache to reduce database load and improve API response times. The caching layer is implemented in `src/lib/cache.ts` and should be applied consistently across all API endpoints.

## Cache Configuration

- **Max Size**: 1000 entries (configurable)
- **Default TTL**: 60 seconds (configurable per endpoint)
- **Eviction**: LRU (Least Recently Used) when cache is full
- **Cleanup**: Automatic every 5 minutes

## Cache Key Patterns

### List Endpoints
```
{resource}:list:{param1}={value1}&{param2}={value2}
```
Example: `companies:list:page=1&limit=50&sort_by=company_name`

### Detail Endpoints
```
{resource}:detail:{id}
```
Example: `companies:detail:123e4567-e89b-12d3-a456-426614174000`

## Recommended TTL Values

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| **List views** | 30s | Changes frequently (new records, updates) |
| **Detail views** | 60s | More stable, but needs reasonable freshness |
| **Reference data** | 300s (5min) | Rarely changes (companies, locations) |
| **User preferences** | 600s (10min) | Infrequently updated |
| **System config** | 3600s (1hr) | Very rarely changes |

## Implementation Pattern

### GET (List Endpoint)

```typescript
import { cache, generateListCacheKey } from '@/lib/cache'

export async function GET(request: NextRequest) {
  // ... validation ...

  const cacheKey = generateListCacheKey('resource_name', {
    page,
    limit,
    filter1,
    filter2,
    sort_by,
    sort_order,
  })

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return successResponse(cached, 'Data retrieved successfully (cached)')
  }

  // Fetch from database
  const data = await query(...)

  // Cache the response
  cache.set(cacheKey, responseData, 30) // 30 second TTL for lists

  return successResponse(responseData, 'Data retrieved successfully')
}
```

### GET (Detail Endpoint)

```typescript
import { cache, generateDetailCacheKey } from '@/lib/cache'

export async function GET(_request: NextRequest, { params }) {
  const { id } = await params

  // ... validation ...

  const cacheKey = generateDetailCacheKey('resource_name', validatedId)

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return successResponse(cached, 'Data retrieved successfully (cached)')
  }

  // Fetch from database
  const result = await query(...)

  if (result.rows.length === 0) {
    return errorResponse('Not found', undefined, 404)
  }

  const record = result.rows[0]

  // Cache the result
  cache.set(cacheKey, record, 60) // 60 second TTL for details

  return successResponse(record, 'Data retrieved successfully')
}
```

### POST (Create)

```typescript
import { cache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  // ... create logic ...

  // Invalidate list cache (new record affects all list views)
  cache.invalidatePattern('resource_name:list:*')

  return successResponse(newRecord, 'Created successfully', 201)
}
```

### PATCH/PUT (Update)

```typescript
import { cache, generateDetailCacheKey } from '@/lib/cache'

export async function PATCH(request: NextRequest, { params }) {
  const { id } = await params

  // ... update logic ...

  // Invalidate both list and detail caches
  cache.invalidatePattern('resource_name:list:*')
  cache.delete(generateDetailCacheKey('resource_name', id))

  return successResponse(updatedRecord, 'Updated successfully')
}
```

### DELETE

```typescript
import { cache, generateDetailCacheKey } from '@/lib/cache'

export async function DELETE(_request: NextRequest, { params }) {
  const { id } = await params

  // ... delete logic ...

  // Invalidate both list and detail caches
  cache.invalidatePattern('resource_name:list:*')
  cache.delete(generateDetailCacheKey('resource_name', id))

  return successResponse({ id, deleted: true }, 'Deleted successfully')
}
```

## Cache Invalidation Strategies

### Pattern Matching
Use `cache.invalidatePattern()` to clear multiple related keys:

```typescript
// Invalidate all list views for companies
cache.invalidatePattern('companies:list:*')

// Invalidate all companies (list and detail)
cache.invalidatePattern('companies:*')

// Invalidate specific pagination
cache.invalidatePattern('companies:list:page=1*')
```

### Specific Key Deletion
Use `cache.delete()` for a single key:

```typescript
cache.delete(generateDetailCacheKey('companies', companyId))
```

### Clear All
Use `cache.clear()` sparingly (system maintenance):

```typescript
// Clear entire cache (use only for system events)
cache.clear()
```

## Relationship Cache Invalidation

When updating a record that affects related resources:

```typescript
// Example: Updating a location affects devices and rooms
export async function PATCH(request: NextRequest, { params }) {
  // ... update location ...

  // Invalidate location caches
  cache.invalidatePattern('locations:list:*')
  cache.delete(generateDetailCacheKey('locations', id))

  // Invalidate related resource caches
  cache.invalidatePattern('devices:list:*') // Devices may filter by location
  cache.invalidatePattern('rooms:list:*')   // Rooms belong to locations
}
```

## Cache Statistics

Monitor cache effectiveness:

```typescript
import { cache } from '@/lib/cache'

const stats = cache.stats()
console.log('Cache size:', stats.size)
console.log('Max size:', stats.maxSize)
console.log('Keys:', stats.keys)
```

## Best Practices

1. **Always cache GET requests** - Both list and detail endpoints should use caching
2. **Always invalidate on writes** - POST, PATCH, DELETE must clear relevant cache entries
3. **Use conservative TTLs** - Start with shorter TTLs (30s) and increase if safe
4. **Invalidate related caches** - Consider relationship impacts
5. **Include message hints** - Add "(cached)" to success messages for debugging
6. **Test cache behavior** - Verify cache hits/misses during development
7. **Monitor cache size** - Watch for excessive cache growth

## Performance Impact

Expected improvements with caching enabled:

| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| List view (50 records) | ~50-100ms | ~1-5ms | **10-50x faster** |
| Detail view | ~20-40ms | ~1-2ms | **10-20x faster** |
| Repeated queries | Same | Cached | **Eliminates DB load** |

## Production Considerations

### For Production Deployment

Replace the in-memory cache with a distributed cache:

- **Redis** - Recommended for scalability
- **Memcached** - Alternative option
- **CloudFlare KV** - For CloudFlare deployment

### Migration to Redis

```typescript
// src/lib/cache.ts (production version)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

export const cache = {
  async get(key: string) {
    return await redis.get(key)
  },
  async set(key: string, value: any, ttl: number) {
    await redis.setex(key, ttl, JSON.stringify(value))
  },
  async delete(key: string) {
    await redis.del(key)
  },
  async clear() {
    await redis.flushdb()
  },
  async invalidatePattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  },
}
```

## Example: Companies API

See `src/app/api/companies/route.ts` and `src/app/api/companies/[id]/route.ts` for complete caching implementation examples.

## Debugging

### Check if cache is working

```bash
# Make first request (cache miss)
curl http://localhost:3001/api/companies

# Make second request immediately (cache hit)
curl http://localhost:3001/api/companies

# Look for "(cached)" in the message field
```

### Clear cache manually

```typescript
// In browser console or server-side code
import { cache } from '@/lib/cache'
cache.clear()
```

### Monitor cache keys

```typescript
import { cache } from '@/lib/cache'
console.log('Active cache keys:', cache.stats().keys)
```

## Testing Cache Behavior

```typescript
// Test cache hit
const first = await fetch('/api/companies')
const second = await fetch('/api/companies')
expect(second.message).toContain('(cached)')

// Test cache invalidation
await fetch('/api/companies', { method: 'POST', body: {...} })
const third = await fetch('/api/companies')
expect(third.message).not.toContain('(cached)')
```

---

**Status**: Implemented for companies API (example). Roll out to all other endpoints following the same pattern.
