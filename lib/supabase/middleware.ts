import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { buildBlogPostPath } from '@/lib/blog/paths';

type CookieToSet = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function isStaleRefreshError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  return (
    code === 'refresh_token_not_found' ||
    code === 'refresh_token_already_used' ||
    code === 'session_not_found' ||
    message.includes('refresh token')
  );
}

function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest) {
  for (const { name } of request.cookies.getAll()) {
    if (!name.startsWith('sb-')) continue;
    if (!name.includes('auth-token')) continue;
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
  }
}
function applyCookies(response: NextResponse, cookies: CookieToSet[], requestUrl?: URL) {
  const isHttps = requestUrl?.protocol === 'https:';
  cookies.forEach(({ name, value, options }) => {
    const nextOptions = { ...options };
    // Browsers reject Secure cookies on http://localhost — force off when not HTTPS.
    if (!isHttps) {
      nextOptions.secure = false;
    }
    response.cookies.set(name, value, nextOptions);
  });
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  requestHeaders.delete('x-user-id');

  // Keep the full option bag — copying cookies via getAll() drops attributes and breaks auth (esp. ngrok/https).
  let cookiesToSet: CookieToSet[] = [];

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(next) {
          cookiesToSet = next.map(({ name, value, options }) => ({
            name,
            value,
            options: options ?? {},
          }));
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          applyCookies(supabaseResponse, cookiesToSet, request.nextUrl);
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (isStaleRefreshError(authError)) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* session is already invalid */
    }
    requestHeaders.set('x-auth-stale', '1');
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth';
      loginUrl.searchParams.set('redirectTo', pathname);
      const res = NextResponse.redirect(loginUrl);
      applyCookies(res, cookiesToSet, request.nextUrl);
      clearSupabaseAuthCookies(res, request);
      return res;
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    applyCookies(response, cookiesToSet, request.nextUrl);
    clearSupabaseAuthCookies(response, request);
    return response;
  }

  const pathname = request.nextUrl.pathname;

  if (pathname === '/sign-in' || pathname === '/login') {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = '/auth';
    const next =
      request.nextUrl.searchParams.get('next') ??
      request.nextUrl.searchParams.get('redirectTo');
    if (next) authUrl.searchParams.set('redirectTo', next);
    const res = NextResponse.redirect(authUrl);
    applyCookies(res, cookiesToSet, request.nextUrl);
    return res;
  }

  // Manifest disabled while developing — stop browser PWA refetch spam.
  if (
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/site.webmanifest'
  ) {
    return new NextResponse(null, { status: 204 });
  }

  if (pathname === '/blog' || pathname.startsWith('/blog/')) {
    const contentUrl = request.nextUrl.clone();
    contentUrl.pathname = pathname.replace(/^\/blog/, '/free-content');
    const res = NextResponse.redirect(contentUrl);
    applyCookies(res, cookiesToSet, request.nextUrl);
    return res;
  }

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
        const canonicalPath = buildBlogPostPath(post);
        if (canonicalPath !== pathname) {
          const canonicalUrl = request.nextUrl.clone();
          canonicalUrl.pathname = canonicalPath;
          const res = NextResponse.redirect(canonicalUrl, 308);
          applyCookies(res, cookiesToSet, request.nextUrl);
          return res;
        }
      }
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth';
      loginUrl.searchParams.set('redirectTo', pathname);
      const res = NextResponse.redirect(loginUrl);
      applyCookies(res, cookiesToSet, request.nextUrl);
      return res;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    if (role !== 'admin' && role !== 'content') {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = '/unauthorized';
      const res = NextResponse.redirect(deniedUrl);
      applyCookies(res, cookiesToSet, request.nextUrl);
      return res;
    }
  }

  // Rebuild response so Server Components see x-user-id, then re-apply auth cookies with full options.
  if (user) {
    requestHeaders.set('x-user-id', user.id);
  }
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applyCookies(response, cookiesToSet, request.nextUrl);
  return response;
}
