import { describe, expect, it } from 'vitest';
import {
  slugifySegment,
  resolveCategorySlug,
  buildBlogPostPath,
} from '@/lib/blog/paths';
import { normalizeCanonicalPath } from '@/lib/seo/metadata';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';
import {
  SITEMAP_URL_LIMIT,
  chunkSitemapEntries,
  dedupeSitemapEntries,
  renderSitemapIndexXml,
  renderUrlsetXml,
  toSitemapLoc,
  type SitemapEntry,
} from '@/lib/seo/sitemap';

describe('blog paths', () => {
  it('slugifies category labels', () => {
    expect(slugifySegment(' Sea Survival! ')).toBe('sea-survival');
  });

  it('prefers category_slug over label', () => {
    expect(
      resolveCategorySlug({ category_slug: 'trb', category: 'Training Record Book' }),
    ).toBe('trb');
    expect(resolveCategorySlug({ category: 'Cadetship' })).toBe('cadetship');
    expect(resolveCategorySlug({})).toBe('general');
  });

  it('builds canonical article paths', () => {
    expect(
      buildBlogPostPath({
        slug: 'first-week-onboard',
        category_slug: 'cadetship',
      }),
    ).toBe('/free-content/cadetship/first-week-onboard');
  });
});

describe('SEO URL helpers', () => {
  it('normalizes canonical paths', () => {
    expect(normalizeCanonicalPath('/pricing/')).toBe('/pricing');
    expect(normalizeCanonicalPath('about')).toBe('/about');
    expect(normalizeCanonicalPath('/home?utm=1')).toBe('/home');
  });

  it('builds absolute URLs on the production host', () => {
    expect(absoluteUrl('/home')).toBe(`${SITE_URL}/home`);
  });
});

describe('sitemap XML helpers', () => {
  const sample: SitemapEntry[] = [
    {
      loc: toSitemapLoc('/home'),
      lastmod: '2026-08-06T12:00:00.000Z',
      changefreq: 'weekly',
      priority: 1.0,
    },
    {
      loc: toSitemapLoc('/free-content/cadetship/first-week'),
      lastmod: '2026-08-05T09:30:00.000Z',
      changefreq: 'weekly',
      priority: 0.8,
    },
  ];

  it('renders a valid urlset with sitemap protocol namespace', () => {
    const xml = renderUrlsetXml(sample);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain(`<loc>${toSitemapLoc('/home')}</loc>`);
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).toContain('<priority>1.0</priority>');
  });

  it('deduplicates locs', () => {
    const duped = dedupeSitemapEntries([...sample, sample[0]]);
    expect(duped).toHaveLength(2);
  });

  it('chunks above the 50k protocol limit', () => {
    expect(SITEMAP_URL_LIMIT).toBe(50_000);
    const many = Array.from({ length: 50_001 }, (_, i) => ({
      loc: toSitemapLoc(`/p/${i}`),
      lastmod: '2026-01-01T00:00:00.000Z',
      changefreq: 'weekly' as const,
      priority: 0.5,
    }));
    const chunks = chunkSitemapEntries(many);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(50_000);
    expect(chunks[1]).toHaveLength(1);

    const index = renderSitemapIndexXml([
      { loc: toSitemapLoc('/sitemaps/0'), lastmod: '2026-01-01T00:00:00.000Z' },
      { loc: toSitemapLoc('/sitemaps/1'), lastmod: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(index).toContain('<sitemapindex');
    expect(index).toContain('/sitemaps/0');
  });
});
