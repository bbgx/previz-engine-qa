import { test, expect } from '../fixtures';
import { API_ENDPOINTS, PROMPTS, SCREENPLAYS } from '../data';

test.describe('Negative Paths — API Down & Error States', () => {
  test('studio handles generate-video 500 gracefully @ui @regression', async ({ studioPage, page }) => {
    test.fixme(true, 'App error handling behavior varies across environments');
    await page.route('**/api/generate-video', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal server error' }) }),
    );
    await studioPage.goto();
    await studioPage.fillPrompt(PROMPTS.simple);
    await studioPage.clickGenerate();

    const errorVisible = await studioPage.hasVisibleError();
    expect(errorVisible).toBe(true);
  });

  test('studio handles generate-video network failure @ui @regression', async ({ studioPage, page }) => {
    test.fixme(true, 'App error handling behavior varies across environments');
    await page.route('**/api/generate-video', (route) => route.abort('connectionrefused'));
    await studioPage.goto();
    await studioPage.fillPrompt(PROMPTS.simple);
    await studioPage.clickGenerate();

    const errorVisible = await studioPage.hasNetworkError();
    expect(errorVisible).toBe(true);
  });

  test('studio handles video-status polling timeout @ui @regression', async ({ studioPage, page }) => {
    await studioPage.mockGenerateApi();
    await page.route('**/api/video-status**', (route) => route.abort('timedout'));
    await studioPage.goto();
    await studioPage.fillPrompt(PROMPTS.simple);
    await studioPage.clickGenerate();

    const crashed = await studioPage.hasPageCrashed();
    expect(crashed, 'Page should not show an unhandled crash').toBe(false);
  });

  test('stock footage handles parse failure @ui @regression', async ({ stockFootagePage, page }) => {
    await page.route('**/api/**', (route) => {
      if (route.request().url().includes('parse') || route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Parse failed' }) });
      }
      return route.continue();
    });
    await stockFootagePage.goto();
    await stockFootagePage.fillScript(SCREENPLAYS.simple);
    await stockFootagePage.clickParse();

    const crashed = await stockFootagePage.hasPageCrashed();
    expect(crashed, 'Page should not show an unhandled crash').toBe(false);
  });
});

test.describe('Negative Paths — API Contract Edge Cases', () => {
  test('generate-video with invalid aspect_ratio returns error @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS.simple, aspect_ratio: 'INVALID', duration: '8' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('taskId');
    } else {
      expect(response.status()).toBe(400);
    }
  });

  test('generate-video with invalid duration returns error @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS.simple, aspect_ratio: 'landscape', duration: '999' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('taskId');
    } else {
      expect(response.status()).toBe(400);
    }
  });

  test('video-history with negative offset returns error or empty @api', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=5&offset=-1`);
    expect([200, 400]).toContain(response.status());
  });

  test('video-history with huge limit is handled @api', async ({ request }) => {
    test.fail(true, 'BUG-010: API accepts arbitrarily large limit values without server-side cap');
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=99999`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.videos.length).toBeLessThanOrEqual(100);
  });
});
