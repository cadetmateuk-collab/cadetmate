import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';

/**
 * Google Search Console crawler rules.
 * Keep Disallow paths aligned with noIndex app areas to protect crawl budget.
 *
 * Important: `/community` (no slash) would also block `/community-preview` —
 * use `/community/` for the logged-in app only.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    '/admin/',
    '/api/',
    '/auth',
    '/logout',
    '/reset-password',
    '/unauthorized',
    '/settings',
    '/dashboard',
    '/profile',
    '/progress',
    '/practice',
    '/learn',
    '/radar-plotting',
    '/simulator',
    '/bridge',
    '/buoyage',
    '/instructor',
    '/community/',
    '/flashcards',
    '/modules',
    '/unit-modules',
    '/store',
    '/trb',
    '/sea-survival',
    '/test',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        // Explicit Googlebot rule (same policy — helps GSC clarity)
        userAgent: 'Googlebot',
        allow: '/',
        disallow,
      },
    ],
    // Dynamic sitemap (urlset, or sitemapindex when >50k URLs) — see app/sitemap.xml/route.ts
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL.replace(/^https?:\/\//, ''),
  };
}
