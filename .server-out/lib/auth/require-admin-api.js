"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminApi = requireAdminApi;
const server_1 = require("@/lib/supabase/server");
const server_2 = require("next/server");
/** Verify the caller is an authenticated admin. For App Router API routes only. */
async function requireAdminApi() {
    const supabase = await (0, server_1.createClient)();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return { error: server_2.NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    if ((profile === null || profile === void 0 ? void 0 : profile.role) !== 'admin') {
        return { error: server_2.NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { user };
}
