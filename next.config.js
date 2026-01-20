/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove powered-by header for security
  poweredByHeader: false,
  // Improve page loading
  compress: true,
  // Ensure proper page rendering
  swcMinify: true,
}

module.exports = nextConfig

