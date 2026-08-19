import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { requirePremium } from '@/lib/auth/get-user';

export const metadata: Metadata = buildPageMetadata({
  title: 'TRB Tasks',
  description: 'Training Record Book task guides and step-by-step instructions for UK deck cadets.',
  path: '/trb',
  noIndex: true,
});

export default async function TrbLayout({ children }: { children: React.ReactNode }) {
  await requirePremium();
  return children;
}
