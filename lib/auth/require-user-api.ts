import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

type Ok = { user: User; error?: undefined };
type Err = { user?: undefined; error: NextResponse };

/** Verify the caller is authenticated. For App Router API routes.
 *  Accepts cookie session (web) or `Authorization: Bearer <jwt>` (native app). */
export async function requireUserApi(): Promise<Ok | Err> {
  const supabase = await createClient();
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    const headerStore = await headers();
    const auth = headerStore.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token) {
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      error = result.error;
    }
  }

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}
