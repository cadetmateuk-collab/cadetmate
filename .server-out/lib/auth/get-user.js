"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const server_1 = require("@/lib/supabase/server");
const navigation_1 = require("next/navigation");
async function getCurrentUser() {
    const supabase = await (0, server_1.createClient)();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    return Object.assign(Object.assign({}, user), { profile });
}
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        (0, navigation_1.redirect)('/auth');
    }
    return user;
}
async function requireRole(allowedRoles) {
    const user = await requireAuth();
    if (!user.profile || !allowedRoles.includes(user.profile.role)) {
        (0, navigation_1.redirect)('/unauthorized');
    }
    return user;
}
