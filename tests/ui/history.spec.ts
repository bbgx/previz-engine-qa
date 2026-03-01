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
    await historyPage.switchToAllVideos();
    const videoCount = await historyPage.videoElements.count();
    expect(videoCount).toBeGreaterThan(0);
  });

  test('failed videos show error message @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    await expect(historyPage.failedErrorMessage.first()).toBeVisible();
  });

  test('Load More button appears and loads additional videos @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    await expect(historyPage.loadMoreButton).toBeVisible();
    await historyPage.clickLoadMore();
    const badgeCount = await historyPage.statusBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('debug info panel should not be visible in production @ui @regression', async ({ historyPage }) => {
    test.fail(true, 'BUG-005: Cookie Debug Info panel is exposed in production');
    await expect(historyPage.debugPanel).toBeHidden();
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
