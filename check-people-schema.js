/**
 * Check actual people table schema
 */
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://moss:moss_dev_password@192.168.64.2:5432/moss',
})

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'people'
      ORDER BY ordinal_position
    `)

    console.log('People table columns:')
    console.log(result.rows)

    await pool.end()
  } catch (error) {
    console.error('Error:', error.message)
    await pool.end()
  }
}

checkSchema()
