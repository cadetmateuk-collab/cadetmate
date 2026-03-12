import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: ['three'],
  serverExternalPackages: ['ws'],
};

export default nextConfig;