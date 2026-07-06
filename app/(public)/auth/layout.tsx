import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Sign In');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
