import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { requireStaff } from '@/lib/auth/get-user';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = buildNoIndexMetadata('Admin', '/admin');

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return <AdminShell>{children}</AdminShell>;
}
