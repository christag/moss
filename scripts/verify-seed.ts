import { getPool } from '../src/lib/db'

async function verifySeed() {
  try {
    const pool = getPool()

    console.log('Verifying seed data...\n')

    const companies = await pool.query('SELECT COUNT(*) FROM companies WHERE id = $1', [
      '00000000-0000-0000-0000-000000000001',
    ])
    console.log(`✓ Companies: ${companies.rows[0].count}`)

    const locations = await pool.query('SELECT COUNT(*) FROM locations WHERE id = $1', [
      '00000000-0000-0000-0000-000000000002',
    ])
    console.log(`✓ Locations: ${locations.rows[0].count}`)

    const people = await pool.query(
      'SELECT COUNT(*) FROM people WHERE id IN ($1, $2)',
      ['00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011']
    )
    console.log(`✓ People: ${people.rows[0].count}`)

    const devices = await pool.query(
      'SELECT COUNT(*) FROM devices WHERE id >= $1 AND id <= $2',
      ['00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000109']
    )
    console.log(`✓ Devices: ${devices.rows[0].count}`)

    const deviceList = await pool.query(
      'SELECT hostname, asset_tag, device_type FROM devices WHERE id >= $1 AND id <= $2 ORDER BY hostname',
      ['00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000109']
    )

    console.log('\nDevices in database:')
    deviceList.rows.forEach((d) => {
      console.log(`  - ${d.hostname} (${d.asset_tag}) - ${d.device_type}`)
    })

    console.log('\n✓ All seed data verified!')
    process.exit(0)
  } catch (error) {
    console.error('Error verifying seed:', error)
    process.exit(1)
  }
}

verifySeed()
