/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir as it's no longer needed in Next.js 14
  webpack: (config, { dev }) => {
    // Disable webpack persistent caching in dev to avoid pack restore errors (hasStartTime warning)
    if (dev) {
      config.cache = false
    }
    return config
  }
}

module.exports = nextConfig
