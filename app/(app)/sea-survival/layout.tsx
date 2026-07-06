import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sea Survival',
  description: 'Sea survival training articles and guides for merchant navy cadets and officers.',
  path: '/sea-survival',
});

export default function SeaSurvivalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
