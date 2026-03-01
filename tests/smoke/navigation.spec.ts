import { test, expect } from '@playwright/test';

test.describe('Navigation & Page Load', () => {
  test('homepage loads with correct title and heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Pre-Viz Studio');
    await expect(page.getByRole('heading', { name: 'Create Your Scene' })).toBeVisible();
  });

  test('navigate Studio → Stock Footage → History via nav links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Create Your Scene' })).toBeVisible();

    await page.getByRole('link', { name: 'Stock Footage' }).click();
    await expect(page.getByRole('heading', { name: 'Stock Footage Generator' })).toBeVisible();

    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByRole('heading', { name: 'Video History' })).toBeVisible();
  });

  test('logo link returns to Studio from any page', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Video History' })).toBeVisible();

    await page.getByRole('link', { name: /Pre-Viz Engine/ }).click();
    await expect(page.getByRole('heading', { name: 'Create Your Scene' })).toBeVisible();
  });

  test('all 3 nav links visible on every page', async ({ page }) => {
    const navLinks = ['Studio', 'Stock Footage', 'History'];
    const pages = ['/', '/stock-footage', '/history'];

    for (const url of pages) {
      await page.goto(url);
      for (const linkName of navLinks) {
        await expect(page.getByRole('link', { name: linkName })).toBeVisible();
      }
    }
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This page could not be found.' })).toBeVisible();
  });
});
