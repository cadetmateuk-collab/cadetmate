/** Canonical production site (matches lib/seo/site.ts). */
export const SITE_URL = 'https://cadetmate.co.uk' as const;

export const SITE_NAME = 'CadetMate';

/** Android / Capacitor / Expo deep link scheme. */
export const MOBILE_APP_SCHEME = 'cadetmate' as const;

export const MOBILE_APP_ID = 'uk.co.cadetmate.app' as const;

/** Paths that stay on web (heavy 3D / admin) — open via in-app browser or Capacitor WebView. */
export const WEB_ONLY_PATHS = [
  '/bridge',
  '/buoyage',
  '/simulator',
  '/instructor',
  '/admin',
  '/radar-plotting',
] as const;

export type WebOnlyPath = (typeof WEB_ONLY_PATHS)[number];

export function isWebOnlyPath(pathname: string): boolean {
  return WEB_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function absoluteWebUrl(path: string, baseUrl: string = SITE_URL): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${normalized}`;
}

/** Deep link used after password reset / OAuth when opened from the native shell. */
export function mobileAuthCallbackUrl(path = '/auth/callback'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${MOBILE_APP_SCHEME}:/${normalized}`;
}

/** Supabase Auth redirect allowlist entries to register in the dashboard. */
export function supabaseRedirectAllowlist(webOrigin: string = SITE_URL): string[] {
  const origin = webOrigin.replace(/\/$/, '');
  return [
    `${origin}/**`,
    `${origin}/auth`,
    `${origin}/auth/**`,
    `${origin}/reset-password`,
    `${origin}/auth/callback`,
    mobileAuthCallbackUrl('/auth/callback'),
    mobileAuthCallbackUrl('/reset-password'),
    `${MOBILE_APP_SCHEME}://auth/callback`,
    `${MOBILE_APP_SCHEME}://reset-password`,
  ];
}

/** Stripe success/cancel URLs that bounce back into the app when possible. */
export function stripeReturnUrls(
  slug: string,
  webOrigin: string = SITE_URL,
): { success_url: string; cancel_url: string } {
  const origin = webOrigin.replace(/\/$/, '');
  return {
    success_url: `${origin}/flashcards/${slug}?success=1&source=mobile`,
    cancel_url: `${origin}/flashcards/${slug}?source=mobile`,
  };
}
