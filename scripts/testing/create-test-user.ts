/**
 * Create Test User Script
 * Creates a test admin user for development and testing
 */

import { getPool } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function createTestUser() {
  const pool = getPool()

  try {
    // First, check if we have any people in the database
    const peopleResult = await pool.query(
      'SELECT id, full_name, email FROM people LIMIT 5'
    )

    console.log('\n=== Available People ===')
    if (peopleResult.rows.length === 0) {
      console.log('No people found in database. Creating a test person first...\n')

      // Create a test person
      const personResult = await pool.query(
        `INSERT INTO people (full_name, email, person_type, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, full_name, email`,
        ['Test Admin', 'admin@moss.local', 'employee', 'active']
      )

      console.log('Created test person:')
      console.log(`  ID: ${personResult.rows[0].id}`)
      console.log(`  Name: ${personResult.rows[0].full_name}`)
      console.log(`  Email: ${personResult.rows[0].email}\n`)

      const personId = personResult.rows[0].id
      const email = personResult.rows[0].email

      // Create user account
      await createUser(pool, personId, email, 'Test123!@#')
    } else {
      // Use first person
      console.log('Found existing people:')
      peopleResult.rows.forEach((person, index) => {
        console.log(`  ${index + 1}. ${person.full_name} (${person.email})`)
      })
      console.log()

      const firstPerson = peopleResult.rows[0]

      // Check if this person already has a user account
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE person_id = $1',
        [firstPerson.id]
      )

      if (existingUser.rows.length > 0) {
        console.log(`User account already exists for ${firstPerson.full_name}`)
        console.log('Skipping user creation.\n')
      } else {
        await createUser(pool, firstPerson.id, firstPerson.email, 'Test123!@#')
      }
    }

    console.log('=== Test User Summary ===')
    console.log('Email: admin@moss.local (or first person email)')
    console.log('Password: Test123!@#')
    console.log('Role: super_admin')
    console.log('\nYou can now login at: http://localhost:3001/login\n')
  } catch (error) {
    console.error('Error creating test user:', error)
    throw error
  } finally {
    await pool.end()
  }
}

async function createUser(
  pool: any,
  personId: string,
  email: string,
  password: string
) {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const userResult = await pool.query(
    `INSERT INTO users (person_id, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role`,
    [personId, email, passwordHash, 'super_admin', true]
  )

  console.log('Created user account:')
  console.log(`  User ID: ${userResult.rows[0].id}`)
  console.log(`  Email: ${userResult.rows[0].email}`)
  console.log(`  Role: ${userResult.rows[0].role}`)
  console.log(`  Password: Test123!@#\n`)
}

// Run the script
createTestUser()
  .then(() => {
    console.log('✓ Test user creation completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('✗ Test user creation failed:', error)
    process.exit(1)
  })
