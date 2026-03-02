import { test, expect } from '../fixtures';
import { SCREENPLAYS, PROMPTS } from '../data';

test.describe('Mobile Viewport — Responsive Layout', () => {
  test.use({ actionTimeout: 5_000 });

  test('nav links are clickable at mobile width @ui @regression', async ({ page, nav }) => {
    test.fail(true, 'BUG-009: nav links intercepted by overlapping elements at Pixel 5 viewport');
    await page.goto('/');
    await nav.stockFootageLink.click();
    await expect(nav.stockFootageHeading).toBeVisible();
    await nav.historyLink.click();
    await expect(nav.historyHeading).toBeVisible();
  });

  test('studio generation form accessible at mobile width @ui @regression', async ({ studioPage }) => {
    test.fail(true, 'BUG-009: generation controls obscured at Pixel 5 viewport');
    await studioPage.mockGenerateApi();
    await studioPage.mockVideoStatusApi();
    await studioPage.goto();
    await studioPage.fillPrompt(PROMPTS.simple);
    await expect(studioPage.generateButton).toBeEnabled();
    await studioPage.generateButton.click();
  });

  test('stock footage parse button not intercepted by overlapping elements @ui @regression', async ({ stockFootagePage }) => {
    test.fail(true, 'BUG-009: parse button intercepted by settings panel at Pixel 5 viewport');
    await stockFootagePage.goto();
    await stockFootagePage.fillScript(SCREENPLAYS.twoScene);
    await expect(stockFootagePage.parseButton).toBeEnabled();
    await stockFootagePage.parseButton.click();
  });

  test('history Load More button reachable at mobile width @ui @regression', async ({ historyPage }) => {
    test.fail(true, 'BUG-009: Load More button not reachable at Pixel 5 viewport');
    await historyPage.goto();
    await historyPage.waitForVideosLoaded();
    await historyPage.switchToAllVideos();
    await expect(historyPage.loadMoreButton).toBeVisible();
    await historyPage.loadMoreButton.click();
  });
});
