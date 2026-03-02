import { test, expect } from '../fixtures';

test.describe('Visual Regression — Page Snapshots', () => {
  test('studio page layout @visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('studio.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });

  test('stock footage page layout @visual', async ({ page }) => {
    await page.goto('/stock-footage');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('stock-footage.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });
});
