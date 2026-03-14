import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: false,        // moved out of experimental
  transpilePackages: ['three'],
  serverExternalPackages: ['ws'],
  productionBrowserSourceMaps: false,
};

export default nextConfig;