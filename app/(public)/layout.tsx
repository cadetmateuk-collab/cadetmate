// app/(public)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://cadetmate.com'),
  title: {
    default: 'CadetMate',
    template: '%s | CadetMate',
  },
  description: 'The training platform built for UK deck cadets. Interactive modules, COLREGS, watchkeeping, STCW revision and more.',
  keywords: ['deck cadet training UK', 'maritime cadet app', 'STCW revision', 'COLREGS training', 'OOW cadet', 'nautical science'],
  openGraph: {
    siteName: 'CadetMate',
    type: 'website',
    images: [{ url: '/images/CadetMateLogoBlueBGQWhiteFG.svg', alt: 'CadetMate' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}