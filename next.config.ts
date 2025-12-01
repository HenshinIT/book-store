import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Rewrite old media URLs to API route for backward compatibility
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: '/api/media/serve/:path*',
      },
    ];
  },
};

export default nextConfig;
