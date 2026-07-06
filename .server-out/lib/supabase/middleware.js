"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.updateSession = updateSession;
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
async function updateSession(request) {
    let supabaseResponse = server_1.NextResponse.next({ request });
    const supabase = (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = server_1.NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
            },
        },
    });
    // Do not add any logic between createServerClient and getUser()
    const { data: { user } } = await supabase.auth.getUser();
    // Protect /admin routes — redirect to login if not authenticated
    if (!user && request.nextUrl.pathname.startsWith('/admin')) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth';
        loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return server_1.NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
}
exports.config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
