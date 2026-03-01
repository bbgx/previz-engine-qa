import { type Page, type Locator, expect } from '@playwright/test';

export class HistoryPage {
  readonly heading: Locator;
  readonly yourVideosTab: Locator;
  readonly allVideosTab: Locator;
  readonly videoCount: Locator;
  readonly loadMoreButton: Locator;
  readonly debugPanel: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Video History', level: 2 });
    this.yourVideosTab = page.getByRole('button', { name: 'Your Videos' });
    this.allVideosTab = page.getByRole('button', { name: 'All Videos' });
    this.videoCount = page.locator('text=/\\d+ videos?/');
    this.loadMoreButton = page.locator('button:has(img)').filter({ hasNotText: /Videos|Your|All/ });
    this.debugPanel = page.getByText('Cookie Debug Info');
  }

  async goto() {
    await this.page.goto('/history');
  }

  async waitForVideosLoaded() {
    await expect(this.page.getByText('Loading videos...')).toBeHidden({ timeout: 15_000 });
  }

  async switchToAllVideos() {
    await this.allVideosTab.click();
    await this.waitForVideosLoaded();
  }

  async switchToYourVideos() {
    await this.yourVideosTab.click();
    await this.waitForVideosLoaded();
  }

  getVideoCards() {
    return this.page.locator('[class*="video"], [class*="card"]').filter({
      has: this.page.locator('text=/Completed|Failed|Processing|Pending/'),
    });
  }

  getFailedVideos() {
    return this.page.locator('text=Failed').locator('..').locator('..');
  }

  getCompletedVideos() {
    return this.page.locator('text=Completed').locator('..').locator('..');
  }

  getVideoElements() {
    return this.page.locator('video');
  }
}
