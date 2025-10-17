import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Enable standalone output for Docker deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Note: Custom error.tsx and not-found.tsx files handle error pages for App Router
  skipMiddlewareUrlNormalize: true,
  // Note: instrumentation.ts is automatically loaded by Next.js for auto-migrations
  // Don't fail production builds on ESLint warnings
  eslint: {
    ignoreDuringBuilds: false, // Still run ESLint
    // Note: warnings will be shown but won't fail the build
  },
  // Don't fail on TypeScript errors during build (optional, can remove if you want strict checks)
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checks enabled
  },
  // Note: DATABASE_URL and other sensitive runtime variables should NOT be in the 'env' config
  // They should be passed as environment variables at runtime (docker-compose, etc.)
}

export default nextConfig
