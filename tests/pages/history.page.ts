import { type Page, type Locator } from '@playwright/test';

export class HistoryPage {
  readonly heading: Locator;
  readonly yourVideosTab: Locator;
  readonly allVideosTab: Locator;
  readonly videoCountText: Locator;
  readonly loadMoreButton: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyStateText: Locator;
  readonly statusBadges: Locator;
  readonly videoElements: Locator;
  readonly failedErrorMessage: Locator;

  constructor(private page: Page) {
    this.heading = this.page.getByRole('heading', { name: 'Video History', level: 2 });
    this.yourVideosTab = this.page.getByRole('button', { name: 'Your Videos' });
    this.allVideosTab = this.page.getByRole('button', { name: 'All Videos' });
    this.videoCountText = this.page.getByText(/^\d+ videos?$/);
    this.loadMoreButton = this.page.getByRole('button', { name: /Load More/ });
    this.loadingIndicator = this.page.getByText('Loading videos...');
    this.emptyStateText = this.page.getByText(/haven't generated any videos yet/i);
    this.statusBadges = this.page.getByText(/^(Completed|Failed|Pending)$/);
    this.videoElements = this.page.locator('video');
    this.failedErrorMessage = this.page.getByText('Your request was blocked by our moderation system.');
  }

  async goto() {
    await this.page.goto('/history');
  }

  async waitForVideosLoaded() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 15_000 });
  }

  async switchToAllVideos() {
    await this.allVideosTab.click();
    await this.waitForTabLoaded();
  }

  async switchToYourVideos() {
    await this.yourVideosTab.click();
    await this.waitForTabLoaded();
  }

  private async waitForTabLoaded() {
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 15_000 });
  }

  async getVideoCount(): Promise<number> {
    const text = await this.videoCountText.first().textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async clickLoadMore() {
    await this.loadMoreButton.click();
    await this.waitForVideosLoaded();
  }
}
