"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = void 0;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requirePremium = requirePremium;
const react_1 = require("react");
const server_1 = require("@/lib/supabase/server");
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const PROFILE_COLUMNS = 'full_name, email, role';
async function authRedirectPath() {
    const headerStore = await (0, headers_1.headers)();
    const pathname = headerStore.get('x-pathname');
    if (pathname && pathname.startsWith('/') && !pathname.startsWith('//')) {
        return `/auth?redirectTo=${encodeURIComponent(pathname)}`;
    }
    return '/auth';
}
/** Per-request deduped user lookup. Uses middleware-validated session when available. */
exports.getCurrentUser = (0, react_1.cache)(async () => {
    var _a;
    const supabase = await (0, server_1.createClient)();
    const headerStore = await (0, headers_1.headers)();
    const middlewareUserId = headerStore.get('x-user-id');
    // Middleware already called getUser() — read session locally, then fetch profile only.
    if (middlewareUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id) === middlewareUserId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select(PROFILE_COLUMNS)
                .eq('id', middlewareUserId)
                .single();
            return Object.assign(Object.assign({}, session.user), { profile });
        }
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .single();
    return Object.assign(Object.assign({}, user), { profile });
});
async function requireAuth() {
    const user = await (0, exports.getCurrentUser)();
    if (!user) {
        (0, navigation_1.redirect)(await authRedirectPath());
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
async function requireAdmin() {
    return requireRole(['admin']);
}
async function requirePremium() {
    const user = await requireAuth();
    if (!user.profile || (user.profile.role !== 'premium' && user.profile.role !== 'admin')) {
        (0, navigation_1.redirect)('/store');
    }
    return user;
}
