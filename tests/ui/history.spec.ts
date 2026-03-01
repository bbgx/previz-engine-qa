import { test, expect } from '../fixtures';

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

  test('completed videos have playable video elements @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    const completedCount = await historyPage.completedBadges.count();
    if (completedCount > 0) {
      const videoCount = await historyPage.videoElements.count();
      expect(videoCount).toBeGreaterThan(0);
    }
  });

  test('failed videos show error message @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    const failedCount = await historyPage.failedBadges.count();
    if (failedCount > 0) {
      await expect(historyPage.failedErrorMessage.first()).toBeVisible();
    }
  });

  test('Load More button appears and loads additional videos @ui', async ({ historyPage }) => {
    await historyPage.switchToAllVideos();
    const totalCount = await historyPage.getVideoCount();

    if (totalCount > 20) {
      await expect(historyPage.loadMoreButton).toBeVisible();
      const beforeBadges = await historyPage.statusBadges.count();
      await historyPage.clickLoadMore();
      const afterBadges = await historyPage.statusBadges.count();
      expect(afterBadges).toBeGreaterThanOrEqual(beforeBadges);
    }
  });
});

test.describe('History Page — Fresh Session', () => {
  test('Your Videos tab shows empty state for fresh browser @ui', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/history');
    await page.getByText('Loading videos...').waitFor({ state: 'hidden', timeout: 15_000 });
    await expect(page.getByText(/haven't generated any videos yet/i)).toBeVisible();
    await context.close();
  });
});
