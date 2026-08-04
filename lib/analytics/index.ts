/**
 * Analytics configuration and typed event helpers (GA4).
 * Safe no-ops when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || '';

export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID) && typeof window !== 'undefined';
}

type GtagCommand = 'config' | 'event' | 'js' | 'set' | 'consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  } else {
    window.dataLayer.push(args);
  }
}

export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** SPA page view (App Router). */
export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
}

/** Generic custom / recommended event. */
export function trackEvent(name: string, params?: AnalyticsParams) {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', name, scrub(params));
}

/** Button / CTA clicks. */
export function trackClick(
  label: string,
  params?: AnalyticsParams & { location?: string },
) {
  trackEvent('button_click', {
    button_label: label,
    ...params,
  });
}

/** Form submissions. */
export function trackFormSubmit(
  formName: string,
  status: 'success' | 'error' | 'start' = 'success',
  params?: AnalyticsParams,
) {
  trackEvent('form_submit', {
    form_name: formName,
    status,
    ...params,
  });
}

/**
 * Conversion events — map to GA4 key events in Admin → Events.
 * Prefer GA4 recommended names where they fit.
 */
export type ConversionName =
  | 'login'
  | 'sign_up'
  | 'begin_checkout'
  | 'purchase'
  | 'generate_lead'
  | 'select_content'
  | 'search';

export function trackConversion(
  name: ConversionName,
  params?: AnalyticsParams,
) {
  trackEvent(name, {
    ...params,
  });
}

/** Client / runtime errors → GA4 exception + optional server log. */
export function trackException(
  description: string,
  fatal = false,
  extra?: AnalyticsParams,
) {
  trackEvent('exception', {
    description: description.slice(0, 500),
    fatal,
    ...extra,
  });

  if (typeof window === 'undefined') return;
  // Fire-and-forget server log (no PII)
  try {
    const body = JSON.stringify({
      message: description.slice(0, 1000),
      fatal,
      path: window.location.pathname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      ...extra,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* ignore */
  }
}

function scrub(params?: AnalyticsParams): AnalyticsParams | undefined {
  if (!params) return undefined;
  const out: AnalyticsParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    // Never send emails / passwords / tokens
    if (/email|password|token|secret|authorization/i.test(k)) continue;
    out[k] = typeof v === 'string' ? v.slice(0, 200) : v;
  }
  return out;
}

export { gtag };
