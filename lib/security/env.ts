/**
 * Server-side env accessors — fail closed for secrets; never use NEXT_PUBLIC_ for secrets.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

/** Public site origin (no trailing slash). */
export function getSiteUrl(): string {
  return optional('NEXT_PUBLIC_URL', 'https://cadetmate.co.uk').replace(/\/$/, '');
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;
const NGROK_HOST = /\.ngrok(-free)?\.(app|dev|io)$/i;

/**
 * Origin Stripe should redirect back to after Checkout / Portal.
 * Prefers the request Host when it is localhost, ngrok, or the configured site —
 * so a dead ngrok URL in NEXT_PUBLIC_URL does not trap local test payments.
 */
export function getCheckoutReturnOrigin(req: { headers: Headers }): string {
  const configured = getSiteUrl();
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || req.headers.get('host')?.split(',')[0]?.trim() || '';
  if (!host) return configured;

  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto =
    forwardedProto ||
    (LOCAL_HOST.test(host) ? 'http' : 'https');
  const origin = `${proto}://${host}`.replace(/\/$/, '');

  if (LOCAL_HOST.test(host) || NGROK_HOST.test(host)) return origin;
  try {
    if (new URL(configured).host === host) return origin;
  } catch {
    /* ignore invalid NEXT_PUBLIC_URL */
  }
  return configured;
}

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/** Service role — server only. Throws if missing. */
export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY');
}

export function getStripeSecretKey(): string {
  return required('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string {
  return required('STRIPE_WEBHOOK_SECRET');
}

export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

/** Recurring Premium Price ID (`price_…`). Null if not configured. */
export function getPremiumPriceId(): string | null {
  return process.env.STRIPE_PREMIUM_PRICE_ID?.trim() || null;
}

/** PKCS8 PEM for ES256 offline licences. Server only. */
export function getOfflineLicencePrivateKey(): string {
  return required('OFFLINE_LICENCE_PRIVATE_KEY').replace(/\\n/g, '\n');
}

export function getOfflineLicencePublicKey(): string {
  const value = process.env.OFFLINE_LICENCE_PUBLIC_KEY?.trim() || process.env.NEXT_PUBLIC_OFFLINE_LICENCE_PUBLIC_KEY?.trim();
  if (!value) throw new Error('Missing required environment variable: OFFLINE_LICENCE_PUBLIC_KEY');
  return value.replace(/\\n/g, '\n');
}

/** Hosts allowed for server-side PDF fetches (SSRF protection). */
export function getAllowedPdfHosts(): string[] {
  const fromEnv = optional('PDF_ALLOWED_HOSTS')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const supabaseHost = (() => {
    try {
      return new URL(getSupabaseUrl()).hostname.toLowerCase();
    } catch {
      return null;
    }
  })();

  const defaults = ['cadetmate.co.uk', 'www.cadetmate.co.uk'];
  if (supabaseHost) defaults.push(supabaseHost);

  return [...new Set([...defaults, ...fromEnv])];
}

/**
 * Safe relative redirect for post-login navigation.
 * Rejects protocol-relative, backslash tricks, and non-path values.
 */
export function safeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path) return fallback;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.includes('://')) return fallback;
  if (trimmed.includes('\\') || trimmed.includes('@')) return fallback;
  // Disallow control chars / whitespace injection
  if (/[\u0000-\u001F\u007F\s]/.test(trimmed)) return fallback;
  if (!/^\/[A-Za-z0-9/_?&=%.~+-]*$/.test(trimmed)) return fallback;
  return trimmed;
}

/** Escape HTML for email / text interpolation. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape `%` / `_` for PostgREST ilike patterns. */
export function escapeIlike(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
