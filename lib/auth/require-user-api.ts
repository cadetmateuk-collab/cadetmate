import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

type Ok = { user: User; error?: undefined };
type Err = { user?: undefined; error: NextResponse };

/** Verify the caller is authenticated. For App Router API routes. */
export async function requireUserApi(): Promise<Ok | Err> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}
