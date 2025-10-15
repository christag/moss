/**
 * Rebuild Database Script
 * Drops and recreates the moss database from migrations
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Connection to postgres database (not moss)
const adminPool = new Pool({
  host: '192.168.64.2',
  port: 5432,
  user: 'moss',
  password: 'moss_dev_password',
  database: 'postgres', // Connect to postgres DB to drop/create moss DB
})

// Connection to moss database (for running schema)
const mossPool = new Pool({
  host: '192.168.64.2',
  port: 5432,
  user: 'moss',
  password: 'moss_dev_password',
  database: 'moss',
})

async function rebuildDatabase() {
  console.log('=================================')
  console.log('Database Rebuild Script')
  console.log('=================================\n')

  try {
    // Step 1: Drop and recreate the database
    console.log('Step 1: Dropping and recreating moss database...')
    console.log('--------------------------------------------------')

    // Terminate all connections to moss database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'moss'
        AND pid <> pg_backend_pid()
    `)

    // Drop database
    await adminPool.query('DROP DATABASE IF EXISTS moss')
    console.log('✓ Dropped moss database')

    // Create database
    await adminPool.query('CREATE DATABASE moss')
    console.log('✓ Created moss database')

    await adminPool.end()
    console.log('')

    // Step 2: Run migrations
    console.log('Step 2: Running migrations...')
    console.log('------------------------------')

    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && /^\d{3}_/.test(file))
      .sort()

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile)
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8').trim()
      
      // Skip empty files
      if (migrationSQL.length === 0) {
        console.log(`⚠ Skipped ${migrationFile} (empty file)`)
        continue
      }
      
      await mossPool.query(migrationSQL)
      console.log(`✓ Applied ${migrationFile}`)
    }

    console.log('✓ All migrations completed successfully')
    console.log('')

    // Step 3: Run seed data
    console.log('Step 3: Running seed data...')
    console.log('-----------------------------')

    const seedFiles = [
      'seeds/001_companies_locations.sql',
      'seeds/002_rooms.sql',
      'seeds/003_people.sql',
    ]

    for (const seedFile of seedFiles) {
      const seedPath = path.join(__dirname, seedFile)
      if (fs.existsSync(seedPath)) {
        const seedSQL = fs.readFileSync(seedPath, 'utf8')
        await mossPool.query(seedSQL)
        console.log(`✓ Loaded ${seedFile}`)
      } else {
        console.log(`⚠ Skipped ${seedFile} (not found)`)
      }
    }

    await mossPool.end()

    console.log('')
    console.log('=================================')
    console.log('Database rebuild complete!')
    console.log('=================================\n')
    console.log('✓ Database recreated from migrations')
    console.log('✓ Seed data loaded: companies, locations, rooms')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Restart Next.js dev server')
    console.log('  2. Test application functionality')
    console.log('  3. Check database connections')

  } catch (error) {
    console.error('❌ Error rebuilding database:', error.message)
    console.error(error)
    process.exit(1)
  }
}

rebuildDatabase()
