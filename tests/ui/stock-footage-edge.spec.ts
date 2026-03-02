import { test, expect } from '../fixtures';
import { SCREENPLAYS_EDGE } from '../data';

test.describe('Stock Footage — Script Parsing Edge Cases', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ stockFootagePage }) => {
    await stockFootagePage.goto();
  });

  test('empty script keeps parse button disabled @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.empty);
    await expect(stockFootagePage.parseButton).toBeDisabled();
  });

  test('whitespace-only script keeps parse button disabled @ui', async ({ stockFootagePage }) => {
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.whitespaceOnly);
    await expect(stockFootagePage.parseButton).toBeDisabled();
  });

  test('single word input parses without crash @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.singleWord);
    await expect(stockFootagePage.parseButton).toBeEnabled();
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });

  test('text without scene headings still parses @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.noSceneHeading);
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });

  test('dialogue-heavy script extracts shots @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.dialogueHeavy);
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });

  test('unicode screenplay text parses without errors @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.unicodeHeavy);
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });

  test('malformed headings still parse or fail gracefully @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.malformedHeadings);
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });

  test('special characters in screenplay parse correctly @ui', async ({ stockFootagePage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await stockFootagePage.fillScript(SCREENPLAYS_EDGE.specialCharacters);
    await stockFootagePage.clickParse();
    await stockFootagePage.waitForParsedShots();
    const shotCount = await stockFootagePage.shotTextboxes.count();
    expect(shotCount).toBeGreaterThanOrEqual(1);
  });
});
