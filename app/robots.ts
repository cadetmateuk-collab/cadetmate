import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/settings',
          '/auth',
          '/logout',
          '/reset-password',
          '/unauthorized',
          '/simulator',
          '/bridge',
          '/instructor',
          '/test',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
