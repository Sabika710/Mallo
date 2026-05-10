/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14 stable — no experimental server actions flag needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
