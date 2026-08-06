import { test, expect } from '@playwright/test';

/**
 * Crawl / SEO smoke — robots, sitemap, canonical signals.
 */
test.describe('Search Console readiness', () => {
  test('robots.txt is reachable and references sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/Sitemap:\s*https?:\/\/.+/i);
    expect(body).toMatch(/Disallow:\s*\/auth/i);
  });

  test('sitemap.xml returns URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/xml/);
    const body = await res.text();
    // Single urlset under 50k URLs, or sitemapindex when split
    expect(body).toMatch(/<(urlset|sitemapindex)\s/);
    expect(body).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    if (body.includes('<urlset')) {
      expect(body).toContain('/home');
      expect(body).toContain('/free-content');
    }
  });

  test('home has a canonical link', async ({ page }) => {
    await page.goto('/home');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/home\/?$/);
  });
});
