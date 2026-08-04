import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type CadetMateSupabase = SupabaseClient<any, 'public', any>;

/** Platform-agnostic Supabase client (web browser, RN, Node). Use SSR helpers only on Next. */
export function createCadetMateClient(
  url: string,
  anonKey: string,
  options?: Parameters<typeof createClient>[2],
): CadetMateSupabase {
  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }
  return createClient(url, anonKey, {
    ...options,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
  }) as CadetMateSupabase;
}
