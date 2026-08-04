/**
 * Mobile deep-link + redirect helpers for Supabase Auth and Stripe return URLs.
 * Register the allowlist in the Supabase dashboard (Authentication → URL Configuration).
 */
export {
  SITE_URL,
  MOBILE_APP_SCHEME,
  MOBILE_APP_ID,
  WEB_ONLY_PATHS,
  isWebOnlyPath,
  absoluteWebUrl,
  mobileAuthCallbackUrl,
  supabaseRedirectAllowlist,
  stripeReturnUrls,
} from '@cadet-mate/shared/config';
