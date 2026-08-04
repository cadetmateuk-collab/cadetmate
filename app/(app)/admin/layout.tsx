import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { requireAdmin } from '@/lib/auth/get-user';

export const metadata: Metadata = buildNoIndexMetadata('Admin', '/admin');

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
