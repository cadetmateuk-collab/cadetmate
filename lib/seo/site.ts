/** Canonical site configuration — single source of truth for SEO URLs. */
export const SITE_URL = 'https://cadetmate.co.uk' as const;

export const SITE_NAME = 'CadetMate';

export const DEFAULT_DESCRIPTION =
  'The training platform built for UK deck cadets. Interactive modules, COLREGS, watchkeeping, STCW revision and more.';

export const DEFAULT_KEYWORDS = [
  'deck cadet training UK',
  'maritime cadet app',
  'STCW revision',
  'COLREGS training',
  'OOW cadet',
  'nautical science',
] as const;

export const DEFAULT_OG_IMAGE = '/images/CadetMateLogoBlueBGQWhiteFG.svg';

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
