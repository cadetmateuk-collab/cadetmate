'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function sendPasswordReset() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return;
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const origin = host
    ? `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`
    : undefined;
  await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: origin ? `${origin}/reset-password` : undefined,
  });
}
