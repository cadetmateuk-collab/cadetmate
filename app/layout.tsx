import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { manrope } from '@/lib/fonts';
import './globals.css';
import { ActivityTrackerProvider } from '@/components/ActivityTrackerProvider';
import SupportWidget from '@/components/SupportWidget';
import { SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body className={manrope.className}>
        <SupportWidget />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <ActivityTrackerProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
