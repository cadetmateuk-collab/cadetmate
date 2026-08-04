import { test, expect, devices } from '@playwright/test';

/**
 * Cross-viewport smoke checks for layout / touch targets.
 * Runs in every Playwright project (desktop, tablet, mobile).
 */
test.describe('Responsive shell', () => {
  test('public header remains usable', async ({ page }, testInfo) => {
    await page.goto('/home');

    const isMobile = testInfo.project.name.toLowerCase().includes('mobile');
    if (isMobile) {
      // Mobile menu control should exist on small viewports
      const menu = page.getByRole('button', { name: /menu|open navigation|toggle/i });
      // Some headers use a different pattern — fall back to logo link
      const logo = page.getByRole('link').filter({ has: page.locator('img, svg') }).first();
      await expect(menu.or(logo).first()).toBeVisible();
    } else {
      await expect(page.getByRole('navigation').first()).toBeVisible();
    }
  });

  test('primary CTA is within the first viewport', async ({ page }) => {
    await page.goto('/home');
    const cta = page
      .getByRole('link', { name: /start learning free|create free account|browse free content/i })
      .first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.y).toBeLessThan(900);
    }
  });
});

test.describe('Touch-friendly auth', () => {
  test.use({ ...devices['iPhone 14'] });

  test('auth inputs are large enough to tap', async ({ page }) => {
    await page.goto('/auth');
    const email = page.getByLabel(/email/i).first();
    await expect(email).toBeVisible();
    const box = await email.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
