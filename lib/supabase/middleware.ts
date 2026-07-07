import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { buildBlogPostPath } from '@/lib/blog/paths';

function nextWithHeaders(request: NextRequest, requestHeaders: Headers) {
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let supabaseResponse = nextWithHeaders(request, requestHeaders);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = nextWithHeaders(request, requestHeaders);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not add any logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Legacy auth URL → canonical /auth
  if (pathname === '/sign-in' || pathname === '/login') {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = '/auth';
    const next = request.nextUrl.searchParams.get('next') ?? request.nextUrl.searchParams.get('redirectTo');
    if (next) authUrl.searchParams.set('redirectTo', next);
    return NextResponse.redirect(authUrl);
  }

  // Legacy blog URL → free content
  if (pathname === '/blog' || pathname.startsWith('/blog/')) {
    const contentUrl = request.nextUrl.clone();
    contentUrl.pathname = pathname.replace(/^\/blog/, '/free-content');
    return NextResponse.redirect(contentUrl);
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
        canonicalUrl.pathname = buildBlogPostPath(post);
        return NextResponse.redirect(canonicalUrl, 308);
      }
    }
  }

  // Protect /admin routes — require authentication and admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = '/unauthorized';
      return NextResponse.redirect(deniedUrl);
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

