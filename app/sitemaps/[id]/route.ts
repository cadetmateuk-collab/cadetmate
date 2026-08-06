/**
 * GET /sitemaps/[id]
 *
 * Child sitemap chunks referenced by the sitemap index when the site exceeds
 * 50,000 URLs (`/sitemaps/0`, `/sitemaps/1`, …).
 * Each chunk contains at most SITEMAP_URL_LIMIT entries.
 */

import { notFound } from 'next/navigation';
import {
  SITEMAP_URL_LIMIT,
  buildAllSitemapEntries,
  chunkSitemapEntries,
  renderUrlsetXml,
  sitemapXmlResponse,
} from '@/lib/seo/sitemap';

export const revalidate = 3600;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 0) notFound();

  const entries = await buildAllSitemapEntries();
  const chunks = chunkSitemapEntries(entries, SITEMAP_URL_LIMIT);
  const chunk = chunks[id];
  if (!chunk) notFound();

  return sitemapXmlResponse(renderUrlsetXml(chunk));
}
