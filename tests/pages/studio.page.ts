import { type Page, type Locator, type Response } from '@playwright/test';

export class StudioPage {
  readonly heading: Locator;
  readonly promptTextarea: Locator;
  readonly generateButton: Locator;
  readonly videoCountSpinner: Locator;
  readonly durationDropdown: Locator;
  readonly durationOptions: Locator;
  readonly aspectRatioDropdown: Locator;
  readonly aspectRatioOptions: Locator;
  readonly hqModeLabel: Locator;
  readonly hqToggleButton: Locator;
  readonly hqWarning: Locator;
  readonly renderingHeading: Locator;
  readonly errorMessage: Locator;
  readonly networkErrorMessage: Locator;
  readonly crashIndicator: Locator;

  constructor(private page: Page) {
    this.heading = this.page.getByRole('heading', { name: 'Create Your Scene', level: 2 });
    this.promptTextarea = this.page.getByRole('textbox', { name: 'Direct Prompt for Sora' });
    this.generateButton = this.page.getByRole('button', { name: /Generate.*Videos?/i });
    this.videoCountSpinner = this.page.getByRole('spinbutton', { name: 'Number of Videos to Generate' });

    const optionsSection = this.page.locator('section, div').filter({ has: this.page.getByRole('heading', { name: 'Video Generation Options' }) });
    this.durationDropdown = optionsSection.getByRole('combobox').first();
    this.durationOptions = this.durationDropdown.locator('option');
    this.aspectRatioDropdown = optionsSection.getByRole('combobox').nth(1);
    this.aspectRatioOptions = this.aspectRatioDropdown.locator('option');

    this.hqModeLabel = this.page.getByText('High Quality Mode', { exact: true });
    this.hqToggleButton = this.hqModeLabel.locator('..').getByRole('button');
    this.hqWarning = this.page.getByText(/Warning:.*High quality mode/i);
    this.renderingHeading = this.page.getByRole('heading', { name: 'Rendering Pre-Viz Videos' });
    this.errorMessage = this.page.getByText(/error|failed|something went wrong/i).first();
    this.networkErrorMessage = this.page.getByText(/error|failed|network|something went wrong/i).first();
    this.crashIndicator = this.page.getByText(/unhandled|unexpected|cannot read/i);
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillPrompt(text: string) {
    await this.promptTextarea.fill(text);
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async setVideoCount(count: number) {
    await this.videoCountSpinner.fill(String(count));
  }

  async toggleHq() {
    await this.hqToggleButton.click();
  }

  async triggerGenerationAndAwaitResponse(prompt: string): Promise<Response> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/generate-video') && res.request().method() === 'POST',
    );
    await this.fillPrompt(prompt);
    await this.clickGenerate();
    return responsePromise;
  }

  async waitForRenderingState() {
    await this.renderingHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async waitForStatusPolling(): Promise<string[]> {
    const calls: string[] = [];
    this.page.on('request', (req) => {
      if (req.url().includes('/api/video-status')) {
        calls.push(req.url());
      }
    });
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/video-status'),
      { timeout: 15_000 },
    );
    return calls;
  }

  async hasVisibleError(): Promise<boolean> {
    return this.errorMessage.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async hasNetworkError(): Promise<boolean> {
    return this.networkErrorMessage.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async hasPageCrashed(): Promise<boolean> {
    return this.crashIndicator.isVisible().catch(() => false);
  }

  async mockGenerateApi() {
    let callCount = 0;
    await this.page.route('**/api/generate-video', async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskId: `mock-task-${callCount}`,
          duration_ms: 100,
          prompt_length: 34,
          aspect_ratio: 'landscape',
          seconds: '8',
          pro: true,
        }),
      });
    });
  }

  async mockVideoStatusApi() {
    await this.page.route('**/api/video-status**', async (route) => {
      const url = new URL(route.request().url());
      const taskId = url.searchParams.get('taskId') ?? 'mock-task-1';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskId,
          state: 'generating',
          failMsg: null,
          createTime: Date.now(),
        }),
      });
    });
  }
}
