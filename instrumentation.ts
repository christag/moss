/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both development and production)
 * Used for auto-running database migrations on boot
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  console.log('[Instrumentation] register() called, NEXT_RUNTIME:', process.env.NEXT_RUNTIME)

  // Only run in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Running in Node.js runtime, importing autoMigrate...')
    // Import migration function
    const { autoMigrate } = await import('./src/lib/migrate')

    // Run auto-migration on server startup
    console.log('[Instrumentation] Calling autoMigrate()...')
    await autoMigrate()
    console.log('[Instrumentation] autoMigrate() completed')
  }
}
