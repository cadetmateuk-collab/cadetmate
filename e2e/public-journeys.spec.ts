import { test, expect } from '@playwright/test';

/**
 * Critical public journeys — must work without authentication.
 */
test.describe('Public marketing journeys', () => {
  test('home page loads with primary CTA', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /start learning free|create free account|browse free content/i }).first(),
    ).toBeVisible();
  });

  test('pricing page is indexable and shows plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/premium/i).first()).toBeVisible();
  });

  test('free content listing is searchable', async ({ page }) => {
    await page.goto('/free-content');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const search = page.getByRole('searchbox').or(page.getByLabel(/search articles/i));
    await expect(search.first()).toBeVisible();
  });

  test('auth page renders sign-in form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/^password$/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i }).first()).toBeVisible();
  });
});

test.describe('Auth gates', () => {
  test('dashboard redirects anonymous users to auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('protected buoyage redirects anonymous users to auth', async ({ page }) => {
    await page.goto('/buoyage');
    await expect(page).toHaveURL(/\/auth/);
  });
});
