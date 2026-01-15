/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions configuration (no longer experimental in Next.js 14.2+)
  serverActions: {
    bodySizeLimit: '2mb',
  },
  // Remove powered-by header for security
  poweredByHeader: false,
  // Improve page loading
  compress: true,
  // Ensure proper page rendering
  swcMinify: true,
}

module.exports = nextConfig

