import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Partners',
  description: 'CadetMate partners and collaborators supporting UK maritime cadet training.',
  path: '/partners',
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
