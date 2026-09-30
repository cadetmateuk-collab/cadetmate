/** Client-side cookie consent (analytics / GA4). Essential cookies are always on. */

export const COOKIE_CONSENT_KEY = 'cadetmate_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
export const CONSENT_CHANGED_EVENT = 'cadetmate:cookie-consent';
export const OPEN_COOKIE_SETTINGS_EVENT = 'cadetmate:open-cookie-settings';

export type CookieConsent = {
  version: number;
  analytics: boolean;
  decidedAt: string;
};

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
  }
  return value;
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
