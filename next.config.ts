import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Enable standalone output for Docker deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://moss:moss_dev_password@192.168.64.2:5432/moss',
  },
}

export default nextConfig
