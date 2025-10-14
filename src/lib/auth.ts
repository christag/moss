/**
 * NextAuth.js v5 Configuration
 * Authentication setup with credentials provider
 */

import NextAuth, { DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getPool } from './db'
import { LoginCredentialsSchema } from './schemas/auth'
import type { UserDetails, UserRole } from '@/types'

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      person_id: string
      email: string
      full_name: string
      role: UserRole
      is_active: boolean
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    email?: string | null
    person_id: string
    full_name: string
    role: UserRole
    is_active: boolean
  }
}

/**
 * Get user details from database by email
 */
async function getUserByEmail(email: string): Promise<UserDetails | null> {
  const pool = getPool()
  const result = await pool.query<UserDetails>(
    'SELECT * FROM user_details WHERE email = $1 AND is_active = true',
    [email]
  )
  return result.rows[0] || null
}

/**
 * Verify user credentials
 */
async function verifyCredentials(email: string, password: string): Promise<UserDetails | null> {
  const pool = getPool()

  // Get user with password hash
  const result = await pool.query<{
    id: string
    password_hash: string
  }>('SELECT id, password_hash FROM users WHERE email = $1 AND is_active = true', [email])

  const user = result.rows[0]
  if (!user) {
    return null
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    return null
  }

  // Update last login
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

  // Get full user details
  return getUserByEmail(email)
}

/**
 * NextAuth.js configuration
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Starting authorization with credentials:', {
            email: credentials?.email,
          })

          // Validate input
          const validatedFields = LoginCredentialsSchema.safeParse(credentials)
          if (!validatedFields.success) {
            console.error('[AUTH] Validation failed:', validatedFields.error)
            return null
          }

          const { email, password } = validatedFields.data
          console.log('[AUTH] Validation passed, verifying credentials for:', email)

          // Verify credentials
          const user = await verifyCredentials(email, password)
          if (!user) {
            console.error('[AUTH] Credential verification failed for:', email)
            return null
          }

          console.log('[AUTH] Login successful for:', email, 'Role:', user.role)

          // Return user object for session
          return {
            id: user.user_id,
            person_id: user.person_id,
            email: user.email,
            name: user.full_name,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active,
          }
        } catch (error) {
          console.error('[AUTH] Authorization error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT token
      if (user) {
        token.id = user.id
        token.person_id = user.person_id
        token.full_name = user.full_name
        token.role = user.role
        token.is_active = user.is_active
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.person_id = token.person_id as string
        session.user.full_name = token.full_name as string
        session.user.role = token.role as UserRole
        session.user.is_active = token.is_active as boolean
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for development (http://localhost)
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  trustHost: true, // Required for Next.js 15
  debug: true, // Enable debug mode to see what's happening
})

/**
 * Server-side auth helpers
 */

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
    super_admin: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Require specific role - throws if user doesn't have role
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth()
  if (!hasRole(session.user.role, role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
  return session
}
