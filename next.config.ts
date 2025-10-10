import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://moss:moss_dev_password@192.168.64.2:5432/moss',
  },
}

export default nextConfig
