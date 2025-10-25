import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  const pool = getPool();

  try {
    // Check existing users
    const existingUsers = await pool.query('SELECT email, role FROM users ORDER BY email');
    console.log('\n=== Existing Users ===');
    existingUsers.rows.forEach((u: any) => {
      console.log(`  ${u.email} - ${u.role}`);
    });

    // Create test people if they don't exist
    const testPeople = [
      { full_name: 'Test User', email: 'testuser@moss.local', person_type: 'employee', role: 'user' },
      { full_name: 'Test Admin', email: 'testadmin@moss.local', person_type: 'employee', role: 'admin' },
      { full_name: 'Test Super Admin', email: 'testsuperadmin@moss.local', person_type: 'employee', role: 'super_admin' }
    ];

    for (const person of testPeople) {
      // Check if person exists
      const personExists = await pool.query('SELECT id FROM people WHERE email = $1', [person.email]);
      
      let personId;
      if (personExists.rows.length === 0) {
        // Create person
        const personResult = await pool.query(
          'INSERT INTO people (full_name, email, person_type, status) VALUES ($1, $2, $3, $4) RETURNING id',
          [person.full_name, person.email, person.person_type, 'active']
        );
        personId = personResult.rows[0].id;
        console.log(`\nCreated person: ${person.email}`);
      } else {
        personId = personExists.rows[0].id;
        console.log(`\nPerson exists: ${person.email}`);
      }

      // Check if user exists
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [person.email]);
      
      if (userExists.rows.length === 0) {
        // Hash password
        const passwordHash = await bcrypt.hash('password', 10);

        // Create user
        await pool.query(
          'INSERT INTO users (person_id, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
          [personId, person.email, passwordHash, person.role, true]
        );
        console.log(`Created user: ${person.email} with role: ${person.role} and password: password`);
      } else {
        console.log(`User already exists: ${person.email}`);
      }
    }

    // Show final user list
    const finalUsers = await pool.query('SELECT email, role FROM users ORDER BY role, email');
    console.log('\n=== Final Users ===');
    finalUsers.rows.forEach((u: any) => {
      console.log(`  ${u.email} - ${u.role}`);
    });

    await pool.end();
    console.log('\n✓ Test users ready');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUsers();
