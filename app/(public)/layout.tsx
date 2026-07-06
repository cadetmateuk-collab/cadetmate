import type { Metadata } from 'next';
import { DEFAULT_KEYWORDS, SITE_URL, DEFAULT_OG_IMAGE, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_GB',
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
