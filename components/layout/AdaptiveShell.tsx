import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/get-user';
import { toNavUser } from '@/lib/auth/nav-user';
import { AppShell } from '@/components/layout/AppShell';
import { PublicShell } from '@/components/layout/PublicShell';

/**
 * Picks app or public chrome based on whether the visitor is logged in.
 * Anonymous visitors skip the auth profile fetch (faster TTFB on marketing pages).
 */
export async function AdaptiveShell({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const hasSessionHint = Boolean(headerStore.get('x-user-id'));

  if (!hasSessionHint) {
    return <PublicShell>{children}</PublicShell>;
  }

  const user = await getCurrentUser();

  if (user) {
    return <AppShell user={toNavUser(user)}>{children}</AppShell>;
  }

  return <PublicShell>{children}</PublicShell>;
}
