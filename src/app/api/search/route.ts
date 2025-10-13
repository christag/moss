/**
 * Global Search API Route
 * Searches across multiple object types
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

interface SearchResult {
  id: string
  type: string
  name: string
  description?: string
  location?: string
  relevance: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const pool = getPool()
    const searchTerm = `%${query}%`
    const results: SearchResult[] = []

    // Execute all search queries in parallel for better performance
    const [
      devicesResult,
      peopleResult,
      locationsResult,
      networksResult,
      softwareResult,
      saasResult,
      documentsResult,
      contractsResult,
    ] = await Promise.all([
      // Search devices
      pool.query(
        `SELECT id, hostname as name, manufacturer, model,
          ts_rank(to_tsvector('english', COALESCE(hostname, '') || ' ' || COALESCE(manufacturer, '') || ' ' || COALESCE(model, '')), plainto_tsquery('english', $1)) as relevance
        FROM devices
        WHERE hostname ILIKE $2 OR manufacturer ILIKE $2 OR model ILIKE $2 OR serial_number ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search people
      pool.query(
        `SELECT id, full_name, email, job_title,
          ts_rank(to_tsvector('english', full_name || ' ' || COALESCE(email, '')), plainto_tsquery('english', $1)) as relevance
        FROM people
        WHERE full_name ILIKE $2 OR email ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search locations
      pool.query(
        `SELECT id, location_name as name, address, city,
          ts_rank(to_tsvector('english', location_name || ' ' || COALESCE(city, '')), plainto_tsquery('english', $1)) as relevance
        FROM locations
        WHERE location_name ILIKE $2 OR address ILIKE $2 OR city ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search networks
      pool.query(
        `SELECT id, network_name as name, vlan_id, network_address,
          ts_rank(to_tsvector('english', network_name || ' ' || COALESCE(network_address, '')), plainto_tsquery('english', $1)) as relevance
        FROM networks
        WHERE network_name ILIKE $2 OR network_address ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search software
      pool.query(
        `SELECT id, product_name as name, description,
          ts_rank(to_tsvector('english', product_name || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) as relevance
        FROM software
        WHERE product_name ILIKE $2 OR description ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search SaaS services
      pool.query(
        `SELECT ss.id, ss.service_name as name, ss.environment, c.company_name as vendor,
          ts_rank(to_tsvector('english', ss.service_name || ' ' || COALESCE(c.company_name, '')), plainto_tsquery('english', $1)) as relevance
        FROM saas_services ss
        LEFT JOIN companies c ON ss.company_id = c.id
        WHERE ss.service_name ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search documents
      pool.query(
        `SELECT id, title as name, document_type,
          ts_rank(to_tsvector('english', title || ' ' || COALESCE(content, '')), plainto_tsquery('english', $1)) as relevance
        FROM documents
        WHERE title ILIKE $2 OR content ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
      // Search contracts
      pool.query(
        `SELECT ct.id, ct.contract_name as name, c.company_name as vendor, ct.contract_type,
          ts_rank(to_tsvector('english', ct.contract_name || ' ' || COALESCE(c.company_name, '')), plainto_tsquery('english', $1)) as relevance
        FROM contracts ct
        LEFT JOIN companies c ON ct.company_id = c.id
        WHERE ct.contract_name ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3`,
        [query, searchTerm, limit]
      ),
    ])

    // Transform results from each query
    results.push(
      ...devicesResult.rows.map((row) => ({
        id: row.id,
        type: 'device',
        name: row.name,
        description: `${row.manufacturer || ''} ${row.model || ''}`.trim(),
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...peopleResult.rows.map((row) => ({
        id: row.id,
        type: 'person',
        name: row.full_name,
        description: row.job_title || row.email,
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...locationsResult.rows.map((row) => ({
        id: row.id,
        type: 'location',
        name: row.name,
        description: `${row.city || ''}, ${row.address || ''}`.trim().replace(/^,\s*/, ''),
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...networksResult.rows.map((row) => ({
        id: row.id,
        type: 'network',
        name: row.name,
        description: `VLAN ${row.vlan_id || 'N/A'} - ${row.network_address || ''}`.trim(),
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...softwareResult.rows.map((row) => ({
        id: row.id,
        type: 'software',
        name: row.name,
        description: row.description || '',
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...saasResult.rows.map((row) => ({
        id: row.id,
        type: 'saas_service',
        name: row.name,
        description: `${row.vendor || ''} ${row.environment ? '- ' + row.environment : ''}`.trim(),
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...documentsResult.rows.map((row) => ({
        id: row.id,
        type: 'document',
        name: row.name,
        description: row.document_type,
        relevance: parseFloat(row.relevance),
      }))
    )

    results.push(
      ...contractsResult.rows.map((row) => ({
        id: row.id,
        type: 'contract',
        name: row.name,
        description:
          `${row.vendor || ''} ${row.contract_type ? '- ' + row.contract_type : ''}`.trim(),
        relevance: parseFloat(row.relevance),
      }))
    )

    // Sort all results by relevance and group by type
    const sortedResults = results.sort((a, b) => b.relevance - a.relevance)

    // Group results by type
    const groupedResults = sortedResults.reduce(
      (acc, result) => {
        if (!acc[result.type]) {
          acc[result.type] = []
        }
        if (acc[result.type].length < limit) {
          acc[result.type].push(result)
        }
        return acc
      },
      {} as Record<string, SearchResult[]>
    )

    return NextResponse.json({
      query,
      results: groupedResults,
      total: Object.values(groupedResults).reduce((sum, arr) => sum + arr.length, 0),
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
  }
}
