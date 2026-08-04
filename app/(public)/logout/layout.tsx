import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Logging Out', '/logout');

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
