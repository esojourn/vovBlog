/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // 支持更高质量的图像输出
    qualities: [75, 90],
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
