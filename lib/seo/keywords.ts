/** Primary and secondary keywords for free content / blog SEO. */
export const FREE_CONTENT_KEYWORDS = [
  'free maritime training',
  'deck cadet resources UK',
  'cadetship guides',
  'OOW exam preparation',
  'STCW revision free',
  'COLREGS study guide',
  'nautical science articles',
  'merchant navy cadet tips',
  'maritime career advice',
  'MCA oral exam prep',
  'TRB deck cadet',
  'how to become a deck cadet UK',
] as const;

/** High-priority content topics still thin or missing in the article inventory. */
export const CONTENT_GAP_KEYWORDS = [
  'MCA oral exam questions',
  'COLREGS for deck cadets',
  'training record book how to',
  'STCW basic safety training explained',
  'chartwork revision cadet',
  'deck cadet salary UK',
  'IALA buoyage explained',
  'ship stability for deck cadets',
  'deck cadet interview questions',
  'how to become a deck cadet UK',
] as const;

export function buildArticleKeywords(category: string, title: string): string[] {
  const base: string[] = [...FREE_CONTENT_KEYWORDS];
  if (category) base.unshift(category.toLowerCase());
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  return [...new Set([...titleWords, ...base])];
}
