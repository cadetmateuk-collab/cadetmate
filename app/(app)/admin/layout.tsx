import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Admin');

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
