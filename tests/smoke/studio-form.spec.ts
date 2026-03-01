import { test, expect } from '@playwright/test';

test.describe('Studio Page — Form & Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('generate button disabled when prompt is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: /Generate.*Videos/i });
    await expect(button).toBeDisabled();
  });

  test('generate button enables when prompt entered, disables when cleared', async ({ page }) => {
    const button = page.getByRole('button', { name: /Generate.*Videos/i });
    const textarea = page.getByRole('textbox', { name: 'Direct Prompt for Sora' });

    await expect(button).toBeDisabled();

    await textarea.fill('A cinematic shot of a sunset over the ocean');
    await expect(button).toBeEnabled();

    await textarea.fill('');
    await expect(button).toBeDisabled();
  });

  test('button text reflects video count', async ({ page }) => {
    const spinner = page.getByRole('spinbutton', { name: 'Number of Videos to Generate' });
    const button = page.getByRole('button', { name: /Generate.*Videos?/i });

    await expect(button).toContainText('Generate 3 Videos');

    await spinner.fill('1');
    await expect(button).toContainText('Generate 1 Video');

    await spinner.fill('5');
    await expect(button).toContainText('Generate 5 Videos');
  });

  test('video count spinner defaults to 3, has min=1 max=5', async ({ page }) => {
    const spinner = page.getByRole('spinbutton', { name: 'Number of Videos to Generate' });
    await expect(spinner).toHaveValue('3');

    // Check min/max attributes
    await expect(spinner).toHaveAttribute('min', '1');
    await expect(spinner).toHaveAttribute('max', '5');
  });

  test('duration dropdown: 4s, 8s (default), 12s', async ({ page }) => {
    const dropdown = page.locator('select').filter({ has: page.locator('option', { hasText: '8 seconds' }) });
    await expect(dropdown).toHaveValue('8');

    const options = dropdown.locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText('4 seconds');
    await expect(options.nth(1)).toHaveText('8 seconds');
    await expect(options.nth(2)).toHaveText('12 seconds');
  });

  test('aspect ratio dropdown: Landscape (default), Portrait', async ({ page }) => {
    const dropdown = page.locator('select').filter({ has: page.locator('option', { hasText: 'Landscape' }) });

    const options = dropdown.locator('option');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText('Landscape');
    await expect(options.nth(1)).toHaveText('Portrait');

    // Landscape is default
    await expect(dropdown).toHaveValue('landscape');
  });

  test('HQ toggle and High Quality Mode label visible', async ({ page }) => {
    // Verify the HQ mode section is present with its label and toggle
    await expect(page.getByText('High Quality Mode')).toBeVisible();
    // The toggle button for HQ mode should be present
    const hqSection = page.locator('text=High Quality Mode').locator('..');
    await expect(hqSection.getByRole('button')).toBeVisible();
  });

  test('generation trigger: transitions to rendering state', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'Direct Prompt for Sora' });
    const button = page.getByRole('button', { name: /Generate.*Videos/i });

    // Intercept the generate-video API call
    const generatePromise = page.waitForResponse(
      (response) => response.url().includes('/api/generate-video') && response.request().method() === 'POST'
    );

    await textarea.fill('A red ball bouncing on a white floor');
    await button.click();

    const response = await generatePromise;
    expect(response.status()).toBe(200);

    // Verify the app transitions to rendering state
    await expect(page.getByText(/Rendering|Generating|Processing/i)).toBeVisible({ timeout: 10_000 });
  });

  test('polling starts after generation trigger', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'Direct Prompt for Sora' });
    const button = page.getByRole('button', { name: /Generate.*Videos/i });

    // Track video-status API calls
    const statusCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/video-status')) {
        statusCalls.push(request.url());
      }
    });

    await textarea.fill('A red ball bouncing on a white floor');
    await button.click();

    // Wait for at least one status polling call
    await page.waitForResponse(
      (response) => response.url().includes('/api/video-status'),
      { timeout: 15_000 }
    );

    expect(statusCalls.length).toBeGreaterThan(0);
  });
});
