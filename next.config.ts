import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Enable standalone output for Docker deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Don't fail production builds on ESLint warnings
  eslint: {
    ignoreDuringBuilds: false, // Still run ESLint
    // Note: warnings will be shown but won't fail the build
  },
  // Don't fail on TypeScript errors during build (optional, can remove if you want strict checks)
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checks enabled
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://moss:moss_dev_password@192.168.64.2:5432/moss',
  },
}

export default nextConfig
