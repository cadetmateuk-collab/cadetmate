"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSession = updateSession;
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
const paths_1 = require("@/lib/blog/paths");
function nextWithHeaders(request, requestHeaders) {
    return server_1.NextResponse.next({
        request: { headers: requestHeaders },
    });
}
function copyCookies(from, to) {
    from.cookies.getAll().forEach((cookie) => {
        to.cookies.set(cookie.name, cookie.value);
    });
}
async function updateSession(request) {
    var _a;
    const requestHeaders = new Headers(request.headers);
    let supabaseResponse = nextWithHeaders(request, requestHeaders);
    const supabase = (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = nextWithHeaders(request, requestHeaders);
                cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
            },
        },
    });
    // Do not add any logic between createServerClient and getUser()
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    // Legacy auth URL → canonical /auth
    if (pathname === '/sign-in' || pathname === '/login') {
        const authUrl = request.nextUrl.clone();
        authUrl.pathname = '/auth';
        const next = (_a = request.nextUrl.searchParams.get('next')) !== null && _a !== void 0 ? _a : request.nextUrl.searchParams.get('redirectTo');
        if (next)
            authUrl.searchParams.set('redirectTo', next);
        return server_1.NextResponse.redirect(authUrl);
    }
    // Legacy blog URL → free content
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
        const contentUrl = request.nextUrl.clone();
        contentUrl.pathname = pathname.replace(/^\/blog/, '/free-content');
        return server_1.NextResponse.redirect(contentUrl);
    }
    // Legacy article URL: /free-content/{slug} → /free-content/{category}/{slug}
    // Handled here (not a route file) to avoid Next.js dynamic segment conflicts.
    if (pathname.startsWith('/free-content/')) {
        const subpath = pathname.slice('/free-content/'.length);
        if (subpath && !subpath.includes('/')) {
            const { data: post } = await supabase
                .from('blog_posts')
                .select('slug, category, category_slug')
                .eq('slug', decodeURIComponent(subpath))
                .eq('hidden', false)
                .maybeSingle();
            if (post) {
                const canonicalUrl = request.nextUrl.clone();
                canonicalUrl.pathname = (0, paths_1.buildBlogPostPath)(post);
                return server_1.NextResponse.redirect(canonicalUrl, 308);
            }
        }
    }
    // Protect /admin routes — require authentication and admin role
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/auth';
            loginUrl.searchParams.set('redirectTo', pathname);
            return server_1.NextResponse.redirect(loginUrl);
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if ((profile === null || profile === void 0 ? void 0 : profile.role) !== 'admin') {
            const deniedUrl = request.nextUrl.clone();
            deniedUrl.pathname = '/unauthorized';
            return server_1.NextResponse.redirect(deniedUrl);
        }
    }
    // Forward validated user id so server components skip a second getUser() round-trip.
    if (user) {
        requestHeaders.set('x-user-id', user.id);
        const refreshed = nextWithHeaders(request, requestHeaders);
        copyCookies(supabaseResponse, refreshed);
        supabaseResponse = refreshed;
    }
    supabaseResponse.headers.set('x-pathname', pathname);
    return supabaseResponse;
}
