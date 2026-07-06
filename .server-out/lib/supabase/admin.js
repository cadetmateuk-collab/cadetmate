"use strict";
// lib/supabase/admin.ts
// ⚠️  NEVER import this in client components — server only.
// The service role key bypasses RLS entirely.
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
exports.supabaseAdmin = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, // NOT prefixed with NEXT_PUBLIC_
{
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
