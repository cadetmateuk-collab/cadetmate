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
