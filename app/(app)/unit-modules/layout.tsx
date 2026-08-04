import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Training Modules',
  description: 'Browse interactive maritime training modules for deck cadets — navigation, COLREGS, signals, and more.',
  path: '/unit-modules',
  noIndex: true,
});

export default function UnitModulesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
