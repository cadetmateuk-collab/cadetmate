import { describe, expect, it } from 'vitest';
import { buildPageMetadata, buildNoIndexMetadata } from '@/lib/seo/metadata';
import { buildArticleSchema, buildFAQSchema } from '@/lib/seo/schema';
import { SITE_URL } from '@/lib/seo/site';

describe('buildPageMetadata (integration)', () => {
  it('sets canonical, indexable robots, and absolute title', () => {
    const meta = buildPageMetadata({
      title: 'Pricing',
      path: '/pricing',
      description: 'Plans for UK deck cadets',
    });

    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/pricing`);
    expect(meta.robots).toMatchObject({ index: true, follow: true });
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/pricing`);
    expect(String((meta.title as { absolute?: string }).absolute)).toContain(
      'CadetMate',
    );
  });

  it('marks private areas noindex', () => {
    const meta = buildNoIndexMetadata('Dashboard', '/dashboard');
    expect(meta.robots).toMatchObject({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/dashboard`);
  });
});

describe('structured data builders', () => {
  it('builds Article schema with ISO dates and free flag', () => {
    const schema = buildArticleSchema({
      title: 'TRB Guide',
      excerpt: 'How to complete your TRB',
      slug: 'trb-guide',
      author: 'CadetMate',
      date: '2026-07-01',
      updated_at: '2026-07-11T12:00:00.000Z',
      category: 'TRB',
      category_slug: 'trb',
      image: 'https://example.com/img.jpg',
    });

    expect(schema['@type']).toBe('Article');
    expect(schema.url).toBe(`${SITE_URL}/free-content/trb/trb-guide`);
    expect(schema.datePublished).toContain('2026');
    expect(schema.isAccessibleForFree).toBe(true);
    expect(schema.image).toEqual(['https://example.com/img.jpg']);
  });

  it('returns null FAQ schema for empty lists', () => {
    expect(buildFAQSchema([])).toBeNull();
  });

  it('builds FAQPage schema', () => {
    const schema = buildFAQSchema([
      { question: 'Is CadetMate free?', answer: 'Yes, a free plan exists.' },
    ]);
    expect(schema?.['@type']).toBe('FAQPage');
    expect(schema?.mainEntity).toHaveLength(1);
  });
});
