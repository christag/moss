/**
 * Setup API Endpoint
 * Handles first-run setup wizard completion
 * Creates admin user, primary company, and system preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkTablesExist } from '@/lib/initDatabase'

// ============================================================================
// Validation Schema
// ============================================================================

const SetupSchema = z
  .object({
    // Admin User
    adminEmail: z.string().email(),
    adminPassword: z.string().min(8),
    adminPasswordConfirm: z.string(),
    adminFullName: z.string().min(1),

    // Primary Company
    companyName: z.string().min(1),
    companyWebsite: z
      .string()
      .optional()
      .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
        message: 'Must be a valid URL or empty',
      }),

    // Primary Location
    locationName: z.string().min(1),
    locationType: z.enum([
      'office',
      'datacenter',
      'colo',
      'remote',
      'warehouse',
      'studio',
      'broadcast_facility',
    ]),
    companyAddress: z.string().optional(),
    companyCity: z.string().optional(),
    companyState: z.string().optional(),
    companyZip: z.string().optional(),
    companyCountry: z.string().optional(),

    // System Preferences
    timezone: z.string(),
    dateFormat: z.string(),
  })
  .refine((data) => data.adminPassword === data.adminPasswordConfirm, {
    message: "Passwords don't match",
    path: ['adminPasswordConfirm'],
  })

// ============================================================================
// GET: Check Setup Status
// ============================================================================

export async function GET() {
  try {
    const pool = getPool()

    // Check if setup is already completed
    const result = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'setup.completed'"
    )

    const setupCompleted = result.rows[0]?.value === true

    return NextResponse.json({
      success: true,
      setupCompleted,
    })
  } catch (error) {
    console.error('[Setup] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check setup status',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST: Complete Setup
// ============================================================================

export async function POST(request: NextRequest) {
  // First, check if database tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database not initialized. Please initialize the database first.',
      },
      { status: 400 }
    )
  }

  const pool = getPool()
  const client = await pool.connect()

  try {
    // Check if setup is already completed
    const setupCheck = await client.query(
      "SELECT value FROM system_settings WHERE key = 'setup.completed'"
    )

    if (setupCheck.rows[0]?.value === true) {
      return NextResponse.json(
        {
          success: false,
          message: 'Setup has already been completed',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SetupSchema.parse(body)

    // Start transaction
    await client.query('BEGIN')

    // ========================================================================
    // 1. Create Primary Company
    // ========================================================================
    console.log('[Setup] Creating primary company...')

    const companyResult = await client.query(
      `INSERT INTO companies (
        company_name,
        company_type,
        website,
        address,
        city,
        state,
        zip,
        country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        validatedData.companyName,
        'own_organization',
        validatedData.companyWebsite || null,
        validatedData.companyAddress || null,
        validatedData.companyCity || null,
        validatedData.companyState || null,
        validatedData.companyZip || null,
        validatedData.companyCountry || null,
      ]
    )

    const companyId = companyResult.rows[0].id

    // ========================================================================
    // 2. Create Primary Location
    // ========================================================================
    console.log('[Setup] Creating primary location...')

    const locationResult = await client.query(
      `INSERT INTO locations (
        company_id,
        location_name,
        location_type,
        address,
        city,
        state,
        zip,
        country,
        timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        companyId,
        validatedData.locationName,
        validatedData.locationType,
        validatedData.companyAddress || null,
        validatedData.companyCity || null,
        validatedData.companyState || null,
        validatedData.companyZip || null,
        validatedData.companyCountry || null,
        validatedData.timezone,
      ]
    )

    const locationId = locationResult.rows[0].id

    // ========================================================================
    // 3. Create Admin Person Record
    // ========================================================================
    console.log('[Setup] Creating admin person record...')

    const personResult = await client.query(
      `INSERT INTO people (
        full_name,
        email,
        person_type,
        company_id,
        status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [validatedData.adminFullName, validatedData.adminEmail, 'employee', companyId, 'active']
    )

    const personId = personResult.rows[0].id

    // ========================================================================
    // 4. Create Admin User Account
    // ========================================================================
    console.log('[Setup] Creating admin user account...')

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.adminPassword, 10)

    const userResult = await client.query(
      `INSERT INTO users (
        person_id,
        email,
        password_hash,
        role,
        is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [personId, validatedData.adminEmail, passwordHash, 'super_admin', true]
    )

    const userId = userResult.rows[0].id

    // ========================================================================
    // 5. Update System Preferences
    // ========================================================================
    console.log('[Setup] Updating system preferences...')

    await client.query(
      `UPDATE system_settings
       SET value = $1
       WHERE key = $2`,
      [JSON.stringify(validatedData.timezone), 'general.timezone']
    )

    await client.query(
      `UPDATE system_settings
       SET value = $1
       WHERE key = $2`,
      [JSON.stringify(validatedData.dateFormat), 'general.date_format']
    )

    // ========================================================================
    // 6. Mark Setup as Complete
    // ========================================================================
    console.log('[Setup] Marking setup as complete...')

    await client.query(
      `UPDATE system_settings
       SET value = $1, updated_by = $2
       WHERE key = 'setup.completed'`,
      [true, userId]
    )

    await client.query(
      `UPDATE system_settings
       SET value = $1
       WHERE key = 'setup.completed_at'`,
      [JSON.stringify(new Date().toISOString())]
    )

    await client.query(
      `UPDATE system_settings
       SET value = $1
       WHERE key = 'setup.completed_by'`,
      [JSON.stringify(userId)]
    )

    // Commit transaction
    await client.query('COMMIT')

    console.log('[Setup] Setup completed successfully!')

    // Create response with setup completion cookie
    const response = NextResponse.json({
      success: true,
      message: 'Setup completed successfully',
      data: {
        userId,
        personId,
        companyId,
        locationId,
      },
    })

    // Set cookie to indicate setup is complete (for middleware)
    // Only use secure flag if actually using HTTPS
    const isSecure =
      request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https://')

    response.cookies.set('moss-setup-completed', 'true', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      path: '/',
    })

    return response
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK')

    console.error('[Setup] POST error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Setup failed',
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
