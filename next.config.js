/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn2.suno.ai', 'cdn1.suno.ai'],
  },
}

module.exports = nextConfig
