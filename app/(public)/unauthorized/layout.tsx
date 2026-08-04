import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Unauthorized', '/unauthorized');

export default function UnauthorizedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
