import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Free Content',
  description: 'Free maritime training articles and resources for UK deck cadets.',
  path: '/free-content',
});

export default function FreeContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
