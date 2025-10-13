/**
 * Bulk Insert Utility
 * Generic function for efficient multi-row INSERT operations
 */

import { PoolClient } from 'pg'
import { query as dbQuery } from '@/lib/db'

/**
 * Performs a bulk INSERT operation for multiple rows
 *
 * @param table - Table name to insert into
 * @param columns - Array of column names
 * @param rows - Array of row objects to insert
 * @param client - Optional PoolClient for transaction support
 * @returns Array of inserted rows
 *
 * @example
 * const devices = [
 *   { hostname: 'server1', device_type: 'server' },
 *   { hostname: 'server2', device_type: 'server' }
 * ]
 * const result = await bulkInsert('devices', ['hostname', 'device_type'], devices)
 */
export async function bulkInsert<T = Record<string, unknown>>(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
  client?: PoolClient
): Promise<T[]> {
  if (rows.length === 0) {
    return []
  }

  if (rows.length > 100) {
    throw new Error('Bulk insert supports maximum 100 rows per call. Split into smaller batches.')
  }

  // Build parameterized query
  // Example: INSERT INTO devices (col1, col2) VALUES ($1, $2), ($3, $4) RETURNING *
  const columnList = columns.join(', ')
  const valuesPlaceholders: string[] = []
  const values: unknown[] = []

  let paramIndex = 1

  for (const row of rows) {
    const rowPlaceholders: string[] = []

    for (const column of columns) {
      rowPlaceholders.push(`$${paramIndex}`)
      // Handle undefined/null values
      values.push(row[column] ?? null)
      paramIndex++
    }

    valuesPlaceholders.push(`(${rowPlaceholders.join(', ')})`)
  }

  const sql = `
    INSERT INTO ${table} (${columnList})
    VALUES ${valuesPlaceholders.join(', ')}
    RETURNING *
  `

  // Execute query with or without transaction client
  if (client) {
    const result = await client.query<T>(sql, values)
    return result.rows
  } else {
    const result = await dbQuery<T>(sql, values)
    return result.rows
  }
}

/**
 * Splits an array into chunks of specified size
 * Useful for processing large datasets in batches
 *
 * @param array - Array to split
 * @param size - Chunk size (max 100 for bulk inserts)
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }

  return chunks
}

/**
 * Extracts values from objects in the order of specified columns
 * Handles null/undefined values consistently
 *
 * @param rows - Array of row objects
 * @param columns - Ordered array of column names
 * @returns Flattened array of values in column order
 */
export function extractValues(rows: Record<string, unknown>[], columns: string[]): unknown[] {
  const values: unknown[] = []

  for (const row of rows) {
    for (const column of columns) {
      values.push(row[column] ?? null)
    }
  }

  return values
}

/**
 * Builds parameterized VALUES clause for bulk INSERT
 *
 * @param rowCount - Number of rows
 * @param columnCount - Number of columns per row
 * @returns Parameterized VALUES string
 *
 * @example
 * buildValuesClause(2, 3) → "($1, $2, $3), ($4, $5, $6)"
 */
export function buildValuesClause(rowCount: number, columnCount: number): string {
  const rows: string[] = []
  let paramIndex = 1

  for (let i = 0; i < rowCount; i++) {
    const placeholders: string[] = []

    for (let j = 0; j < columnCount; j++) {
      placeholders.push(`$${paramIndex}`)
      paramIndex++
    }

    rows.push(`(${placeholders.join(', ')})`)
  }

  return rows.join(', ')
}
