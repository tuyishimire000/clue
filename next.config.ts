import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.pharmaceutical-technology.com',
        pathname: '/wp-content/**',
      },
    ],
  },
}

export default nextConfig

