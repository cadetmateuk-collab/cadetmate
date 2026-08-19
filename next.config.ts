import type { NextConfig } from "next";
import { ENABLE_DATA_CACHE } from "./lib/dev-cache";

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy — report-friendly baseline.
 * 'unsafe-inline' retained for Next.js / Stripe pricing tables; tighten with nonces later.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com https://*.google-analytics.com",
  isDev
    ? "connect-src 'self' https: http: ws: wss: https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com https:",
  "frame-src 'self' https://js.stripe.com https://*.stripe.com https://www.youtube.com https://youtube.com https://player.vimeo.com",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  ...(isDev
    ? []
    : [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }]),
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    'unexpeditable-sinistral-maverick.ngrok-free.dev',
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: false,
  compress: true,
  poweredByHeader: false,
  transpilePackages: ['three', '@cadet-mate/shared'],
  serverExternalPackages: ['ws'],
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cadetmate.co.uk' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: ENABLE_DATA_CACHE ? 60 * 60 * 24 * 30 : 60,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.cadetmate.co.uk' }],
        destination: 'https://cadetmate.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/free-content',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: '/free-content/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const longCache = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ];
    // Dev: never pin JS/CSS chunks — stale Turbopack assets cause “new HTML / old client” flashes.
    const nextStaticHeaders = isDev
      ? [{ key: 'Cache-Control', value: 'no-cache, max-age=0, must-revalidate' }]
      : longCache;

    const imageHeaders = isDev
      ? [{ key: 'Cache-Control', value: 'no-cache, max-age=0, must-revalidate' }]
      : longCache;

    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/_next/static/(.*)', headers: nextStaticHeaders },
      { source: '/images/(.*)', headers: imageHeaders },
      { source: '/shipimages/(.*)', headers: longCache },
      { source: '/buoyage/(.*)', headers: longCache },
      { source: '/:path*.webm', headers: longCache },
      { source: '/:path*.webp', headers: longCache },
      { source: '/:path*.avif', headers: longCache },
      { source: '/:path*.woff2', headers: longCache },
    ];
  },
};

export default nextConfig;
