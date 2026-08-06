import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

function cookieOptions() {
  // Explicit host-aware flags — required so http://localhost can store the session.
  const secure =
    typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure,
  };
}

/**
 * Next.js browser client (cookie-aware via @supabase/ssr).
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const options = { cookieOptions: cookieOptions() };

  if (typeof window === 'undefined') {
    return createBrowserClient(url, key, options);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key, options);
  }
  return browserClient;
}
