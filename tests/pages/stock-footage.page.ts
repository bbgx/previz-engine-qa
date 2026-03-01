import { type Page, type Locator, expect } from '@playwright/test';

export class StockFootagePage {
  readonly heading: Locator;
  readonly scriptTextarea: Locator;
  readonly parseButton: Locator;
  readonly durationDropdown: Locator;
  readonly aspectRatioDropdown: Locator;
  readonly hqModeLabel: Locator;
  readonly startOverButton: Locator;
  readonly generateButton: Locator;
  readonly loadingIndicator: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Stock Footage Generator', level: 2 });
    this.scriptTextarea = page.getByRole('textbox', { name: 'Script Text' });
    this.parseButton = page.getByRole('button', { name: 'Parse Script' });

    const settingsSection = page.locator('section, div').filter({ has: page.getByRole('heading', { name: 'Video Generation Settings' }) });
    this.durationDropdown = settingsSection.getByRole('combobox').first();
    this.aspectRatioDropdown = settingsSection.getByRole('combobox').nth(1);

    this.hqModeLabel = page.getByText('High Quality Mode');
    this.startOverButton = page.getByRole('button', { name: /Start Over/i });
    this.generateButton = page.getByRole('button', { name: /Generate.*Videos?/i });
    this.loadingIndicator = page.getByText(/Generating Your Prompt/i);
  }

  async goto() {
    await this.page.goto('/stock-footage');
  }

  async fillScript(text: string) {
    await this.scriptTextarea.fill(text);
  }

  async clickParse() {
    await this.parseButton.click();
  }

  async waitForParsedShots() {
    await expect(this.loadingIndicator).toBeVisible({ timeout: 5_000 });
    await expect(this.loadingIndicator).toBeHidden({ timeout: 30_000 });
  }

  getParsedShotTextboxes() {
    return this.page.getByRole('textbox').filter({ hasNot: this.scriptTextarea });
  }
}
