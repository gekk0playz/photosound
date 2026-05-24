/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: { bodyParser: false },
  images: { domains: ['cdn2.suno.ai', 'cdn.midjourney.com'] },
};
module.exports = nextConfig;
