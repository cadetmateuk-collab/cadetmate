import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { manrope } from '@/lib/fonts';
import './globals.css';
import { DeferredAppChrome } from '@/components/layout/DeferredAppChrome';
import { AnalyticsRoot } from '@/components/analytics/AnalyticsRoot';
import { AnalyticsErrorBoundary } from '@/components/analytics/AnalyticsErrorBoundary';
import { MotionProvider } from '@/components/motion/MotionProvider';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_KEYWORDS,
  SITE_URL,
  SITE_LOGO,
} from '@/lib/seo/site';
import { GOOGLE_SITE_VERIFICATION } from '@/lib/analytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Maritime Training for UK Deck Cadets`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  icons: {
    icon: [{ url: SITE_LOGO, type: 'image/png', sizes: '1080x1080' }],
    apple: [{ url: SITE_LOGO }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    title: `${SITE_NAME} — Maritime Training for UK Deck Cadets`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Maritime Training for UK Deck Cadets`,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    // Public homepage lives at /home (apex `/` permanently redirects there).
    canonical: `${SITE_URL}/home`,
  },
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={manrope.variable}>
      <head>
        <link rel="dns-prefetch" href="https://cadetmate.co.uk" />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://supabase.co'}
          crossOrigin="anonymous"
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        ) : null}
      </head>
      <body className={manrope.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="theme"
        >
          <MotionProvider>
            <AnalyticsRoot />
            <DeferredAppChrome />
            <AnalyticsErrorBoundary>{children}</AnalyticsErrorBoundary>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
