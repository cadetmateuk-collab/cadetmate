import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const PROFILE_COLUMNS = 'full_name, email, role';

async function authRedirectPath(): Promise<string> {
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname');
  if (pathname && pathname.startsWith('/') && !pathname.startsWith('//')) {
    return `/auth?redirectTo=${encodeURIComponent(pathname)}`;
  }
  return '/auth';
}

/** Per-request deduped user lookup. Uses middleware-validated session when available. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const headerStore = await headers();
  const middlewareUserId = headerStore.get('x-user-id');

  // Middleware already called getUser() — read session locally, then fetch profile only.
  if (middlewareUserId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === middlewareUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', middlewareUserId)
        .single();

      return { ...session.user, profile };
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single();

  return {
    ...user,
    profile,
  };
});

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(await authRedirectPath());
  }

  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();

  if (!user.profile || !allowedRoles.includes(user.profile.role)) {
    redirect('/unauthorized');
  }

  return user;
}

export async function requireAdmin() {
  return requireRole(['admin']);
}

export async function requirePremium() {
  const user = await requireAuth();

  if (!user.profile || (user.profile.role !== 'premium' && user.profile.role !== 'admin')) {
    redirect('/store');
  }

  return user;
}
