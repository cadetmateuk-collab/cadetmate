import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Store',
  description: 'Digital study resources and physical products for UK deck cadets on CadetMate.',
  path: '/store',
  noIndex: true,
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
