import { test, expect } from '../fixtures';
import { API_ENDPOINTS, PROMPTS_EDGE, CHEAP_VIDEO_PAYLOAD } from '../data';

test.describe('Prompt Edge Cases — Security & Encoding', () => {
  test('SQL injection string is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.sqlInjection, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS script tag is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.xssScript, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS img tag is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.xssImg, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS payload in history is rendered as text, not executed @security', async ({ historyPage, page }) => {
    test.skip(test.info().project.name === 'firefox', 'History page load unreliable on Firefox');
    let dialogTriggered = false;
    page.on('dialog', () => { dialogTriggered = true; });

    await historyPage.goto();
    await historyPage.switchToAllVideos();
    await historyPage.videoCountText.first().waitFor({ timeout: 10_000 });

    expect(dialogTriggered).toBe(false);

    const html = await page.content();
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('onerror=alert');
  });

  test('unicode prompt is accepted @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.unicode, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('taskId');
    }
  });

  test('emoji prompt is accepted @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.emoji, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect([200, 400]).toContain(response.status());
  });

  test('whitespace-only prompt returns 400 @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.whitespaceOnly, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).toBe(400);
  });

  test('very long prompt is handled without 500 @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.veryLong, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
  });

  test('path traversal in prompt does not cause server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.pathTraversal, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
  });

  test('template literal in prompt does not leak env vars @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.templateLiteral, ...CHEAP_VIDEO_PAYLOAD },
    });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(JSON.stringify(body)).not.toMatch(/sk-|secret|password/i);
    }
  });
});
