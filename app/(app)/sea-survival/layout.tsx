import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { requirePremium } from '@/lib/auth/get-user';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sea Survival',
  description: 'Sea survival training articles and guides for merchant navy cadets and officers.',
  path: '/sea-survival',
  noIndex: true,
});

export default async function SeaSurvivalLayout({ children }: { children: React.ReactNode }) {
  await requirePremium();
  return children;
}
