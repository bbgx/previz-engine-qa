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

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Stock Footage Generator', level: 2 });
    this.scriptTextarea = page.getByRole('textbox', { name: 'Script Text' });
    this.parseButton = page.getByRole('button', { name: 'Parse Script' });

    const settingsSection = page.locator('section, div').filter({ has: page.getByRole('heading', { name: 'Video Generation Settings' }) });
    this.durationDropdown = settingsSection.getByRole('combobox').first();
    this.aspectRatioDropdown = settingsSection.getByRole('combobox').nth(1);

    this.hqModeLabel = page.getByText('High Quality Mode', { exact: true });
    this.startOverButton = page.getByRole('button', { name: /Start Over/i });
    this.generateButton = page.getByRole('button', { name: /Generate.*Videos?/i });
    this.loadingHeading = page.getByRole('heading', { name: 'Generating Your Prompt' });
    this.parsedShotsHeading = page.getByRole('heading', { name: 'Parsed Shots' });
    this.parsedShotsDescription = page.getByText(/Found \d+ shots? in your script/);
    this.shotTextboxes = page.getByRole('textbox', { name: /Edit your prompt/i });
    this.shotHeadings = page.getByRole('heading', { name: /Shot \d+ of \d+/ });
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
}
