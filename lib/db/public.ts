import { createClient } from '@supabase/supabase-js';

/** Cookie-less anon client for public/cached reads (no request context required). */
export function createPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
