import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { requireAdmin } from '@/lib/auth/get-user';
import { ProtectedToolBar } from '@/components/layout/ProtectedToolBar';

export const metadata: Metadata = buildNoIndexMetadata('Instructor Dashboard', '/instructor');

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <ProtectedToolBar title="Instructor Dashboard" backHref="/admin/admin-home" backLabel="Back to Admin" />
      <div className="pt-10">{children}</div>
    </>
  );
}
