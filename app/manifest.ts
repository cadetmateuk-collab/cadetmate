import type { MetadataRoute } from 'next';
import { SITE_NAME, DEFAULT_DESCRIPTION, SITE_LOGO } from '@/lib/seo/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: '/home',
    display: 'standalone',
    background_color: '#0a2540',
    theme_color: '#0a2540',
    lang: 'en-GB',
    icons: [
      {
        src: SITE_LOGO,
        sizes: '1080x1080',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
