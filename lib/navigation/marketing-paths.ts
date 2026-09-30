/** Public marketing / legal routes where the in-app support widget is hidden. */
export const MARKETING_PATH_PREFIXES = [
  '/home',
  '/pricing',
  '/about',
  '/contact',
  '/resources',
  '/free-content',
  '/community-preview',
  '/partners',
  '/privacy',
  '/terms',
  '/cookies',
  '/refunds',
  '/accessibility',
  '/faq',
] as const;

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
