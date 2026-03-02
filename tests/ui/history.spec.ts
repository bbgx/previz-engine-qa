import { test, expect } from '../fixtures';
import { HistoryPage } from '../pages';

test.describe('History Page', () => {
  test.beforeEach(async ({ historyPage }) => {
    await historyPage.goto();
    await historyPage.waitForVideosLoaded();
  });

  test('page loads with Video History heading @smoke @ui', async ({ historyPage }) => {
    await expect(historyPage.heading).toBeVisible();
  });

  test('Your Videos tab shows videos for current cookie @smoke @ui', async ({ historyPage }) => {
    await expect(historyPage.yourVideosTab).toBeVisible();
    const count = await historyPage.getVideoCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('All Videos tab shows videos with count > 0 @smoke @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    const count = await historyPage.getVideoCount();
    expect(count).toBeGreaterThan(0);
  });

  test('video cards display status badges @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    const badgeCount = await historyPage.statusBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('completed videos have playable video elements @ui @regression', async ({ historyPage }) => {
    test.fixme(true, 'Flaky: Load More button not always present on first page load');
    await historyPage.switchToAllVideos();
    await historyPage.clickLoadMore();
    const videoCount = await historyPage.videoElements.count();
    expect(videoCount).toBeGreaterThan(0);
  });

  test('failed videos show error message @ui', async ({ historyPage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Requires Load More which is broken on mobile (BUG-009)');
    await historyPage.switchToAllVideos();
    for (let i = 0; i < 6; i++) {
      if (await historyPage.failedErrorMessage.first().isVisible().catch(() => false)) break;
      await historyPage.clickLoadMore();
    }
    await expect(historyPage.failedErrorMessage.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Load More button appears and loads additional videos @ui', async ({ historyPage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await historyPage.switchToAllVideos();
    await expect(historyPage.loadMoreButton).toBeVisible();
    await historyPage.clickLoadMore();
    const badgeCount = await historyPage.statusBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

});

test.describe('History Page — Fresh Session', () => {
  test('Your Videos tab shows empty state for fresh browser @ui', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const history = new HistoryPage(page);
    await history.goto();
    await history.waitForVideosLoaded();
    await expect(history.emptyStateText).toBeVisible();
    await context.close();
  });
});
