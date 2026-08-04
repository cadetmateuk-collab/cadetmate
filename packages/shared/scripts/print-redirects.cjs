// Deep-link / redirect verification helper for mobile auth.
// Usage: node packages/shared/scripts/print-redirects.cjs

const SITE_URL = 'https://cadetmate.co.uk';
const MOBILE_APP_SCHEME = 'cadetmate';

function supabaseRedirectAllowlist(webOrigin = SITE_URL) {
  const origin = webOrigin.replace(/\/$/, '');
  return [
    `${origin}/auth`,
    `${origin}/reset-password`,
    `${origin}/auth/callback`,
    `${MOBILE_APP_SCHEME}://auth/callback`,
    `${MOBILE_APP_SCHEME}://reset-password`,
  ];
}

const origin = process.env.NEXT_PUBLIC_URL || SITE_URL;
console.log('Register these Redirect URLs in Supabase Auth:\n');
for (const url of supabaseRedirectAllowlist(origin)) {
  console.log(`  ${url}`);
}
