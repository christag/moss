import { getPool } from '@/lib/db'

async function checkTables() {
  const pool = getPool()

  const tables = ['system_settings', 'integrations', 'admin_audit_log', 'custom_fields', 'integration_sync_logs']

  console.log('Checking admin panel database tables...\n')

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`, [table])
      const exists = result.rows[0].exists
      console.log(`${table}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`)

      if (exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`  → ${count.rows[0].count} rows`)
      }
    } catch (error: any) {
      console.log(`${table}: ERROR - ${error.message}`)
    }
  }

  await pool.end()
}

checkTables().catch(console.error)
