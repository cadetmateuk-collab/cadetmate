import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'TRB Tasks',
  description: 'Training Record Book task guides and step-by-step instructions for UK deck cadets.',
  path: '/trb',
  noIndex: true,
});

export default function TrbLayout({ children }: { children: React.ReactNode }) {
  return children;
}
