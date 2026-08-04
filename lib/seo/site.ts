/** Canonical site configuration — single source of truth for SEO URLs. */
export {
  SITE_URL,
  SITE_NAME,
  absoluteWebUrl as absoluteUrl,
} from '@cadet-mate/shared/config';

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
