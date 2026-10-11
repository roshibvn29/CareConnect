/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We allow SVG and remote images if needed
  images: {
    domains: ['images.unsplash.com', 'api.dicebear.com'],
  },
};

module.exports = nextConfig;
