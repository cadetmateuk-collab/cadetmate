import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeRedirectPath } from '@/lib/security/env';

const PROFILE_COLUMNS = 'full_name, email, role';

async function authRedirectPath(): Promise<string> {
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname');
  const safe = safeRedirectPath(pathname, '');
  if (safe) {
    return `/auth?redirectTo=${encodeURIComponent(safe)}`;
  }
  return '/auth';
}

/** Per-request deduped user lookup. Always validates with getUser() (JWT). */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
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
