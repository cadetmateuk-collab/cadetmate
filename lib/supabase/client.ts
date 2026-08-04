import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

/**
 * Next.js browser client (cookie-aware via @supabase/ssr).
 * Cookie options are host-agnostic so auth works on localhost, ngrok, and production.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const isBrowser = typeof window !== 'undefined';
  const secure = isBrowser ? window.location.protocol === 'https:' : true;

  const options = {
    cookieOptions: {
      path: '/',
      sameSite: 'lax' as const,
      secure,
    },
  };

  if (!isBrowser) {
    return createBrowserClient(url, key, options);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key, options);
  }
  return browserClient;
}
