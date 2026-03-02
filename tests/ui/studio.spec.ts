import { test, expect } from '../fixtures';
import { PROMPTS } from '../data';

test.describe('Studio Page', () => {
  test.beforeEach(async ({ studioPage }) => {
    await studioPage.goto();
  });

  test('generate button disabled when prompt empty @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.generateButton).toBeDisabled();
  });

  test('generate button enables on input, disables on clear @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.generateButton).toBeDisabled();
    await studioPage.fillPrompt(PROMPTS.cinematic);
    await expect(studioPage.generateButton).toBeEnabled();
    await studioPage.fillPrompt('');
    await expect(studioPage.generateButton).toBeDisabled();
  });

  test('button text reflects video count @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.generateButton).toContainText('Generate 3 Videos');
    await studioPage.setVideoCount(1);
    await expect(studioPage.generateButton).toContainText('Generate 1 Video');
    await studioPage.setVideoCount(5);
    await expect(studioPage.generateButton).toContainText('Generate 5 Videos');
  });

  test('video count spinner defaults to 3 with min=1 max=5 @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.videoCountSpinner).toHaveValue('3');
    await expect(studioPage.videoCountSpinner).toHaveAttribute('min', '1');
    await expect(studioPage.videoCountSpinner).toHaveAttribute('max', '5');
  });

  test('duration dropdown has 4s, 8s (default), 12s @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.durationOptions).toHaveCount(3);
    await expect(studioPage.durationOptions.nth(0)).toHaveText('4 seconds');
    await expect(studioPage.durationOptions.nth(1)).toHaveText('8 seconds');
    await expect(studioPage.durationOptions.nth(2)).toHaveText('12 seconds');
    await expect(studioPage.durationDropdown).toHaveValue('8');
  });

  test('aspect ratio dropdown: Landscape (default), Portrait @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.aspectRatioOptions).toHaveCount(2);
    await expect(studioPage.aspectRatioOptions.nth(0)).toHaveText('Landscape');
    await expect(studioPage.aspectRatioOptions.nth(1)).toHaveText('Portrait');
    await expect(studioPage.aspectRatioDropdown).toHaveValue('landscape');
  });

  test('HQ mode label and toggle visible @smoke @ui', async ({ studioPage }) => {
    await expect(studioPage.hqModeLabel).toBeVisible();
    await expect(studioPage.hqToggleButton).toBeVisible();
  });

  test('HQ warning should be hidden when toggle is off after reload @ui @regression', async ({ studioPage }) => {
    test.fail(true, 'BUG-007: HQ warning persists after page reload even when toggle resets to off');
    await studioPage.toggleHq();
    await studioPage.goto();
    await expect(studioPage.hqWarning).toBeHidden();
  });
});

test.describe('Studio Generation (mocked)', () => {
  test.beforeEach(async ({ studioPage }) => {
    await studioPage.mockGenerateApi();
    await studioPage.mockVideoStatusApi();
    await studioPage.goto();
  });

  test('generation trigger transitions to rendering state @smoke @ui @regression', async ({ studioPage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    const response = await studioPage.triggerGenerationAndAwaitResponse(PROMPTS.simple);
    expect(response.status()).toBe(200);
    await studioPage.waitForRenderingState();
    await expect(studioPage.renderingHeading).toBeVisible();
  });

  test('polling starts after generation trigger @smoke @ui', async ({ studioPage }) => {
    test.skip(test.info().project.name === 'mobile-chrome', 'Mobile viewport covered in mobile.spec.ts');
    await studioPage.fillPrompt(PROMPTS.simple);
    const pollingPromise = studioPage.waitForStatusPolling();
    await studioPage.clickGenerate();
    const statusCalls = await pollingPromise;
    expect(statusCalls.length).toBeGreaterThan(0);
  });
});
