import { readFileSync } from 'fs'
import { join } from 'path'
import { getPool } from '../src/lib/db'

async function runSeed() {
  try {
    console.log('Reading seed file...')
    const seedSQL = readFileSync(join(__dirname, 'seed-checkout-test-data.sql'), 'utf8')

    console.log('Executing seed script...')
    const pool = getPool()
    await pool.query(seedSQL)

    console.log('✓ Seed data inserted successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error running seed:', error)
    process.exit(1)
  }
}

runSeed()
