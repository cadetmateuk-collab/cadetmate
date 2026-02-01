import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this to skip all type checking
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;