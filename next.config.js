/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
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
