import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { requireAuth } from '@/lib/auth/get-user';
import { toNavUser } from '@/lib/auth/nav-user';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Training platform for maritime cadets — modules, flashcards, TRB tasks, and more.',
  path: '/',
});

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return <AppShell user={toNavUser(user)}>{children}</AppShell>;
}
