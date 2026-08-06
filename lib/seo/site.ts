/** Canonical site configuration — single source of truth for SEO URLs. */

import { SITE_NAME as SHARED_SITE_NAME } from '@cadet-mate/shared/config';

/**
 * Prefer NEXT_PUBLIC_URL so local / ngrok / preview origins work.
 * In development, an ngrok URL left in .env while browsing localhost breaks
 * auth cookies / asset basing — fall back to localhost in that case.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_URL?.trim();
  if (process.env.NODE_ENV === 'development') {
    if (!raw || /ngrok/i.test(raw)) {
      return 'http://localhost:3000';
    }
  }
  return (raw || 'https://cadetmate.co.uk').replace(/\/$/, '');
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = SHARED_SITE_NAME;

export function absoluteUrl(path: string, baseUrl: string = SITE_URL): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${normalized}`;
}

export const DEFAULT_DESCRIPTION =
  'CadetMate helps UK merchant navy deck cadets train for college, sea phases, COLREGS, TRB tasks, STCW topics, and MCA oral exams — with free guides and a free account to start.';

export const DEFAULT_KEYWORDS = [
  'UK deck cadet training',
  'deck cadet training UK',
  'COLREGS training',
  'MCA oral exam prep',
  'TRB deck cadet',
  'STCW revision',
  'OOW cadet',
  'merchant navy cadet',
  'Officer of the Watch training',
  'maritime cadet app',
] as const;

/** Social-friendly OG image (1200×630 PNG). Avoid SVG — poorly supported by Facebook/LinkedIn/X. */
export const DEFAULT_OG_IMAGE = '/images/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

/** Brand logo for schema.org Organization.logo */
export const SITE_LOGO = '/images/logo.png';

/** Public social profiles for Organization sameAs (add when accounts exist). */
export const SOCIAL_PROFILES: string[] = [];

export const SUPPORT_EMAIL = 'support@cadetmate.com';
