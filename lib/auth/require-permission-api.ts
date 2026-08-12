import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  hasPermission,
  isAdminRole,
  isStaffRole,
  type Permission,
} from '@/lib/auth/roles';

type Authed = {
  user: { id: string; email?: string };
  role: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

async function loadAuth(): Promise<
  { error: NextResponse } | Authed
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    user,
    role: profile?.role ?? 'free',
    supabase,
  };
}

/** Verify the caller is an authenticated admin. For App Router API routes only. */
export async function requireAdminApi() {
  const result = await loadAuth();
  if ('error' in result) return result;

  if (!isAdminRole(result.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: result.user, role: result.role, supabase: result.supabase };
}

/** Admin or Content staff. */
export async function requireStaffApi() {
  const result = await loadAuth();
  if ('error' in result) return result;

  if (!isStaffRole(result.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: result.user, role: result.role, supabase: result.supabase };
}

/** Require a specific capability. */
export async function requirePermissionApi(permission: Permission) {
  const result = await loadAuth();
  if ('error' in result) return result;

  if (!hasPermission(result.role, permission)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: result.user, role: result.role, supabase: result.supabase };
}
