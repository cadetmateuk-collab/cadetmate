import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeRedirectPath } from '@/lib/security/env';
import { syncOnboardingFromMetadata } from '@/lib/onboarding/sync-from-metadata';

const PROFILE_COLUMNS =
  'full_name, email, role, training_phase, nautical_college, learning_interests, referral_source, avatar_kind, avatar_preset, onboarding_completed';

const PROFILE_COLUMNS_FALLBACK = 'full_name, email, role';

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

  try {
    await syncOnboardingFromMetadata(user.id, user.user_metadata);
  } catch {
    /* migration may not be applied yet */
  }

  let profile = null;
  const full = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single();

  if (full.error) {
    const fallback = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS_FALLBACK)
      .eq('id', user.id)
      .single();
    profile = fallback.data;
  } else {
    profile = full.data;
  }

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
