import { getCurrentUser } from '@/lib/auth/get-user';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { AuthenticatedClientChrome } from '@/components/layout/AuthenticatedClientChrome';

export const metadata: Metadata = buildNoIndexMetadata('Simulator', '/simulator');

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect('/auth');

  return (
    <>
      <AuthenticatedClientChrome />
      {children}
    </>
  );
}
