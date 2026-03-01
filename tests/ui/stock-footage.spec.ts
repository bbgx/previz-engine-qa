import { test, expect } from '../fixtures';
import { SCREENPLAYS } from '../data/fixtures';

test.describe('Stock Footage Page', () => {
  test.beforeEach(async ({ stockFootagePage }) => {
    await stockFootagePage.goto();
  });

  test('parse button disabled when textarea empty, enabled when filled @smoke @ui', async ({ stockFootagePage }) => {
    await expect(stockFootagePage.parseButton).toBeDisabled();
    await stockFootagePage.fillScript(SCREENPLAYS.twoScene);
    await expect(stockFootagePage.parseButton).toBeEnabled();
  });

  test('default aspect ratio is Portrait @smoke @ui', async ({ stockFootagePage }) => {
    await expect(stockFootagePage.aspectRatioDropdown).toHaveValue('portrait');
  });

  test('video settings present with correct defaults @smoke @ui', async ({ stockFootagePage }) => {
    await expect(stockFootagePage.durationDropdown).toHaveValue('8');
    await expect(stockFootagePage.hqModeLabel).toBeVisible();
  });
});

test.describe('Stock Footage — Script Parsing', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ stockFootagePage }) => {
    await stockFootagePage.goto();
  });

  test('script parsing shows loading then parsed shots @smoke @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.fillScript(SCREENPLAYS.twoScene);
    await stockFootagePage.clickParse();
    await expect(stockFootagePage.loadingHeading).toBeVisible();
    await stockFootagePage.waitForParsedShots();
    await expect(stockFootagePage.parsedShotsHeading).toBeVisible();
  });

  test('two-scene script extracts multiple shots with editable prompts @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.parseScript(SCREENPLAYS.twoScene);
    await expect(stockFootagePage.parsedShotsDescription).toBeVisible();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < shotCount; i++) {
      const textbox = stockFootagePage.shotTextboxes.nth(i);
      await expect(textbox).toBeEditable();
      const value = await textbox.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('shot headings show correct numbering @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.parseScript(SCREENPLAYS.twoScene);
    const headingCount = await stockFootagePage.shotHeadings.count();
    expect(headingCount).toBeGreaterThanOrEqual(2);
    await expect(stockFootagePage.shotHeadings.first()).toHaveText(/Shot 1 of \d+/);
  });

  test('generate button appears with correct video count @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.parseScript(SCREENPLAYS.twoScene);
    await expect(stockFootagePage.generateButton).toBeVisible();
    await expect(stockFootagePage.generateButton).toContainText(/Generate \d+ Videos?/);
  });

  test('start over button resets to input state @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.parseScript(SCREENPLAYS.twoScene);
    await expect(stockFootagePage.parsedShotsHeading).toBeVisible();
    await stockFootagePage.clickStartOver();
    await expect(stockFootagePage.scriptTextarea).toBeVisible();
    await expect(stockFootagePage.parseButton).toBeVisible();
  });
});
