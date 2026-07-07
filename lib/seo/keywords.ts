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
] as const;

export function buildArticleKeywords(category: string, title: string): string[] {
  const base = [...FREE_CONTENT_KEYWORDS];
  if (category) base.unshift(category.toLowerCase());
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  return [...new Set([...titleWords, ...base])];
}
