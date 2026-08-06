/**
 * GET /sitemap.xml
 *
 * Dynamically builds a valid XML sitemap (or sitemap index if >50k URLs).
 * Slug blog posts are loaded from Supabase `blog_posts` — see `lib/seo/sitemap.ts`.
 */

import {
  SITEMAP_URL_LIMIT,
  buildAllSitemapEntries,
  chunkSitemapEntries,
  renderSitemapIndexXml,
  renderUrlsetXml,
  sitemapXmlResponse,
  toIso8601,
  toSitemapLoc,
} from '@/lib/seo/sitemap';

export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const entries = await buildAllSitemapEntries(now);

  // Protocol limit: split into an index + child sitemaps when over 50,000 URLs
  if (entries.length > SITEMAP_URL_LIMIT) {
    const chunks = chunkSitemapEntries(entries, SITEMAP_URL_LIMIT);
    const lastmod = toIso8601(now, now);
    const index = renderSitemapIndexXml(
      chunks.map((_, id) => ({
        loc: toSitemapLoc(`/sitemaps/${id}`),
        lastmod,
      })),
    );
    return sitemapXmlResponse(index);
  }

  return sitemapXmlResponse(renderUrlsetXml(entries));
}
