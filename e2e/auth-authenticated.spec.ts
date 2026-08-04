import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

/**
 * Authenticated journeys — skipped unless E2E_USER_EMAIL / E2E_USER_PASSWORD are set.
 */
test.describe('Authenticated journeys', () => {
  test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run');

  test('login reaches dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email/i).first().fill(email!);
    await page.getByLabel(/^password$/i).first().fill(password!);
    await page.getByRole('button', { name: /login|sign in/i }).first().click();
    await expect(page).toHaveURL(/\/(dashboard|home|learn)/, { timeout: 30_000 });
  });
});
