/**
 * Dashboard Stats API Route
 * Returns quick stats for dashboard widgets
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

interface DashboardStats {
  devices: number
  people: number
  locations: number
  networks: number
  software: number
  saas_services: number
  documents: number
  contracts: number
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pool = getPool()

    // Query all counts in parallel for better performance
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
      pool.query('SELECT COUNT(*) as count FROM devices'),
      pool.query('SELECT COUNT(*) as count FROM people'),
      pool.query('SELECT COUNT(*) as count FROM locations'),
      pool.query('SELECT COUNT(*) as count FROM networks'),
      pool.query('SELECT COUNT(*) as count FROM software'),
      pool.query('SELECT COUNT(*) as count FROM saas_services'),
      pool.query('SELECT COUNT(*) as count FROM documents'),
      pool.query('SELECT COUNT(*) as count FROM contracts'),
    ])

    const stats: DashboardStats = {
      devices: parseInt(devicesResult.rows[0].count),
      people: parseInt(peopleResult.rows[0].count),
      locations: parseInt(locationsResult.rows[0].count),
      networks: parseInt(networksResult.rows[0].count),
      software: parseInt(softwareResult.rows[0].count),
      saas_services: parseInt(saasResult.rows[0].count),
      documents: parseInt(documentsResult.rows[0].count),
      contracts: parseInt(contractsResult.rows[0].count),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
