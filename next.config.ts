/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable standalone output for Docker — creates a self-contained server
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.qrserver.com' },
      // Allow serving receipts from S3
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
