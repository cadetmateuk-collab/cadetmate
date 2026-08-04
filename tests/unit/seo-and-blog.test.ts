import { describe, expect, it } from 'vitest';
import {
  slugifySegment,
  resolveCategorySlug,
  buildBlogPostPath,
} from '@/lib/blog/paths';
import { normalizeCanonicalPath } from '@/lib/seo/metadata';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';

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
