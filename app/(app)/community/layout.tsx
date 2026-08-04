import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/PageShell';

export const metadata: Metadata = buildPageMetadata({
  title: 'Community',
  description: 'Discuss maritime training, share tips, and connect with fellow cadets.',
  path: '/community',
  noIndex: true,
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
