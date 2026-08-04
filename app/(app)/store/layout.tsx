import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Store',
  description: 'Unlock premium flashcard packs and training content on CadetMate.',
  path: '/store',
  noIndex: true,
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
