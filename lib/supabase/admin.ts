// lib/supabase/admin.ts
// ⚠️  NEVER import this in client components — server only.
// The service role key bypasses RLS entirely.

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NOT prefixed with NEXT_PUBLIC_
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);