/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1920],
    imageSizes: [256, 320, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },
  turbopack: {
    root: '.',
  },
  outputFileTracingIncludes: {
    '/': ['./content/**/*'],
    '/api/**': ['./content/**/*'],
    '/blog/**': ['./content/**/*'],
  },
}

module.exports = nextConfig
