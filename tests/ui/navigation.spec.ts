import { test, expect } from '../fixtures';

test.describe('Navigation', () => {
  test('homepage loads with title and heading @smoke @ui', async ({ page, nav }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Pre-Viz Studio');
    await expect(nav.studioHeading).toBeVisible();
  });

  test('navigate Studio → Stock Footage → History @smoke @ui', async ({ page, nav }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await page.goto('/');
    await expect(nav.studioHeading).toBeVisible();

    await nav.goToStockFootage();
    await expect(nav.stockFootageHeading).toBeVisible();

    await nav.goToHistory();
    await expect(nav.historyHeading).toBeVisible();
  });

  test('logo returns to Studio from any page @smoke @ui', async ({ page, nav }) => {
    await page.goto('/history');
    await nav.goHome();
    await expect(nav.studioHeading).toBeVisible();
  });

  test('all 3 nav links visible on every page @smoke @ui', async ({ page, nav }) => {
    for (const url of ['/', '/stock-footage', '/history']) {
      await page.goto(url);
      for (const link of nav.navLinks) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('unknown route returns 404 @smoke @ui', async ({ page, nav }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
    await expect(nav.notFoundHeading).toBeVisible();
  });
});
