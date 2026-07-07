"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicSupabase = createPublicSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
/** Cookie-less anon client for public/cached reads (no request context required). */
function createPublicSupabase() {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
