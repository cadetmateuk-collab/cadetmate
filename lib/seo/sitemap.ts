/**
 * Dynamic XML sitemap builders for CadetMate.
 *
 * How this works
 * --------------
 * - `app/sitemap.xml/route.ts` serves `/sitemap.xml` on every request (revalidated).
 * - Static public marketing pages are listed below (admin / auth / app routes are excluded).
 * - Published Slug blog posts are fetched live from Supabase `blog_posts`
 *   (CadetMate’s slug-based free-content CMS — each article has a URL `slug` + `category_slug`).
 * - Draft / unpublished articles use `hidden = true` and are excluded from the query.
 * - Canonical article URLs always use `buildBlogPostPath()` (same as page metadata), so a
 *   mismatched `[category]` route segment still maps to the correct `<loc>`.
 * - If total URLs exceed 50,000, `/sitemap.xml` becomes a sitemap *index* and chunks are
 *   served from `/sitemaps/{id}`.
 *
 * Env required: NEXT_PUBLIC_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createPublicSupabase } from '@/lib/supabase/public';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';
import { normalizeCanonicalPath } from '@/lib/seo/metadata';

/** Google / sitemap protocol hard limit per urlset file. */
export const SITEMAP_URL_LIMIT = 50_000;

export type SitemapChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export type SitemapEntry = {
  /** Absolute canonical HTTPS URL */
  loc: string;
  /** ISO 8601 lastmod */
  lastmod: string;
  changefreq: SitemapChangeFreq;
  priority: number;
};

/**
 * Public, indexable static pages only.
 * Excludes: admin, auth, 404, dashboard, and other app/protected routes.
 */
export const STATIC_PUBLIC_ROUTES: {
  path: string;
  priority: number;
  changefreq: SitemapChangeFreq;
}[] = [
  // Homepage canonical is /home (apex `/` permanently redirects here for guests)
  { path: '/home', priority: 1.0, changefreq: 'weekly' },
  { path: '/free-content', priority: 0.9, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.9, changefreq: 'monthly' },
  { path: '/resources', priority: 0.8, changefreq: 'weekly' },
  { path: '/community-preview', priority: 0.7, changefreq: 'daily' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/partners', priority: 0.3, changefreq: 'yearly' },
];

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const;

export function sitemapXmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: XML_HEADERS,
  });
}

/** Force absolute HTTPS URLs on the site’s canonical host (localhost keeps http). */
export function toSitemapLoc(pathOrUrl: string): string {
  const path = pathOrUrl.startsWith('http')
    ? new URL(pathOrUrl).pathname
    : pathOrUrl;
  const absolute = absoluteUrl(normalizeCanonicalPath(path));
  if (absolute.startsWith('http://') && !/localhost|127\.0\.0\.1/i.test(absolute)) {
    return absolute.replace(/^http:\/\//i, 'https://');
  }
  return absolute;
}

export function toIso8601(value: string | Date | null | undefined, fallback: Date): string {
  const d =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : fallback;
  const safe = Number.isNaN(d.getTime()) ? fallback : d;
  return safe.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isSameSiteHost(loc: string): boolean {
  try {
    return new URL(loc).hostname === new URL(SITE_URL).hostname;
  } catch {
    return false;
  }
}

/** Deduplicate by `<loc>` while preserving first-seen order. */
export function dedupeSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  const out: SitemapEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.loc)) continue;
    // Only emit URLs on the configured site host
    if (!isSameSiteHost(entry.loc)) continue;
    seen.add(entry.loc);
    out.push(entry);
  }
  return out;
}

/**
 * Fetch every *published* Slug blog post from Supabase.
 * Published = `hidden` is false and `slug` is non-empty.
 * New articles appear automatically on the next sitemap revalidation — no code changes.
 */
export async function fetchPublishedSlugBlogPosts(): Promise<
  {
    slug: string;
    category: string | null;
    category_slug: string | null;
    date: string | null;
    updated_at: string | null;
  }[]
> {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, category, category_slug, date, updated_at')
    .eq('hidden', false)
    .not('slug', 'is', null)
    .order('date', { ascending: false });

  if (error) {
    console.error('[sitemap] Slug blog fetch failed (blog_posts):', error.message);
    return [];
  }

  return (data ?? []).filter(
    (post): post is {
      slug: string;
      category: string | null;
      category_slug: string | null;
      date: string | null;
      updated_at: string | null;
    } => typeof post.slug === 'string' && post.slug.length > 0,
  );
}

export async function buildAllSitemapEntries(now: Date = new Date()): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_PUBLIC_ROUTES.map(
    ({ path, priority, changefreq }) => ({
      loc: toSitemapLoc(path),
      lastmod: toIso8601(now, now),
      changefreq,
      priority,
    }),
  );

  let blogEntries: SitemapEntry[] = [];
  try {
    const posts = await fetchPublishedSlugBlogPosts();
    blogEntries = posts.map((post) => {
      // Canonical path — matches generateMetadata on the article page
      const canonicalPath = buildBlogPostPath({
        slug: post.slug,
        category: post.category,
        category_slug: post.category_slug,
      });
      return {
        loc: toSitemapLoc(canonicalPath),
        lastmod: toIso8601(post.updated_at ?? post.date, now),
        changefreq: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch (err) {
    // Never fail the whole sitemap — static URLs must remain crawlable
    console.error('[sitemap] unexpected Slug blog error:', err);
  }

  return dedupeSitemapEntries([...staticEntries, ...blogEntries]);
}

export function chunkSitemapEntries(
  entries: SitemapEntry[],
  limit: number = SITEMAP_URL_LIMIT,
): SitemapEntry[][] {
  if (entries.length === 0) return [[]];
  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += limit) {
    chunks.push(entries.slice(i, i + limit));
  }
  return chunks;
}

/** Official Sitemap Protocol urlset (UTF-8 XML). */
export function renderUrlsetXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** Official Sitemap Protocol index when URL count exceeds 50,000. */
export function renderSitemapIndexXml(
  sitemapLocs: { loc: string; lastmod: string }[],
): string {
  const items = sitemapLocs
    .map(
      (s) => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${escapeXml(s.lastmod)}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}
