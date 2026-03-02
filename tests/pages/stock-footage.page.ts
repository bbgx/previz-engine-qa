import { type Page, type Locator } from '@playwright/test';

export class StockFootagePage {
  readonly heading: Locator;
  readonly scriptTextarea: Locator;
  readonly parseButton: Locator;
  readonly durationDropdown: Locator;
  readonly aspectRatioDropdown: Locator;
  readonly hqModeLabel: Locator;
  readonly startOverButton: Locator;
  readonly generateButton: Locator;
  readonly loadingHeading: Locator;
  readonly parsedShotsHeading: Locator;
  readonly parsedShotsDescription: Locator;
  readonly shotTextboxes: Locator;
  readonly shotHeadings: Locator;
  readonly crashIndicator: Locator;

  constructor(private page: Page) {
    this.heading = this.page.getByRole('heading', { name: 'Stock Footage Generator', level: 2 });
    this.scriptTextarea = this.page.getByRole('textbox', { name: 'Script Text' });
    this.parseButton = this.page.getByRole('button', { name: 'Parse Script' });

    const settingsSection = this.page.locator('section, div').filter({ has: this.page.getByRole('heading', { name: 'Video Generation Settings' }) });
    this.durationDropdown = settingsSection.getByRole('combobox').first();
    this.aspectRatioDropdown = settingsSection.getByRole('combobox').nth(1);

    this.hqModeLabel = this.page.getByText('High Quality Mode', { exact: true });
    this.startOverButton = this.page.getByRole('button', { name: /Start Over/i });
    this.generateButton = this.page.getByRole('button', { name: /Generate.*Videos?/i });
    this.loadingHeading = this.page.getByRole('heading', { name: 'Generating Your Prompt' });
    this.parsedShotsHeading = this.page.getByRole('heading', { name: 'Parsed Shots' });
    this.parsedShotsDescription = this.page.getByText(/Found \d+ shots? in your script/);
    this.shotTextboxes = this.page.getByRole('textbox', { name: /Edit your prompt/i });
    this.shotHeadings = this.page.getByRole('heading', { name: /Shot \d+ of \d+/ });
    this.crashIndicator = this.page.getByText(/unhandled|unexpected|cannot read/i);
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

  async parseScript(text: string) {
    await this.fillScript(text);
    await this.clickParse();
    await this.waitForParsedShots();
  }

  async waitForParsedShots() {
    await this.loadingHeading.waitFor({ state: 'visible', timeout: 5_000 });
    await this.loadingHeading.waitFor({ state: 'hidden', timeout: 30_000 });
  }

  async clickStartOver() {
    await this.startOverButton.click();
  }

  async hasPageCrashed(): Promise<boolean> {
    return this.crashIndicator.isVisible().catch(() => false);
  }
}
